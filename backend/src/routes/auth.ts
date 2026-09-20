import { Router } from "express"
import { rateLimit } from "express-rate-limit"

import prisma from "../lib/prisma"
import {
    endSession,
    hashPassword,
    publicUserFields,
    requireAuth,
    requireTrustedOrigin,
    startSession,
    verifyPassword,
} from "../lib/auth"

const router = Router()

router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store")
    next()
})

router.use(requireTrustedOrigin)

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many attempts. Please try again in 15 minutes.",
    },
})

function normalizeEmail(value: unknown): string | null {
    if (typeof value !== "string") return null

    const email = value.trim().toLowerCase()

    if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return null
    }

    return email
}

// Used so unknown emails still go through password verification.
let fallbackHash: string | undefined

async function getFallbackHash() {
    if (!fallbackHash) {
        fallbackHash = await hashPassword(
            "This is a placeholder, not a user account password."
        )
    }

    return fallbackHash
}

// Register and sign in.
router.post("/register", authLimiter, async (req, res) => {
    try {
        const { name, email, password } = req.body ?? {}
        const normalizedEmail = normalizeEmail(email)

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 100 ||
            !normalizedEmail
        ) {
            return res.status(400).json({
                message: "Enter a name of up to 100 characters and a valid email.",
            })
        }

        if (
            typeof password !== "string" ||
            password.length < 15 ||
            password.length > 128
        ) {
            return res.status(400).json({
                message: "Use a password between 15 and 128 characters.",
            })
        }

        const passwordHash = await hashPassword(password)

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
            },
            select: publicUserFields,
        })

        await startSession(req, res, user.id)

        return res.status(201).json({ user })
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                message: "Unable to register with that email. Try signing in.",
            })
        }

        console.error("Registration failed")

        return res.status(500).json({
            message: "Registration could not finish. Try signing in, or retry later.",
        })
    }
})

// Sign in with email and password.
router.post("/login", authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body ?? {}
        const normalizedEmail = normalizeEmail(email)

        if (
            !normalizedEmail ||
            typeof password !== "string" ||
            password.length === 0 ||
            password.length > 128
        ) {
            return res.status(401).json({
                message: "Invalid email or password.",
            })
        }

        const dummyHash = await getFallbackHash()

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        })

        const passwordMatches = await verifyPassword(
            user?.passwordHash ?? dummyHash,
            password
        )

        if (!user || !passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password.",
            })
        }

        await startSession(req, res, user.id)

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        })
    } catch {
        console.error("Login failed")

        return res.status(500).json({
            message: "Unable to sign in. Please try again.",
        })
    }
})

// Return the user associated with the current session.
router.get("/me", requireAuth, (_req, res) => {
    res.json({ user: res.locals.user })
})

// Sign out, including when the current session has expired.
router.post("/logout", async (req, res) => {
    try {
        await endSession(req, res)
        return res.status(204).send()
    } catch {
        console.error("Logout failed")

        return res.status(500).json({
            message: "Unable to sign out. Please try again.",
        })
    }
})

export default router