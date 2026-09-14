import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="min-h-screen bg-background p-10">
      <h1 className="text-4xl font-bold">
        INTerm
      </h1>

      <p className="mt-2 text-muted-foreground">
        Internship Application Tracker
      </p>

      <Button className="mt-6">
        Add Application
      </Button>
    </div>
  )
}

export default App