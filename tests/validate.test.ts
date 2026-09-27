import { describe, it, expect } from "vitest";
import { isNonEmptyString, isValidEmail, escapeHtml } from "../lib/validate";
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
