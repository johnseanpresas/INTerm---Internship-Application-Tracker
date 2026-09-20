import { createHash, randomBytes } from "node:crypto"
import * as argon2 from "argon2"
import type {
    CookieOptions,
    Request,
    RequestHandler,
    Response,
} from "express"

import prisma from "./prisma"

export const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "http://localhost:5173"

const SESSION_COOKIE = "interm_session"
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
}

// Only these user fields may be returned to the frontend.
export const publicUserFields = {
    id: true,
    name: true,
    email: true,
} as const

export async function hashPassword(password: string) {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
    })
}

export async function verifyPassword(
    passwordHash: string,
    password: string
) {
    return argon2.verify(passwordHash, password)
}

function hashSessionToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
}

function readSessionToken(req: Request): string | null {
    const token = req.cookies?.[SESSION_COOKIE]

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/.test(token)
    ) {
        return null
    }

    return token
}

// Remove the current login session.
export async function endSession(req: Request, res: Response) {
    const token = readSessionToken(req)

    if (token) {
        await prisma.session.deleteMany({
            where: {
                tokenHash: hashSessionToken(token),
            },
        })
    }

    res.clearCookie(SESSION_COOKIE, cookieOptions)
}

// Create a fresh session after a successful login or registration.
export async function startSession(
    req: Request,
    res: Response,
    userId: number
) {
    // Replace any existing session in this browser.
    await endSession(req, res)

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

    await prisma.session.create({
        data: {
            userId,
            tokenHash: hashSessionToken(token),
            expiresAt,
        },
    })

    res.cookie(SESSION_COOKIE, token, {
        ...cookieOptions,
        maxAge: SESSION_DURATION_MS,
    })
}

// Allow data-changing browser requests only from our frontend.
export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        next()
        return
    }

    if (req.get("origin") !== FRONTEND_ORIGIN) {
        res.status(403).json({
            message: "Request origin is not allowed.",
        })
        return
    }

    next()
}

// Require a valid, unexpired session.
export const requireAuth: RequestHandler = async (req, res, next) => {
    try {
        const token = readSessionToken(req)

        if (!token) {
            res.clearCookie(SESSION_COOKIE, cookieOptions)
            res.status(401).json({
                message: "Please log in.",
            })
            return
        }

        const session = await prisma.session.findUnique({
            where: {
                tokenHash: hashSessionToken(token),
            },
            select: {
                expiresAt: true,
                user: {
                    select: publicUserFields,
                },
            },
        })

        if (!session || session.expiresAt.getTime() <= Date.now()) {
            res.clearCookie(SESSION_COOKIE, cookieOptions)
            res.status(401).json({
                message: "Your session has expired. Please log in again.",
            })
            return
        }

        // Protected routes can use this verified user.
        res.locals.user = session.user
        next()
    } catch (error) {
        console.error("Error checking session:", error)

        res.status(503).json({
            message: "Unable to check your session. Please try again.",
        })
    }
}