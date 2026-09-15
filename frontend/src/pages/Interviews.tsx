import { useState } from "react"
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
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"



type Interview = {
    id: number
    company: string
    position: string
    interviewType: string
    date: string
    time: string
    notes?: string
}

// Temporary interview data until we connect the application to a database.
const initialInterviews: Interview[] = [
    {
        id: 1,
        company: "Google",
        position: "Software Engineer Intern",
        interviewType: "Technical Interview",
        date: "2026-09-20",
        time: "10:00 AM",
        notes: "Prepare data structures and algorithms",
    },
    {
        id: 2,
        company: "Canva",
        position: "Frontend Developer Intern",
        interviewType: "HR Interview",
        date: "2026-09-23",
        time: "2:00 PM",
    },
]

function Interviews() {
    const [interviews, setInterviews] =
        useState<Interview[]>(initialInterviews)
    // Form state to manage the input values for adding a new interview
    const [company, setCompany] = useState("")
    const [position, setPosition] = useState("")
    const [interviewType, setInterviewType] = useState("")
    const [date, setDate] = useState("")
    const [time, setTime] = useState("")
    const [notes, setNotes] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    // Error state to handle form validation errors
    const [error, setError] = useState("")
    const [interviewToEdit, setInterviewToEdit] =
        useState<Interview | null>(null)

    const [interviewToDelete, setInterviewToDelete] =
        useState<Interview | null>(null)

    function handleSaveInterview() {
        // Prevent submission if any required field is missing.
        // Notes are optional.
        if (!company || !position || !interviewType || !date || !time) {
            setError("Please complete all required fields.")
            return
        }

        setError("")
        // If we're editing an existing interview, update it in the list.
        if (interviewToEdit) {
            setInterviews((currentInterviews) =>
                currentInterviews.map((interview) =>
                    interview.id === interviewToEdit.id
                        ? {
                            ...interview,
                            company,
                            position,
                            interviewType,
                            date,
                            time,
                            notes,
                        }
                        : interview
                )
            )
            // Clear the form and reset the editing state.
            setCompany("")
            setPosition("")
            setInterviewType("")
            setDate("")
            setTime("")
            setNotes("")
            setInterviewToEdit(null)
            setIsDialogOpen(false)

            return
        }

        // Create the new interview from the current form values.
        const newInterview: Interview = {
            id: Date.now(),
            company,
            position,
            interviewType,
            date,
            time,
            notes,
        }

        // Add the new interview to the existing list.
        setInterviews((currentInterviews) => [
            ...currentInterviews,
            newInterview,
        ])

        // Clear the form after a successful submission.
        setCompany("")
        setPosition("")
        setInterviewType("")
        setDate("")
        setTime("")
        setNotes("")

        // Close the dialog.
        setIsDialogOpen(false)
    }
    function handleStartEdit(interview: Interview) {
        setInterviewToEdit(interview)

        setCompany(interview.company)
        setPosition(interview.position)
        setInterviewType(interview.interviewType)
        setDate(interview.date)
        setTime(interview.time)
        setNotes(interview.notes || "")

        setIsDialogOpen(true)
    }

    function handleDeleteInterview(id: number) {
        setInterviews((currentInterviews) =>
            currentInterviews.filter((interview) => interview.id !== id)
        )
    }
    return (
        <div>
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Interviews</h1>
                    <p className="text-muted-foreground">
                        Manage your upcoming internship interviews.
                    </p>
                </div>
                {/* Add interview dialog */}
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open)

                        if (!open) {
                            setInterviewToEdit(null)
                            setCompany("")
                            setPosition("")
                            setInterviewType("")
                            setDate("")
                            setTime("")
                            setNotes("")
                            setError("")
                        }
                    }}
                >
                    <DialogTrigger render={<Button />}>
                        <Plus className="h-4 w-4" />
                        Add Interview
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {interviewToEdit ? "Edit Interview" : "Add Interview"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={company}
                                    onChange={(event) => setCompany(event.target.value)}
                                    placeholder="e.g. Google"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="position">Position</Label>
                                <Input
                                    id="position"
                                    value={position}
                                    onChange={(event) => setPosition(event.target.value)}
                                    placeholder="e.g. Software Engineer Intern"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Interview Type</Label>

                                <Select
                                    value={interviewType}
                                    onValueChange={setInterviewType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select interview type" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="HR Interview">
                                            HR Interview
                                        </SelectItem>

                                        <SelectItem value="Technical Interview">
                                            Technical Interview
                                        </SelectItem>

                                        <SelectItem value="Hiring Manager Interview">
                                            Hiring Manager Interview
                                        </SelectItem>

                                        <SelectItem value="Final Interview">
                                            Final Interview
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="time">Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={time}
                                    onChange={(event) => setTime(event.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="Optional interview notes"
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                            <Button onClick={handleSaveInterview}>
                                {interviewToEdit ? "Save Changes" : "Save Interview"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>


            </div>

            {/* Interview table */}
            <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left">Company</th>
                            <th className="px-4 py-3 text-left">Position</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Notes</th>
                            <th className="px-4 py-3 text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {interviews.map((interview) => (
                            <tr
                                key={interview.id}
                                className="border-t"
                            >
                                <td className="px-4 py-3">
                                    {interview.company}
                                </td>


                                <td className="px-4 py-3">
                                    {interview.position}
                                </td>

                                <td className="px-4 py-3">
                                    {interview.interviewType}
                                </td>

                                <td className="px-4 py-3">
                                    {interview.date}
                                </td>

                                <td className="px-4 py-3">
                                    {interview.time}
                                </td>

                                <td className="px-4 py-3">
                                    {interview.notes || "—"}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleStartEdit(interview)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setInterviewToDelete(interview)}
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

            {/* NEW Delete Confirmation dialog */}
            <Dialog
                open={interviewToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setInterviewToDelete(null)
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete interview?</DialogTitle>

                        <DialogDescription>
                            This will remove the interview with{" "}
                            <strong>{interviewToDelete?.company}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setInterviewToDelete(null)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (interviewToDelete) {
                                    handleDeleteInterview(interviewToDelete.id)
                                    setInterviewToDelete(null)
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default Interviews