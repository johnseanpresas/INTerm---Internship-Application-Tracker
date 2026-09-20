import { Route, Routes } from "react-router-dom"

import AuthGate from "@/components/AuthGate"
import Sidebar from "@/components/Sidebar"

import Dashboard from "@/pages/Dashboard"
import Applications from "@/pages/Applications"
import Companies from "@/pages/Companies"
import Interviews from "@/pages/Interviews"
import Tasks from "@/pages/Tasks"
import Analytics from "@/pages/Analytics"

function App() {
  return (
    <AuthGate>
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </AuthGate>
  )
}

export default App