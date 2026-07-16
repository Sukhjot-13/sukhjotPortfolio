import mongoose from 'mongoose'

const cached: { conn?: mongoose.Connection } = {}

export async function connectDB() {
  if (cached.conn) return cached.conn

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Create a .env.local file with MONGODB_URI=mongodb://localhost:27017/sukhjot-portfolio',
    )
  }

  const conn = await mongoose.connect(uri)
  cached.conn = conn.connection
  console.log('✅ MongoDB connected:', conn.connection.host)
  return cached.conn
}
