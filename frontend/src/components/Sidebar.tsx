import { NavLink } from "react-router-dom"

import {
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ListTodo,
  ChartNoAxesCombined,
} from "lucide-react"

const navigationItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    name: "Applications",
    icon: BriefcaseBusiness,
    path: "/applications",
  },
  {
    name: "Companies",
    icon: Building2,
    path: "/companies",
  },
  {
    name: "Interviews",
    icon: CalendarDays,
    path: "/interviews",
  },
  {
    name: "Tasks",
    icon: ListTodo,
    path: "/tasks",
  },
  {
    name: "Analytics",
    icon: ChartNoAxesCombined,
    path: "/analytics",
  },
]

function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background p-6">
      <h2 className="mb-8 text-2xl font-bold">
        INTerm
      </h2>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-md px-3 py-2 ${isActive
                  ? "bg-accent font-medium"
                  : "hover:bg-accent"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar