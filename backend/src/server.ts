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


// Start the server and listen for incoming requests.
app.listen(PORT, () => {
    console.log(`INTerm API running on http://localhost:${PORT}`)
})