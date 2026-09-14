import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"



const stats = [
    {
        label: "Total Applications",
        value: 0,
    },
    {
        label: "Interviews",
        value: 0,
    },
    {
        label: "Offers",
        value: 0,
    },
    {
        label: "Pending Tasks",
        value: 0,
    },
]

function Dashboard() {
    return (
        <div>
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>

                <p className="mt-2 text-muted-foreground">
                    Track and manage your internship applications.
                </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="pb-2">
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
        </div>
    )
}

export default Dashboard