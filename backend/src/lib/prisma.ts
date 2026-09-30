import "dotenv/config"
import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
}

const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
})

if (process.env.VERCEL === "1") {
    attachDatabasePool(pool)
}

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
    adapter,
})

export default prisma