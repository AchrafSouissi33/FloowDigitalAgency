"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Role = "PM" | "AM"

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
  isAuthenticated: boolean
  authenticate: (role: Role, password: string) => boolean
  logout: () => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("PM")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    const savedRole = localStorage.getItem("app_role") as Role
    const authStatus = localStorage.getItem("app_authenticated") === "true"
    
    if (savedRole) setRole(savedRole)
    if (authStatus) setIsAuthenticated(true)
  }, [])

  const handleSetRole = (newRole: Role) => {
    setRole(newRole)
    localStorage.setItem("app_role", newRole)
  }

  const authenticate = (selectedRole: Role, password: string): boolean => {
    // Difficult default passwords (can be overridden by environment variables in Vercel if needed)
    // PM: floow-PM-achraf-2026!
    // AM: floow-AM-saif-2026!
    const pmPass = process.env.NEXT_PUBLIC_PASS_ACHRAF || "floow-PM-achraf-2026!"
    const amPass = process.env.NEXT_PUBLIC_PASS_SAIF || "floow-AM-saif-2026!"

    if (selectedRole === "PM" && password === pmPass) {
      setIsAuthenticated(true)
      handleSetRole("PM")
      localStorage.setItem("app_authenticated", "true")
      return true
    }
    
    if (selectedRole === "AM" && password === amPass) {
      setIsAuthenticated(true)
      handleSetRole("AM")
      localStorage.setItem("app_authenticated", "true")
      return true
    }

    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("app_authenticated")
  }

  return (
    <RoleContext.Provider value={{ 
      role, 
      setRole: handleSetRole, 
      isAuthenticated, 
      authenticate,
      logout 
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error("useRole must be used within a RoleProvider")
  return context
}
