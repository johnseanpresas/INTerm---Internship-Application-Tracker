import express from "express"
import cors from "cors"

type Application = {
    id: number
    company: string
    position: string
    status: string
    location: string
    workSetup: string
    applicationDate: string
    jobUrl?: string
    source?: string
    salaryAllowance?: string
}

// Temporary backend data until PostgreSQL is connected.
let applications: Application[] = [
    {
        id: 1,
        company: "Google",
        position: "Software Engineer Intern",
        status: "Applied",
        location: "Manila",
        workSetup: "Hybrid",
        applicationDate: "2026-09-01",
        source: "LinkedIn",
        salaryAllowance: "₱20,000/month",
    },
]

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
app.get("/api/applications", (req, res) => {
    res.json(applications)
})
// Create a new internship application.
app.post("/api/applications", (req, res) => {
    const {
        company,
        position,
        status,
        location,
        workSetup,
        applicationDate,
        jobUrl,
        source,
        salaryAllowance,
    } = req.body

    // Validate required fields.
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

    const newApplication: Application = {
        id: Date.now(),
        company,
        position,
        status,
        location,
        workSetup,
        applicationDate,
        jobUrl,
        source,
        salaryAllowance,
    }

    applications.push(newApplication)

    return res.status(201).json(newApplication)
})

// Update an existing application.
app.put("/api/applications/:id", (req, res) => {
    const id = Number(req.params.id)

    const applicationIndex = applications.findIndex(
        (application) => application.id === id
    )

    if (applicationIndex === -1) {
        return res.status(404).json({
            message: "Application not found.",
        })
    }

    const updatedApplication: Application = {
        ...applications[applicationIndex],
        ...req.body,
        id,
    }

    applications[applicationIndex] = updatedApplication

    return res.json(updatedApplication)
})

// Delete an existing application.
app.delete("/api/applications/:id", (req, res) => {
    const id = Number(req.params.id)

    const applicationExists = applications.some(
        (application) => application.id === id
    )

    if (!applicationExists) {
        return res.status(404).json({
            message: "Application not found.",
        })
    }

    applications = applications.filter(
        (application) => application.id !== id
    )

    return res.status(204).send()
})


// Start the server and listen for incoming requests.
app.listen(PORT, () => {
    console.log(`INTerm API running on http://localhost:${PORT}`)
})