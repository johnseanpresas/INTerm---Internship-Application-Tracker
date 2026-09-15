import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
}

// PostgreSQL driver adapter used by Prisma to connect to the database.
const adapter = new PrismaPg({
    connectionString,
})

// Prisma Client used throughout the backend.
const prisma = new PrismaClient({
    adapter,
})

export default prisma