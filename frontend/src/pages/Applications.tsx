import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"



import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type ApplicationStatus =
    | "Saved"
    | "Applied"
    | "Interview"
    | "Offer"
    | "Rejected"


const initialApplications: Application[] = [
    {
        id: 1,
        company: "Google",
        position: "Software Engineering Intern",
        status: "Applied",
        salaryAllowance: "₱15,000/month",
        location: "Taguig",
        workSetup: "Hybrid",
        applicationDate: "2026-09-01",
    },
    {
        id: 2,
        company: "Microsoft",
        position: "Software Engineer Intern",
        status: "Interview",
        salaryAllowance: "₱15,000/month",
        location: "Makati",
        workSetup: "On-site",
        applicationDate: "2026-09-01",
    },
    {
        id: 3,
        company: "Canva",
        position: "Frontend Engineering Intern",
        status: "Saved",
        salaryAllowance: "₱15,000/month",
        location: "Remote",
        workSetup: "Remote",
        applicationDate: "2026-09-01",
    },
]

function Applications() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All")

    // Form field state for the Add Application dialog
    const [applications, setApplications] =
        useState<Application[]>(initialApplications)
    const [company, setCompany] = useState("")
    const [position, setPosition] = useState("")
    const [salaryAllowance, setSalaryAllowance] = useState("")
    const [location, setLocation] = useState("")
    const [workSetup, setWorkSetup] = useState("")
    const [status, setStatus] = useState<ApplicationStatus | "">("")
    const [error, setError] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [applicationDate, setApplicationDate] = useState("")
    const [jobUrl, setJobUrl] = useState("")
    const [source, setSource] = useState("")
    const [applicationToDelete, setApplicationToDelete] =
        useState<Application | null>(null)
    const [applicationToEdit, setApplicationToEdit] =
        useState<Application | null>(null)
    const filteredApplications = applications.filter((application) => {
        const search = searchTerm.toLowerCase()

        const matchesSearch =
            application.company.toLowerCase().includes(search) ||
            application.position.toLowerCase().includes(search)

        const matchesStatus =
            statusFilter === "All" || application.status === statusFilter

        return matchesSearch && matchesStatus
    })
    function handleSaveApplication() {
        // Prevent submission when any required field is missing.
        // Job URL is intentionally excluded because it is optional.
        if (
            !company ||
            !position ||
            !location ||
            !workSetup ||
            !status ||
            !applicationDate ||
            !salaryAllowance
        ) {
            setError("Please complete all fields.")
            return
        }

        if (applicationToEdit) {
            setApplications((currentApplications) =>
                currentApplications.map((application) =>
                    application.id === applicationToEdit.id
                        ? {
                            ...application,
                            company,
                            position,
                            location,
                            workSetup,
                            status,
                            salaryAllowance,
                            applicationDate,
                            jobUrl,
                            source,
                        }
                        : application
                )
            )

            setCompany("")
            setPosition("")
            setLocation("")
            setWorkSetup("")
            setStatus("")
            setSalaryAllowance("")
            setApplicationDate("")
            setJobUrl("")
            setSource("")
            setApplicationToEdit(null)
            setIsDialogOpen(false)

            return
        }
        // Clear previous validation error
        setError("")
        // Create a new application using the current form values.
        // Date.now() is a temporary ID until the backend/database generates IDs.
        const newApplication: Application = {
            id: Date.now(),
            company,
            position,
            status,
            salaryAllowance,
            location,
            workSetup,
            applicationDate,
            jobUrl,
            source,
        }
        // Add the new application without modifying the existing state array.
        setApplications((currentApplications) => [
            ...currentApplications,
            newApplication,
        ])

        //Reset form fields after submission
        setCompany("")
        setPosition("")
        setLocation("")
        setWorkSetup("")
        setStatus("")
        setSalaryAllowance("")
        setApplicationDate("")
        setJobUrl("")
        setSource("")

        // Close the Add Application dialog.
        setIsDialogOpen(false)
    }
    // Edit an existing application by populating the Add Application dialog with the selected application's data.
    function handleStartEdit(application: Application) {
        setApplicationToEdit(application)

        setCompany(application.company)
        setPosition(application.position)
        setLocation(application.location)
        setSalaryAllowance(application.salaryAllowance || "")
        setWorkSetup(application.workSetup)
        setStatus(application.status)
        setApplicationDate(application.applicationDate)
        setJobUrl(application.jobUrl || "")
        setSource(application.source || "")

        setIsDialogOpen(true)
    }


    // Deletes an application from the applications state array based on its ID.
    function handleDeleteApplication(id: number) {
        setApplications((currentApplications) =>
            currentApplications.filter((application) => application.id !== id)
        )
    }

    return (
        <div>
            <div className="mb-4 flex gap-3">
                <Input
                    placeholder="Search by company or position..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />

                <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                        setStatusFilter(value as ApplicationStatus | "All")
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Saved">Saved</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Page header containing the title and Add Application dialog */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Applications
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        Manage and track your internship applications.
                    </p>
                </div>

                {/* Add Application popup dialog */}
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open)

                        if (!open) {
                            setError("")
                            setApplicationToEdit(null)

                            setCompany("")
                            setPosition("")
                            setLocation("")
                            setWorkSetup("")
                            setStatus("")
                            setSalaryAllowance("")
                            setApplicationDate("")
                            setJobUrl("")
                            setSource("")
                        }
                    }}
                >
                    <DialogTrigger render={<Button />}>
                        <Plus className="h-4 w-4" />
                        Add Application
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {applicationToEdit ? "Edit Application" : "Add Application"}
                            </DialogTitle>

                            <DialogDescription>
                                Add a new internship application to your tracker.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-2">
                            <Label htmlFor="company">
                                Company
                            </Label>

                            <Input
                                id="company"
                                placeholder="e.g. Google"
                                value={company}
                                onChange={(event) => setCompany(event.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="position">
                                Position
                            </Label>

                            <Input
                                id="position"
                                placeholder="e.g. Software Engineering Intern"
                                value={position}
                                onChange={(event) => setPosition(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="salaryAllowance">
                                Salary / Allowance
                            </Label>

                            <Input
                                id="salaryAllowance"
                                placeholder="e.g. ₱15,000/month or Unpaid"
                                value={salaryAllowance}
                                onChange={(event) => setSalaryAllowance(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">
                                Location
                            </Label>

                            <Input
                                id="location"
                                placeholder="e.g. Taguig"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="jobUrl">
                                Job URL
                            </Label>

                            <Input
                                id="jobUrl"
                                type="url"
                                placeholder="https://example.com/jobs/123"
                                value={jobUrl}
                                onChange={(event) => setJobUrl(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="source">
                                Source
                            </Label>

                            <Input
                                id="source"
                                placeholder="e.g. LinkedIn"
                                value={source}
                                onChange={(event) => setSource(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="workSetup">
                                Work Setup
                            </Label>

                            <Select
                                value={workSetup}
                                onValueChange={setWorkSetup}
                            >
                                <SelectTrigger id="workSetup">
                                    <SelectValue placeholder="Select work setup" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="On-site">
                                        On-site
                                    </SelectItem>

                                    <SelectItem value="Hybrid">
                                        Hybrid
                                    </SelectItem>

                                    <SelectItem value="Remote">
                                        Remote
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="applicationDate">
                                Application Date
                            </Label>

                            <Input
                                id="applicationDate"
                                type="date"
                                value={applicationDate}
                                onChange={(event) => setApplicationDate(event.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">
                                Status
                            </Label>

                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setStatus(value as ApplicationStatus)
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Saved">
                                        Saved
                                    </SelectItem>

                                    <SelectItem value="Applied">
                                        Applied
                                    </SelectItem>

                                    <SelectItem value="Interview">
                                        Interview
                                    </SelectItem>

                                    <SelectItem value="Offer">
                                        Offer
                                    </SelectItem>

                                    <SelectItem value="Rejected">
                                        Rejected
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Only display the validation message when an error exists */}
                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={handleSaveApplication}>
                                {applicationToEdit ? "Save Changes" : "Save Application"}
                            </Button>

                        </div>

                    </DialogContent>
                </Dialog>
            </div>
            {/* Table displaying all internship applications */}
            <div className="mt-8 overflow-hidden rounded-xl border">
                <table className="w-full">
                    <thead className="bg-muted">
                        <tr>
                            {/* table header */}
                            <th className="px-4 py-3 text-left">Company</th>
                            <th className="px-4 py-3 text-left">Position</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Salary / Allowance</th>
                            <th className="px-4 py-3 text-left">Location</th>
                            <th className="px-4 py-3 text-left">Work Setup</th>
                            <th className="px-4 py-3 text-left">Application Date</th>
                            <th className="px-4 py-3 text-left">Job Link</th>
                            <th className="px-4 py-3 text-left">Source</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Convert each Application object into one table row (MAP)*/}
                        {filteredApplications.map((application) => (
                            <tr
                                key={application.id}
                                className="border-t"
                            >
                                <td className="px-4 py-3">
                                    {application.company}
                                </td>

                                <td className="px-4 py-3">
                                    {application.position}
                                </td>

                                <td className="px-4 py-3">
                                    <Badge variant={getStatusVariant(application.status)}>
                                        {application.status}
                                    </Badge>

                                </td>

                                <td className="px-4 py-3">
                                    {application.salaryAllowance || "—"}
                                </td>


                                <td className="px-4 py-3">
                                    {application.location}
                                </td>

                                <td className="px-4 py-3">
                                    {application.workSetup}
                                </td>

                                <td className="px-4 py-3">
                                    {formatDate(application.applicationDate)}
                                </td>

                                <td className="px-4 py-3">
                                    {application.jobUrl && (
                                        <a
                                            href={application.jobUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {application.source || "—"}
                                </td>
                                <td className="px-4 py-3">
                                    {/* Actions Table */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleStartEdit(application)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setApplicationToDelete(application)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Delete confirmation dialog that appears when the user clicks the trash icon for an application*/}
            <Dialog
                open={applicationToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setApplicationToDelete(null)
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete application?</DialogTitle>
                        <DialogDescription>
                            This will remove the application for{" "}
                            <strong>{applicationToDelete?.company}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setApplicationToDelete(null)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (applicationToDelete) {
                                    handleDeleteApplication(applicationToDelete.id)
                                    setApplicationToDelete(null)
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
// Defines the structure that every Application object must follow.

type Application = {
    id: number
    company: string
    position: string
    status: ApplicationStatus
    salaryAllowance?: string
    location: string
    workSetup: string
    applicationDate: string
    jobUrl?: string // ? optional query
    source?: string // ? optional query
}

// Chooses the Badge appearance based on the application's status
function getStatusVariant(status: ApplicationStatus) {
    switch (status) {
        case "Interview":
            return "default"
        case "Applied":
            return "secondary"
        case "Saved":
            return "outline"
        default:
            return "secondary"
    }
}


// Converts a stored YYYY-MM-DD date into a readable date.
// Example: "2026-09-15" → "Sep 15, 2026"
function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}


export default Applications