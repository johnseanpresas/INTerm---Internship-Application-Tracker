import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const API = "http://localhost:3000/api"

type Application = {
    id: number
    company: string
    position: string
}

type Interview = {
    id: number
    applicationId: number
    interviewType: string
    date: string
    time: string
    notes: string | null
    application: Application
}

type InterviewForm = {
    applicationId: string
    interviewType: string
    date: string
    time: string
    notes: string
}

const emptyForm: InterviewForm = {
    applicationId: "",
    interviewType: "",
    date: "",
    time: "",
    notes: "",
}

const interviewTypes = [
    "HR Interview",
    "Technical Interview",
    "Hiring Manager Interview",
    "Final Interview",
]

const selectClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm"

function sortInterviews(interviews: Interview[]) {
    return [...interviews].sort((a, b) =>
        `${a.date.slice(0, 10)}T${a.time}`.localeCompare(
            `${b.date.slice(0, 10)}T${b.time}`
        )
    )
}

// Read the API's error message when available.
async function getErrorMessage(response: Response) {
    const data = await response.json().catch(() => null)

    return typeof data?.message === "string"
        ? data.message
        : `Request failed (${response.status}).`
}

function Interviews() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")

    const [form, setForm] = useState<InterviewForm>(emptyForm)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [interviewToEdit, setInterviewToEdit] =
        useState<Interview | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

    const [interviewToDelete, setInterviewToDelete] =
        useState<Interview | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        async function loadData() {
            try {
                const [interviewResponse, applicationResponse] =
                    await Promise.all([
                        fetch(`${API}/interviews`, {
                            signal: controller.signal,
                        }),
                        fetch(`${API}/applications`, {
                            signal: controller.signal,
                        }),
                    ])

                if (!interviewResponse.ok) {
                    throw new Error(
                        await getErrorMessage(interviewResponse)
                    )
                }

                if (!applicationResponse.ok) {
                    throw new Error(
                        await getErrorMessage(applicationResponse)
                    )
                }

                const interviewData: Interview[] =
                    await interviewResponse.json()
                const applicationData: Application[] =
                    await applicationResponse.json()

                if (controller.signal.aborted) return

                setInterviews(sortInterviews(interviewData))
                setApplications(applicationData)
            } catch (error) {
                if (controller.signal.aborted) return

                setLoadError(
                    error instanceof Error
                        ? error.message
                        : "Could not load data. Please refresh."
                )
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadData()
        return () => controller.abort()
    }, [])

    function updateForm(field: keyof InterviewForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }))
    }

    function openAddDialog() {
        setInterviewToEdit(null)
        setForm({ ...emptyForm })
        setSaveError("")
        setIsDialogOpen(true)
    }

    function openEditDialog(interview: Interview) {
        setInterviewToEdit(interview)
        setForm({
            applicationId: String(interview.applicationId),
            interviewType: interview.interviewType,
            date: interview.date.slice(0, 10),
            time: interview.time,
            notes: interview.notes ?? "",
        })
        setSaveError("")
        setIsDialogOpen(true)
    }

    async function handleSaveInterview() {
        if (isSaving) return

        setIsSaving(true)
        setSaveError("")

        try {
            const url = interviewToEdit
                ? `${API}/interviews/${interviewToEdit.id}`
                : `${API}/interviews`

            const response = await fetch(url, {
                method: interviewToEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    applicationId: Number(form.applicationId),
                }),
            })

            if (!response.ok) {
                throw new Error(await getErrorMessage(response))
            }

            const savedInterview: Interview = await response.json()

            setInterviews((current) =>
                sortInterviews([
                    ...current.filter(
                        (interview) => interview.id !== savedInterview.id
                    ),
                    savedInterview,
                ])
            )

            setIsDialogOpen(false)
            setInterviewToEdit(null)
            setForm({ ...emptyForm })
        } catch (error) {
            setSaveError(
                error instanceof Error
                    ? error.message
                    : "Could not save the interview. Please try again."
            )
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteInterview() {
        if (!interviewToDelete || isDeleting) return

        const id = interviewToDelete.id
        setIsDeleting(true)
        setDeleteError("")

        try {
            const response = await fetch(`${API}/interviews/${id}`, {
                method: "DELETE",
            })

            if (!response.ok && response.status !== 404) {
                throw new Error(await getErrorMessage(response))
            }

            setInterviews((current) =>
                current.filter((interview) => interview.id !== id)
            )
            setInterviewToDelete(null)
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Could not delete the interview. Please try again."
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Interviews</h1>
                    <p className="text-muted-foreground">
                        Manage interviews for your applications.
                    </p>
                </div>

                <Button
                    onClick={openAddDialog}
                    disabled={
                        isLoading ||
                        Boolean(loadError) ||
                        applications.length === 0
                    }
                >
                    <Plus className="h-4 w-4" />
                    Add Interview
                </Button>
            </div>

            {isLoading && (
                <p className="mb-4 text-muted-foreground">
                    Loading interviews...
                </p>
            )}

            {loadError && (
                <p role="alert" className="mb-4 text-destructive">
                    {loadError} Check that the backend is running, then refresh.
                </p>
            )}

            {!isLoading && !loadError && applications.length === 0 && (
                <p className="mb-4 text-muted-foreground">
                    Add an application on the Applications page first.
                </p>
            )}

            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            {[
                                "Company",
                                "Position",
                                "Type",
                                "Date",
                                "Time",
                                "Notes",
                                "Actions",
                            ].map((heading) => (
                                <th
                                    key={heading}
                                    className="px-4 py-3 text-left"
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {!isLoading &&
                            !loadError &&
                            interviews.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No interviews scheduled yet.
                                    </td>
                                </tr>
                            )}

                        {interviews.map((interview) => (
                            <tr key={interview.id} className="border-t">
                                <td className="px-4 py-3">
                                    {interview.application.company}
                                </td>
                                <td className="px-4 py-3">
                                    {interview.application.position}
                                </td>
                                <td className="px-4 py-3">
                                    {interview.interviewType}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    {interview.date.slice(0, 10)}
                                </td>
                                <td className="px-4 py-3">
                                    {interview.time}
                                </td>
                                <td className="px-4 py-3">
                                    {interview.notes || "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Edit interview with ${interview.application.company}`}
                                            onClick={() =>
                                                openEditDialog(interview)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Delete interview with ${interview.application.company}`}
                                            onClick={() => {
                                                setDeleteError("")
                                                setInterviewToDelete(interview)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    if (!isSaving) setIsDialogOpen(open)
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {interviewToEdit ? "Edit Interview" : "Add Interview"}
                        </DialogTitle>
                        <DialogDescription>
                            Choose an application and enter the interview details.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            void handleSaveInterview()
                        }}
                    >
                        <fieldset disabled={isSaving} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="applicationId">Application</Label>
                                <select
                                    id="applicationId"
                                    className={selectClass}
                                    value={form.applicationId}
                                    onChange={(event) =>
                                        updateForm("applicationId", event.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select an application</option>
                                    {applications.map((application) => (
                                        <option
                                            key={application.id}
                                            value={application.id}
                                        >
                                            {application.company} — {application.position}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="interviewType">Interview Type</Label>
                                <select
                                    id="interviewType"
                                    className={selectClass}
                                    value={form.interviewType}
                                    onChange={(event) =>
                                        updateForm("interviewType", event.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select interview type</option>
                                    {interviewTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={form.date}
                                        onChange={(event) =>
                                            updateForm("date", event.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="time">Time</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={form.time}
                                        onChange={(event) =>
                                            updateForm("time", event.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    value={form.notes}
                                    onChange={(event) =>
                                        updateForm("notes", event.target.value)
                                    }
                                    placeholder="Optional interview notes"
                                />
                            </div>

                            {saveError && (
                                <p role="alert" className="text-sm text-destructive">
                                    {saveError}
                                </p>
                            )}

                            <Button type="submit">
                                {isSaving
                                    ? "Saving..."
                                    : interviewToEdit
                                        ? "Save Changes"
                                        : "Save Interview"}
                            </Button>
                        </fieldset>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={interviewToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setInterviewToDelete(null)
                        setDeleteError("")
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete interview?</DialogTitle>
                        <DialogDescription>
                            Delete the interview with{" "}
                            <strong>
                                {interviewToDelete?.application.company}
                            </strong>
                            ? The application will remain.
                        </DialogDescription>
                    </DialogHeader>

                    {deleteError && (
                        <p role="alert" className="text-sm text-destructive">
                            {deleteError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => setInterviewToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => void handleDeleteInterview()}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Interviews