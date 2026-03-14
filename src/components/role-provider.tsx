"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Role = "PM" | "AM"

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("PM")

  useEffect(() => {
    const saved = localStorage.getItem("app_role") as Role
    if (saved) setRole(saved)
  }, [])

  const handleSetRole = (newRole: Role) => {
    setRole(newRole)
    localStorage.setItem("app_role", newRole)
  }

  return (
    <RoleContext.Provider value={{ role, setRole: handleSetRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error("useRole must be used within a RoleProvider")
  return context
}
