import express from "express"
import cors from "cors"
import prisma from "./lib/prisma"


const app = express()
const PORT = 3000


// Allow requests from the React development server
app.use(cors({
    origin: "http://localhost:5173",
}))

// Allows the server to read JSON sent in request bodies.
app.use(express.json())


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
            },
            data: {
                company,
                position,
                status,
                location,
                workSetup,

                applicationDate: applicationDate
                    ? new Date(`${applicationDate}T00:00:00`)
                    : undefined,

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
        console.error("Error updating application:", error)

        return res.status(500).json({
            message: "Failed to update application.",
        })
    }
})

// Delete an existing application.
app.delete("/api/applications/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        await prisma.application.delete({
            where: {
                id,
            },
        })

        return res.status(204).send()
    } catch (error) {
        console.error("Error deleting application:", error)

        return res.status(500).json({
            message: "Failed to delete application.",
        })
    }
})


// Return all interviews with their related application.
app.get("/api/interviews", async (req, res) => {
    try {
        const interviews = await prisma.interview.findMany({
            include: {
                application: true,
            },
            orderBy: [
                { date: "asc" },
                { time: "asc" },
            ],
        })

        return res.json(interviews)
    } catch (error) {
        console.error("Error fetching interviews:", error)

        return res.status(500).json({
            message: "Failed to fetch interviews.",
        })
    }
})


// Create an interview linked to an existing application.
app.post("/api/interviews", async (req, res) => {
    try {
        const { applicationId, interviewType, date, time, notes } = req.body
        const id = Number(applicationId)

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
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

        const application = await prisma.application.findUnique({
            where: { id },
        })

        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
            })
        }

        const interview = await prisma.interview.create({
            data: {
                applicationId: id,
                interviewType: interviewType.trim(),
                date: interviewDate,
                time,
                notes: notes?.trim() || null,
            },
            include: {
                application: true,
            },
        })

        return res.status(201).json(interview)
    } catch (error) {
        console.error("Error creating interview:", error)

        return res.status(500).json({
            message: "Failed to create interview.",
        })
    }
})


// Delete an interview.
app.delete("/api/interviews/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid interview ID.",
            })
        }

        const result = await prisma.interview.deleteMany({
            where: { id },
        })

        if (result.count === 0) {
            return res.status(404).json({
                message: "Interview not found.",
            })
        }

        return res.status(204).send()
    } catch (error) {
        console.error("Error deleting interview:", error)

        return res.status(500).json({
            message: "Failed to delete interview.",
        })
    }
})

// Update an existing interview.
app.put("/api/interviews/:id", async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { applicationId, interviewType, date, time, notes } = req.body
        const linkedApplicationId = Number(applicationId)

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !Number.isInteger(linkedApplicationId) ||
            linkedApplicationId <= 0 ||
            typeof interviewType !== "string" ||
            !interviewType.trim() ||
            typeof date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            typeof time !== "string" ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
            (notes != null && typeof notes !== "string")
        ) {
            return res.status(400).json({
                message: "Provide valid IDs, interview type, date, and time.",
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

        const existingInterview = await prisma.interview.findUnique({
            where: { id },
        })

        if (!existingInterview) {
            return res.status(404).json({
                message: "Interview not found.",
            })
        }

        const application = await prisma.application.findUnique({
            where: { id: linkedApplicationId },
        })

        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
            })
        }

        const updatedInterview = await prisma.interview.update({
            where: { id },
            data: {
                applicationId: linkedApplicationId,
                interviewType: interviewType.trim(),
                date: interviewDate,
                time,
                notes: notes?.trim() || null,
            },
            include: {
                application: true,
            },
        })

        return res.json(updatedInterview)
    } catch (error) {
        console.error("Error updating interview:", error)

        return res.status(500).json({
            message: "Failed to update interview.",
        })
    }
})

// Start the server and listen for incoming requests.
app.listen(PORT, () => {
    console.log(`INTerm API running on http://localhost:${PORT}`)
})