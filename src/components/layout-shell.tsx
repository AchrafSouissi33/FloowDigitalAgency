"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Grid3X3, Play, User, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRole } from "./role-provider"
import { AddClientModal } from "./add-client-modal"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role, setRole } = useRole()

  const navItems = [
    { icon: Grid3X3, label: "DASHBOARD", href: "/dashboard" },
    { icon: Play, label: "WALKTHROUGH", href: "/walkthrough" },
    { icon: User, label: "CLIENTS", href: "/clients/all" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex">
      {/* Sidebar */}
      <aside className="w-64 p-6 flex flex-col">
        <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-6 flex-1 border border-white/30 shadow-xl flex flex-col">
          <div className="mb-8">
            <img src="https://floow.agency/wp-content/uploads/2022/04/Logo-final-7.png" alt="Floow" className="h-10 object-contain mb-3" />
            <h1 className="text-xl font-bold tracking-tight text-card-foreground">Floow Digital Agency</h1>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href) && item.href !== "#"
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-white/30 text-blue-600 border-l-4 border-blue-600"
                      : "text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>



          {/* User Profile */}
          <div className="mt-auto flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-blue-600 bg-blue-100 text-blue-700">
              <AvatarFallback>{role === "PM" ? "AC" : "SF"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{role === "PM" ? "Achraf" : "Saif"}</p>
              <p className="text-xs text-muted-foreground">{role === "PM" ? "Production Manager" : "Account Manager"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <div>
            <h1 className="text-4xl font-bold text-card-foreground tracking-tight">
              {role === "PM" ? "Production Manager (Achraf)" : "Account Manager (Saif)"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* ROLE TOGGLE */}
            <div className="bg-white/40 p-1 rounded-xl flex items-center shadow-sm border border-white/50 mr-4">
              <button 
                onClick={() => setRole("PM")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${role === "PM" ? "bg-white shadow text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
              >
                Achraf (PM)
              </button>
              <button 
                onClick={() => setRole("AM")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${role === "AM" ? "bg-white shadow text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
              >
                Saif (AM)
              </button>
            </div>

            <form action="/clients/all" className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                name="q"
                defaultValue={""}
                placeholder="Search clients..." 
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-white/50 bg-white/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64 shadow-sm"
              />
            </form>

            <AddClientModal />
            
            <Button variant="outline" size="icon" className="rounded-xl bg-card border-border hover:bg-accent h-10 w-10 border-white/50">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-3xl pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
