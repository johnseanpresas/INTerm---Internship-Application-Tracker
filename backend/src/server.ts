import type { Request, Response } from "express"
import express from "express"
import cors from "cors"
import prisma from "./lib/prisma"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth"
import {
    FRONTEND_ORIGIN,
    requireAuth,
    requireTrustedOrigin,
} from "./lib/auth"


const app = express()
const PORT = 3000


// Allow requests from the React development server
app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
}))

app.use(express.json({ limit: "16kb" }))
app.use(cookieParser())

app.use("/api/auth", authRouter)

// All tracker endpoints below this point require a valid login.
app.use("/api", requireTrustedOrigin, requireAuth)

app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store")
    next()
})


// Basic API test route.
app.get("/api", (req, res) => {
    res.json({
        message: "INTerm API is running",
    })
})

// Return all internship applications.
app.get("/api/applications", async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            where: {
                userId: res.locals.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return res.json(applications)
    } catch (error) {
        console.error("Error fetching applications:", error)

        return res.status(500).json({
            message: "Failed to fetch applications.",
        })
    }
})


// Create a new internship application.
app.post("/api/applications", async (req, res) => {
    try {
        const {
            company,
            position,
            status,
            location,
            workSetup,
            applicationDate,
            jobUrl,
            source,
            salaryAmount,
            salaryCurrency,
            salaryPeriod,
        } = req.body

        if (
            !company ||
            !position ||
            !status ||
            !location ||
            !workSetup ||
            !applicationDate
        ) {
            return res.status(400).json({
                message: "Please complete all required fields.",
            })
        }

        const newApplication = await prisma.application.create({
            data: {
                userId: res.locals.user.id,
                company,
                position,
                status,
                location,
                workSetup,

                applicationDate: new Date(
                    `${applicationDate}T00:00:00`
                ),

                jobUrl: jobUrl || null,
                source: source || null,

                salaryAmount: salaryAmount
                    ? Number(salaryAmount)
                    : null,

                salaryCurrency: salaryCurrency || null,
                salaryPeriod: salaryPeriod || null,
            },
        })

        return res.status(201).json(newApplication)
    } catch (error) {
        console.error("Error creating application:", error)

        return res.status(500).json({
            message: "Failed to create application.",
        })
    }
})

// Update an existing application.
app.put("/api/applications/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        const {
            company,
            position,
            status,
            location,
            workSetup,
            applicationDate,
            jobUrl,
            source,
            salaryAmount,
            salaryCurrency,
            salaryPeriod,
        } = req.body

        const updatedApplication = await prisma.application.update({
            where: {
                id,
                userId: res.locals.user.id,
            },
            data: {
                company,
                position,
                status,
                location,
                workSetup,

                ...(applicationDate
                    ? { applicationDate: new Date(`${applicationDate}T00:00:00`) }
                    : {}),

                jobUrl: jobUrl || null,
                source: source || null,

                salaryAmount: salaryAmount
                    ? Number(salaryAmount)
                    : null,

                salaryCurrency: salaryCurrency || null,
                salaryPeriod: salaryPeriod || null,
            },
        })

        return res.json(updatedApplication)
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2025"
        ) {
            return res.status(404).json({
                message: "Application not found.",
            })
        }

        console.error("Error updating application:", error)

        return res.status(500).json({
            message: "Failed to update application.",
        })
    }
})

// Delete an application owned by the signed-in user.
app.delete("/api/applications/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid application ID.",
            })
        }

        const result = await prisma.application.deleteMany({
            where: {
                id,
                userId: res.locals.user.id,
            },
        })

        if (result.count === 0) {
            return res.status(404).json({
                message: "Application not found.",
            })
        }

        return res.status(204).send()
    } catch {
        return res.status(500).json({
            message: "Failed to delete application.",
        })
    }
})


// Return all interviews with their related application.
// Return interviews belonging to this user's applications.
app.get("/api/interviews", async (_req, res) => {
    try {
        const interviews = await prisma.interview.findMany({
            where: {
                application: {
                    userId: res.locals.user.id,
                },
            },
            include: {
                application: true,
            },
            orderBy: [
                { date: "asc" },
                { time: "asc" },
            ],
        })

        return res.json(interviews)
    } catch {
        return res.status(500).json({
            message: "Failed to fetch interviews.",
        })
    }
})

