import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

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

type Task = {
    id: number
    title: string
    notes: string | null
    dueDate: string | null
    completed: boolean
    applicationId: number | null
    application: Application | null
}

type TaskFilter = "All" | "Pending" | "Completed"

const emptyForm = {
    title: "",
    notes: "",
    dueDate: "",
    applicationId: "",
}

async function responseError(response: Response) {
    const data = await response.json().catch(() => null)

    return typeof data?.message === "string"
        ? data.message
        : `Request failed (${response.status}).`
}

function sortTasks(tasks: Task[]) {
    return [...tasks].sort(
        (a, b) =>
            Number(a.completed) - Number(b.completed) ||
            (a.dueDate ?? "9999-12-31").localeCompare(
                b.dueDate ?? "9999-12-31"
            ) ||
            b.id - a.id
    )
}

function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [actionError, setActionError] = useState("")
    const [formError, setFormError] = useState("")
    const [form, setForm] = useState(emptyForm)
    const [isSaving, setIsSaving] = useState(false)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [filter, setFilter] = useState<TaskFilter>("Pending")
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
    const [deleteError, setDeleteError] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        async function loadData() {
            try {
                const [taskResponse, applicationResponse] =
                    await Promise.all([
                        fetch(`${API}/tasks`, {
                            signal: controller.signal,
                        }),
                        fetch(`${API}/applications`, {
                            signal: controller.signal,
                        }),
                    ])

                if (!taskResponse.ok || !applicationResponse.ok) {
                    throw new Error("Could not load tasks and applications.")
                }

                const taskData: Task[] = await taskResponse.json()
                const applicationData: Application[] =
                    await applicationResponse.json()

                if (controller.signal.aborted) return

                setTasks(sortTasks(taskData))
                setApplications(applicationData)
            } catch (error) {
                if (controller.signal.aborted) return

                setLoadError(
                    error instanceof Error
                        ? error.message
                        : "Could not load data."
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

    async function createTask() {
        if (isSaving) return

        if (!form.title.trim()) {
            setFormError("Please enter a task title.")
            return
        }

        setIsSaving(true)
        setFormError("")

        try {
            const response = await fetch(`${API}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title.trim(),
                    notes: form.notes,
                    dueDate: form.dueDate || null,
                    applicationId: form.applicationId
                        ? Number(form.applicationId)
                        : null,
                }),
            })

            if (!response.ok) {
                throw new Error(await responseError(response))
            }

            const savedTask: Task = await response.json()
            setTasks((current) => sortTasks([...current, savedTask]))
            setForm({ ...emptyForm })
            setFilter("Pending")
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : "Could not save the task."
            )
        } finally {
            setIsSaving(false)
        }
    }

    async function toggleTask(task: Task) {
        if (busyId !== null) return

        setBusyId(task.id)
        setActionError("")

        try {
            const response = await fetch(`${API}/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    completed: !task.completed,
                }),
            })

            if (!response.ok) {
                throw new Error(await responseError(response))
            }

            const updatedTask: Task = await response.json()
            setTasks((current) =>
                sortTasks(
                    current.map((item) =>
                        item.id === updatedTask.id ? updatedTask : item
                    )
                )
            )
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Could not update the task."
            )
        } finally {
            setBusyId(null)
        }
    }

    async function deleteTask() {
        if (!taskToDelete || busyId !== null) return

        const id = taskToDelete.id
        setBusyId(id)
        setDeleteError("")

        try {
            const response = await fetch(`${API}/tasks/${id}`, {
                method: "DELETE",
            })

            if (!response.ok && response.status !== 404) {
                throw new Error(await responseError(response))
            }

            setTasks((current) => current.filter((task) => task.id !== id))
            setTaskToDelete(null)
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Could not delete the task."
            )
        } finally {
            setBusyId(null)
        }
    }

    const pendingCount = tasks.filter((task) => !task.completed).length
    const visibleTasks = tasks.filter((task) => {
        if (filter === "Pending") return !task.completed
        if (filter === "Completed") return task.completed
        return true
    })

    return (
        <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="mt-2 text-muted-foreground">
                Track follow-ups, deadlines, and interview preparation.
            </p>

            {isLoading && (
                <p role="status" className="mt-6">Loading tasks...</p>
            )}

            {loadError && (
                <p role="alert" className="mt-6 text-destructive">
                    {loadError} Check the backend and refresh this page.
                </p>
            )}

            {!isLoading && !loadError && (
                <>
                    <form
                        className="mt-6 rounded-lg border p-4"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void createTask()
                        }}
                    >
                        <h2 className="mb-4 text-lg font-semibold">Add Task</h2>

                        <fieldset disabled={isSaving} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="task-title">Title</Label>
                                <Input
                                    id="task-title"
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                    placeholder="Follow up on my application"
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="task-due">
                                        Due Date (optional)
                                    </Label>
                                    <Input
                                        id="task-due"
                                        type="date"
                                        value={form.dueDate}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                dueDate: event.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="task-application">
                                        Application (optional)
                                    </Label>
                                    <select
                                        id="task-application"
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.applicationId}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                applicationId: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">No linked application</option>
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
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="task-notes">Notes (optional)</Label>
                                <Input
                                    id="task-notes"
                                    value={form.notes}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            notes: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            {formError && (
                                <p role="alert" className="text-sm text-destructive">
                                    {formError}
                                </p>
                            )}

                            <Button type="submit" className="w-fit">
                                {isSaving ? "Saving..." : "Add Task"}
                            </Button>
                        </fieldset>
                    </form>

                    <div className="my-6 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            {pendingCount} pending · {tasks.length - pendingCount} completed
                        </p>

                        <div className="flex gap-2">
                            {(["All", "Pending", "Completed"] as const).map(
                                (option) => (
                                    <Button
                                        key={option}
                                        variant={filter === option ? "default" : "outline"}
                                        aria-pressed={filter === option}
                                        onClick={() => setFilter(option)}
                                    >
                                        {option}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>

                    {actionError && (
                        <p role="alert" className="mb-4 text-destructive">
                            {actionError}
                        </p>
                    )}

                    {visibleTasks.length === 0 ? (
                        <p className="rounded-lg border p-6 text-center text-muted-foreground">
                            No tasks in this view.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {visibleTasks.map((task) => (
                                <li
                                    key={task.id}
                                    className="flex items-start gap-3 rounded-lg border p-4"
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4"
                                        checked={task.completed}
                                        disabled={busyId !== null}
                                        aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}
                                        onChange={() => void toggleTask(task)}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={
                                                task.completed
                                                    ? "break-words text-muted-foreground line-through"
                                                    : "break-words font-medium"
                                            }
                                        >
                                            {task.title}
                                        </p>

                                        {task.application && (
                                            <p className="text-sm text-muted-foreground">
                                                {task.application.company} — {task.application.position}
                                            </p>
                                        )}

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {task.dueDate
                                                ? `Due: ${task.dueDate.slice(0, 10)}`
                                                : "No deadline"}
                                        </p>

                                        {task.notes && (
                                            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                                                {task.notes}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={busyId !== null}
                                        aria-label={`Delete ${task.title}`}
                                        onClick={() => {
                                            setDeleteError("")
                                            setTaskToDelete(task)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            <Dialog
                open={taskToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && busyId === null) {
                        setTaskToDelete(null)
                        setDeleteError("")
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete task?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete “{taskToDelete?.title}”.
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
                            disabled={busyId !== null}
                            onClick={() => setTaskToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={busyId !== null}
                            onClick={() => void deleteTask()}
                        >
                            {busyId !== null ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Tasks