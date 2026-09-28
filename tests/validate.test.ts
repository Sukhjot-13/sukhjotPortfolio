import { describe, it, expect, beforeEach } from "vitest";
import {
  isNonEmptyString,
  isValidEmail,
  escapeHtml,
  isHoneypotTripped,
  isWithinLimit,
  exceedsAnyLimit,
  hasDollarKey,
  pick,
  isValidExternalUrl,
  hasInvalidProjectUrl,
  CONTACT_FIELD_LIMITS,
  PROJECT_WRITE_FIELDS,
  TESTIMONIAL_WRITE_FIELDS,
} from "../lib/validate";
import {
  checkRateLimit,
  resetRateLimiter,
  clientIp,
  RATE_LIMIT_DEFAULTS,
} from "../lib/rate-limit";
import { cn } from "../lib/utils";

describe("isNonEmptyString", () => {
  it("accepts non-blank strings", () => {
    expect(isNonEmptyString("hi")).toBe(true);
  });

  it("rejects blank and non-string values", () => {
    for (const v of ["", "   ", null, undefined, 0, {}, []]) {
      expect(isNonEmptyString(v)).toBe(false);
    }
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.domain.co")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const v of ["", "plain", "a@b", "a@ b.com", "@b.com", null, 42]) {
      expect(isValidEmail(v)).toBe(false);
    }
  });
});

describe("escapeHtml", () => {
  it("neutralizes markup and quotes", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
    expect(escapeHtml("a & b 'c'")).toBe("a &amp; b &#39;c&#39;");
  });
});

