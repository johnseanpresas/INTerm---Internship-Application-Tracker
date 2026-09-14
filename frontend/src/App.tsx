import { Route, Routes } from "react-router-dom"

import Sidebar from "@/components/Sidebar"

import Dashboard from "@/pages/Dashboard"
import Applications from "@/pages/Applications"
import Companies from "@/pages/Companies"
import Interviews from "@/pages/Interviews"
import Tasks from "@/pages/Tasks"
import Analytics from "@/pages/Analytics"

function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
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
  )
}

export default App