// Shared validation and saving for POST and PUT.
async function saveInterview(req: Request, res: Response) {
    try {
        const userId = res.locals.user.id
        const editing = req.method === "PUT"
        const interviewId = Number(req.params.id)
        const body = req.body ?? {}

        const {
            applicationId,
            interviewType,
            date,
            time,
            notes,
        } = body

        if (
            editing &&
            (!Number.isSafeInteger(interviewId) || interviewId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid interview ID.",
            })
        }

        if (
            typeof applicationId !== "number" ||
            !Number.isSafeInteger(applicationId) ||
            applicationId <= 0 ||
            typeof interviewType !== "string" ||
            !interviewType.trim() ||
            typeof date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            typeof time !== "string" ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
            (notes != null && typeof notes !== "string")
        ) {
            return res.status(400).json({
                message: "Provide an application, interview type, valid date, and time.",
            })
        }

        const interviewDate = new Date(`${date}T00:00:00.000Z`)

        if (
            Number.isNaN(interviewDate.getTime()) ||
            interviewDate.toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                message: "Please provide a valid interview date.",
            })
        }

        // The selected application must also belong to this user.
        const application = await prisma.application.findUnique({
            where: {
                id: applicationId,
                userId,
            },
            select: {
                id: true,
            },
        })

        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
            })
        }

        const data = {
            interviewType: interviewType.trim(),
            date: interviewDate,
            time,
            notes: notes?.trim() || null,
            application: {
                connect: {
                    id: applicationId,
                    userId,
                },
            },
        }

        if (editing) {
            const interview = await prisma.interview.update({
                where: {
                    id: interviewId,
                    application: {
                        userId,
                    },
                },
                data,
                include: {
                    application: true,
                },
            })

            return res.json(interview)
        }

        const interview = await prisma.interview.create({
            data,
            include: {
                application: true,
            },
        })

        return res.status(201).json(interview)
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2025"
        ) {
            return res.status(404).json({
                message: "Interview or application not found.",
            })
        }

        return res.status(500).json({
            message: "Failed to save interview.",
        })
    }
}

app.post("/api/interviews", saveInterview)
app.put("/api/interviews/:id", saveInterview)

// Delete only interviews belonging to this user's applications.
app.delete("/api/interviews/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid interview ID.",
            })
        }

        const result = await prisma.interview.deleteMany({
            where: {
                id,
                application: {
                    userId: res.locals.user.id,
                },
            },
        })

        if (result.count === 0) {
            return res.status(404).json({
                message: "Interview not found.",
            })
        }

        return res.status(204).send()
    } catch {
        return res.status(500).json({
            message: "Failed to delete interview.",
        })
    }
})

// Return this user's tasks, with unfinished tasks first.
app.get("/api/tasks", async (_req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: res.locals.user.id,
            },
            include: {
                application: true,
            },
            orderBy: [
                { completed: "asc" },
                { dueDate: { sort: "asc", nulls: "last" } },
                { createdAt: "desc" },
            ],
        })

        return res.json(tasks)
    } catch {
        return res.status(500).json({
            message: "Failed to fetch tasks.",
        })
    }
})

// Create a task, optionally linked to an application.
app.post("/api/tasks", async (req, res) => {
    try {
        const { title, notes, dueDate, applicationId } = req.body ?? {}

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Please enter a task title.",
            })
        }

        if (notes != null && typeof notes !== "string") {
            return res.status(400).json({
                message: "Notes must be text.",
            })
        }

        let parsedDueDate: Date | null = null

        if (dueDate != null && dueDate !== "") {
            if (
                typeof dueDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
            ) {
                return res.status(400).json({
                    message: "Due date must use YYYY-MM-DD.",
                })
            }

            parsedDueDate = new Date(`${dueDate}T00:00:00.000Z`)

            if (
                Number.isNaN(parsedDueDate.getTime()) ||
                parsedDueDate.toISOString().slice(0, 10) !== dueDate
            ) {
                return res.status(400).json({
                    message: "Please enter a valid due date.",
                })
            }
        }

        let linkedApplicationId: number | null = null

        if (applicationId != null && applicationId !== "") {
            if (
                typeof applicationId !== "number" ||
                !Number.isSafeInteger(applicationId) ||
                applicationId <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid application ID.",
                })
            }

            const application = await prisma.application.findUnique({
                where: {
                    id: applicationId,
                    userId: res.locals.user.id,
                },
            })

            if (!application) {
                return res.status(404).json({
                    message: "Application not found.",
                })
            }

            linkedApplicationId = applicationId
        }

        const task = await prisma.task.create({
            data: {
                userId: res.locals.user.id,
                title: title.trim(),
                notes: notes?.trim() || null,
                dueDate: parsedDueDate,
                applicationId: linkedApplicationId,
            },
            include: {
                application: true,
            },
        })

        return res.status(201).json(task)
    } catch (error) {
        console.error("Error creating task:", error)

        return res.status(500).json({
            message: "Failed to create task.",
        })
    }
})

// Complete or reopen a task owned by the signed-in user.
app.patch("/api/tasks/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { completed } = req.body ?? {}

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid task ID.",
            })
        }

        if (typeof completed !== "boolean") {
            return res.status(400).json({
                message: "Completed must be true or false.",
            })
        }

        const updatedTask = await prisma.task.update({
            where: {
                id,
                userId: res.locals.user.id,
            },
            data: { completed },
            include: {
                application: true,
            },
        })

        return res.json(updatedTask)
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2025"
        ) {
            return res.status(404).json({
                message: "Task not found.",
            })
        }

        return res.status(500).json({
            message: "Failed to update task.",
        })
    }
})

// Delete a task.
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid task ID.",
            })
        }

        const result = await prisma.task.deleteMany({
            where: {
                id,
                userId: res.locals.user.id,
            },
        })

        if (result.count === 0) {
            return res.status(404).json({
                message: "Task not found.",
            })
        }

        return res.status(204).send()
    } catch (error) {
        console.error("Error deleting task:", error)

        return res.status(500).json({
            message: "Failed to delete task.",
        })
    }
})

// Start the server and listen for incoming requests.
app.listen(PORT, () => {
    console.log(`INTerm API running on http://localhost:${PORT}`)
})