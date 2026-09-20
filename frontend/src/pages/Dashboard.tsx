import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const API = "http://localhost:3000/api"

const statuses = [
    "Saved",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
] as const

type Application = {
    id: number
    status: string
}

type Interview = {
    id: number
    interviewType: string
    date: string
    time: string
    application: {
        company: string
        position: string
    }
}

// Interpret the stored calendar date and time in the user's local timezone.
function interviewTimestamp(interview: Interview) {
    return new Date(
        `${interview.date.slice(0, 10)}T${interview.time}`
    ).getTime()
}


type Task = {
    id: number
    completed: boolean
}


function Dashboard() {
    const [applications, setApplications] = useState<Application[]>([])
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [refreshKey, setRefreshKey] = useState(0)
    const [now, setNow] = useState(() => Date.now())
    const [tasks, setTasks] = useState<Task[]>([])

    useEffect(() => {
        const controller = new AbortController()

        async function loadDashboard() {
            setIsLoading(true)
            setError("")

            try {
                const [applicationResponse, interviewResponse, taskResponse] =
                    await Promise.all([
                        fetch(`${API}/applications`, {
                            signal: controller.signal,
                        }),
                        fetch(`${API}/interviews`, {
                            signal: controller.signal,
                        }),
                        fetch(`${API}/tasks`, {
                            signal: controller.signal,
                        }),
                    ])

                if (
                    !applicationResponse.ok ||
                    !interviewResponse.ok ||
                    !taskResponse.ok
                ) {
                    throw new Error("Could not load dashboard data.")
                }

                const applicationData: Application[] =
                    await applicationResponse.json()
                const interviewData: Interview[] =
                    await interviewResponse.json()
                const taskData: Task[] =
                    await taskResponse.json()

                if (controller.signal.aborted) return

                setApplications(applicationData)
                setInterviews(interviewData)
                setTasks(taskData)
                setNow(Date.now())
            } catch (error) {
                if (controller.signal.aborted) return

                console.error("Error loading dashboard:", error)
                setError(
                    "Could not load the dashboard. Check that the backend is running, then retry."
                )
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadDashboard()

        return () => controller.abort()
    }, [refreshKey])
    // Keep the upcoming list current while this page stays open.
    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(Date.now())
        }, 60_000)

        return () => window.clearInterval(timer)
    }, [])

    const upcomingInterviews = interviews
        .filter((interview) => interviewTimestamp(interview) >= now)
        .sort(
            (a, b) => interviewTimestamp(a) - interviewTimestamp(b)
        )

    const stats = [
        {
            label: "Total Applications",
            value: applications.length,
        },
        {
            label: "Awaiting Response",
            value: applications.filter(
                (application) => application.status === "Applied"
            ).length,
        },
        {
            label: "Offers",
            value: applications.filter(
                (application) => application.status === "Offer"
            ).length,
        },
        {
            label: "Upcoming Interviews",
            value: upcomingInterviews.length,
        },
        {
            label: "Pending Tasks",
            value: tasks.filter((task) => !task.completed).length,
        },
    ]

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-2 text-muted-foreground">
                        Your internship search at a glance.
                    </p>
                </div>

                <Button
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setRefreshKey((current) => current + 1)}
                >
                    {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            <div className="mt-4 flex gap-4 text-sm">
                <Link
                    to="/applications"
                    className="font-medium underline underline-offset-4"
                >
                    Manage applications
                </Link>
                <Link
                    to="/interviews"
                    className="font-medium underline underline-offset-4"
                >
                    Manage interviews
                </Link>
            </div>

            {isLoading ? (
                <p role="status" className="mt-8 text-muted-foreground">
                    Loading your dashboard...
                </p>
            ) : error ? (
                <div role="alert" className="mt-8 rounded-lg border p-4">
                    <p className="text-destructive">{error}</p>
                    <Button
                        className="mt-3"
                        variant="outline"
                        onClick={() =>
                            setRefreshKey((current) => current + 1)
                        }
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {stats.map((stat) => (
                            <Card key={stat.label}>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">
                                        {stat.value}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {applications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Add your first application to see
                                        your progress here.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {statuses.map((status) => {
                                            const count = applications.filter(
                                                (application) =>
                                                    application.status === status
                                            ).length

                                            const percentage =
                                                (count / applications.length) * 100

                                            return (
                                                <div key={status}>
                                                    <div className="mb-1 flex justify-between text-sm">
                                                        <span>{status}</span>
                                                        <span>{count}</span>
                                                    </div>
                                                    <div
                                                        aria-hidden="true"
                                                        className="h-2 overflow-hidden rounded-full bg-muted"
                                                    >
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Next Interviews</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingInterviews.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No upcoming interviews scheduled.
                                    </p>
                                ) : (
                                    <ul className="space-y-4">
                                        {upcomingInterviews
                                            .slice(0, 5)
                                            .map((interview) => (
                                                <li
                                                    key={interview.id}
                                                    className="rounded-lg border p-3"
                                                >
                                                    <p className="font-medium">
                                                        {interview.application.company}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {interview.application.position}
                                                    </p>
                                                    <p className="mt-2 text-sm">
                                                        {interview.interviewType}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            interviewTimestamp(interview)
                                                        ).toLocaleString(undefined, {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default Dashboard