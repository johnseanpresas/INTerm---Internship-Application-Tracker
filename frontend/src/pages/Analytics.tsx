import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch as fetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type Application = {
    id: number
    company: string
    status: string
    applicationDate: string
}

type CountRow = {
    label: string
    count: number
}

function CountBars({ rows }: { rows: CountRow[] }) {
    const maximum = Math.max(1, ...rows.map((row) => row.count))

    return (
        <div className="space-y-4">
            {rows.map((row) => (
                <div key={row.label}>
                    <div className="mb-1 flex justify-between gap-4 text-sm">
                        <span className="break-words">{row.label}</span>
                        <span className="font-medium">{row.count}</span>
                    </div>
                    <div
                        aria-hidden="true"
                        className="h-3 overflow-hidden rounded-full bg-muted"
                    >
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{
                                width: `${(row.count / maximum) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

function Analytics() {
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [refreshKey, setRefreshKey] = useState(0)
    const [asOf, setAsOf] = useState(() => new Date())

    useEffect(() => {
        const controller = new AbortController()

        async function loadApplications() {
            setIsLoading(true)
            setError("")

            try {
                const response = await fetch(
                    "http://localhost:3000/api/applications",
                    { signal: controller.signal }
                )

                if (!response.ok) {
                    throw new Error("Failed to load applications.")
                }

                const data: Application[] = await response.json()

                if (controller.signal.aborted) return

                setApplications(data)
                setAsOf(new Date())
            } catch (error) {
                if (controller.signal.aborted) return

                console.error("Error loading analytics:", error)
                setError(
                    "Could not load analytics. Check that the backend is running, then retry."
                )
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadApplications()

        return () => controller.abort()
    }, [refreshKey])

    // Count current statuses, including any additional stored status.
    const knownStatuses = [
        "Saved",
        "Applied",
        "Interview",
        "Offer",
        "Rejected",
    ]

    const statusLabels = [
        ...knownStatuses,
        ...Array.from(
            new Set(
                applications
                    .map((application) => application.status)
                    .filter((status) => !knownStatuses.includes(status))
            )
        ),
    ]

    const statusRows: CountRow[] = statusLabels.map((status) => ({
        label: status,
        count: applications.filter(
            (application) => application.status === status
        ).length,
    }))

    // Merge company names that differ only in casing or extra spaces.
    const companyCounts = new Map<string, CountRow>()

    for (const application of applications) {
        const label =
            application.company.trim().replace(/\s+/g, " ") ||
            "Unspecified company"
        const key = label.toLowerCase()
        const existing = companyCounts.get(key)

        if (existing) {
            existing.count += 1
        } else {
            companyCounts.set(key, { label, count: 1 })
        }
    }

    const topCompanies = Array.from(companyCounts.values())
        .sort(
            (a, b) =>
                b.count - a.count || a.label.localeCompare(b.label)
        )
        .slice(0, 5)

    // Use the same local-date interpretation as the Applications page.
    const submittedApplications = applications.filter(
        (application) => application.status !== "Saved"
    )

    const monthlyRows: CountRow[] = Array.from(
        { length: 6 },
        (_, index) => {
            const month = new Date(
                asOf.getFullYear(),
                asOf.getMonth() - 5 + index,
                1
            )

            return {
                label: month.toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                }),
                count: submittedApplications.filter((application) => {
                    const date = new Date(application.applicationDate)

                    return (
                        date.getFullYear() === month.getFullYear() &&
                        date.getMonth() === month.getMonth()
                    )
                }).length,
            }
        }
    )

    const stats = [
        {
            label: "Tracked Applications",
            value: applications.length,
        },
        {
            label: "Unique Companies",
            value: companyCounts.size,
        },
        {
            label: "Currently Interviewing",
            value: applications.filter(
                (application) => application.status === "Interview"
            ).length,
        },
        {
            label: "Current Offers",
            value: applications.filter(
                (application) => application.status === "Offer"
            ).length,
        },
    ]

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="mt-2 text-muted-foreground">
                        Explore your application activity and current progress.
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

            {isLoading ? (
                <p role="status" className="mt-8 text-muted-foreground">
                    Loading analytics...
                </p>
            ) : error ? (
                <div role="alert" className="mt-8 rounded-lg border p-4">
                    <p className="text-destructive">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => setRefreshKey((current) => current + 1)}
                    >
                        Retry
                    </Button>
                </div>
            ) : applications.length === 0 ? (
                <div className="mt-8 rounded-lg border p-8 text-center">
                    <p className="text-muted-foreground">
                        Add your first application to start tracking progress.
                    </p>
                    <Link
                        to="/applications"
                        className="mt-3 inline-block underline underline-offset-4"
                    >
                        Go to Applications
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                                <CardTitle>Current Status Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CountBars rows={statusRows} />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Each application appears under its current
                                    status. These counts do not show past
                                    status changes.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Application Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CountBars rows={monthlyRows} />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Last six calendar months, using the
                                    application dates you entered. Records
                                    marked Saved are excluded.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Most Tracked Companies</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CountBars rows={topCompanies} />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Up to five companies, counting all tracked
                                    applications, including Saved.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default Analytics