describe("cn", () => {
  it("merges classes with tailwind conflicts resolved", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});

describe("isHoneypotTripped", () => {
  it("trips only when the hidden field has content", () => {
    expect(isHoneypotTripped({ website: "http://spam.example" })).toBe(true);
  });

  it("does not trip for empty, whitespace, absent, or non-string values", () => {
    expect(isHoneypotTripped({ website: "" })).toBe(false);
    expect(isHoneypotTripped({ website: "   " })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped({ website: null })).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });
});

describe("field length caps", () => {
  it("accepts values at the cap and rejects anything longer", () => {
    expect(isWithinLimit("a".repeat(120), CONTACT_FIELD_LIMITS.name)).toBe(true);
    expect(isWithinLimit("a".repeat(121), CONTACT_FIELD_LIMITS.name)).toBe(false);
  });

  it("exceedsAnyLimit flags the offending field only", () => {
    const ok = {
      name: "a".repeat(120),
      email: "a@b.com",
      message: "b".repeat(5000),
    };
    expect(exceedsAnyLimit(ok, CONTACT_FIELD_LIMITS)).toBe(false);
    expect(
      exceedsAnyLimit({ ...ok, message: "b".repeat(5001) }, CONTACT_FIELD_LIMITS)
    ).toBe(true);
    expect(
      exceedsAnyLimit({ ...ok, name: "a".repeat(121) }, CONTACT_FIELD_LIMITS)
    ).toBe(true);
  });
});

describe("hasDollarKey", () => {
  it("rejects mongo update operators at the top level", () => {
    expect(hasDollarKey({ $unset: { blurb: 1 } })).toBe(true);
    expect(hasDollarKey({ $rename: { title: "name" } })).toBe(true);
  });

  it("accepts normal payloads", () => {
    expect(hasDollarKey({ slug: "x", title: "y" })).toBe(false);
    expect(hasDollarKey(null)).toBe(false);
  });
});

describe("pick", () => {
  it("keeps only allow-listed project fields", () => {
    const body = {
      slug: "a",
      title: "A",
      blurb: "b",
      description: ["c"],
      role: "dev",
      date: "2026",
      tech: ["ts"],
      image: "img",
      gallery: [],
      demo: "https://demo.example",
      github: "https://github.example",
      featured: true,
      order: 99,
      _id: "spoofed",
      createdAt: "2020-01-01",
    };
    const picked = pick(body, PROJECT_WRITE_FIELDS);
    expect(picked).toEqual({
      slug: "a",
      title: "A",
      blurb: "b",
      description: ["c"],
      role: "dev",
      date: "2026",
      tech: ["ts"],
      image: "img",
      gallery: [],
      demo: "https://demo.example",
      github: "https://github.example",
    });
    expect("featured" in picked).toBe(false);
    expect("order" in picked).toBe(false);
    expect("_id" in picked).toBe(false);
    expect("createdAt" in picked).toBe(false);
  });

  it("drops server-controlled testimonial fields", () => {
    const picked = pick(
      { name: "n", role: "r", quote: "q", avatar: "a", order: 5 },
      TESTIMONIAL_WRITE_FIELDS
    );
    expect(picked).toEqual({ name: "n", role: "r", quote: "q", avatar: "a" });
  });

  it("returns an empty projection for non-objects", () => {
    expect(pick(null, PROJECT_WRITE_FIELDS)).toEqual({});
    expect(pick("nope", PROJECT_WRITE_FIELDS)).toEqual({});
  });
});

describe("project url validation", () => {
  it("accepts absolute http(s) URLs and empty values", () => {
    expect(isValidExternalUrl("https://a.example")).toBe(true);
    expect(isValidExternalUrl("http://a.example")).toBe(true);
    expect(isValidExternalUrl("")).toBe(true);
    expect(isValidExternalUrl(undefined)).toBe(true);
  });

  it("rejects javascript:, protocol-relative, and relative URLs", () => {
    expect(isValidExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isValidExternalUrl("//evil.example")).toBe(false);
    expect(isValidExternalUrl("/projects/x")).toBe(false);
  });

  it("flags a payload where either link is invalid", () => {
    expect(
      hasInvalidProjectUrl({
        demo: "https://ok.example",
        github: "javascript:alert(1)",
      })
    ).toBe(true);
    expect(
      hasInvalidProjectUrl({
        demo: "https://ok.example",
        github: "",
      })
    ).toBe(false);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("allows up to the limit then blocks within the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_DEFAULTS.limit; i++) {
      expect(checkRateLimit("1.1.1.1", { now }).allowed).toBe(true);
    }
    const blocked = checkRateLimit("1.1.1.1", { now });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each key independently", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_DEFAULTS.limit; i++) {
      checkRateLimit("2.2.2.2", { now });
    }
    expect(checkRateLimit("2.2.2.2", { now }).allowed).toBe(false);
    expect(checkRateLimit("3.3.3.3", { now }).allowed).toBe(true);
  });

  it("resets once the window elapses", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_DEFAULTS.limit; i++) {
      checkRateLimit("4.4.4.4", { now });
    }
    expect(checkRateLimit("4.4.4.4", { now }).allowed).toBe(false);
    expect(
      checkRateLimit("4.4.4.4", { now: now + RATE_LIMIT_DEFAULTS.windowMs + 1 })
        .allowed
    ).toBe(true);
  });

  it("evicts expired buckets during the periodic sweep", () => {
    let now = 1_000_000;
    checkRateLimit("5.5.5.5", { now });
    checkRateLimit("6.6.6.6", { now });
    now += RATE_LIMIT_DEFAULTS.windowMs * 2;
    checkRateLimit("7.7.7.7", { now });
    expect(checkRateLimit("5.5.5.5", { now }).allowed).toBe(true);
  });

  it("honours a custom limit and window", () => {
    const now = 1_000_000;
    const opts = { limit: 2, windowMs: 1000, now };
    expect(checkRateLimit("8.8.8.8", opts).allowed).toBe(true);
    expect(checkRateLimit("8.8.8.8", opts).allowed).toBe(true);
    expect(checkRateLimit("8.8.8.8", opts).allowed).toBe(false);
    expect(
      checkRateLimit("8.8.8.8", { ...opts, now: now + 1001 }).allowed
    ).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 10.10.10.10" });
    expect(clientIp(headers)).toBe("9.9.9.9");
  });

  it("falls back to other proxy headers then a shared bucket", () => {
    expect(clientIp(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
