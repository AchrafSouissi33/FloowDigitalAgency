"use client"

import React, { useState } from "react"
import { useRole } from "./role-provider"
import { ShieldCheck, User, Key, ArrowRight, Lock } from "lucide-react"

export function IdentityGate() {
  const { authenticate } = useRole()
  const [selectedRole, setSelectedRole] = useState<"PM" | "AM" | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    setIsLoading(true)
    setError(false)

    // Artificial delay for premium feel
    setTimeout(() => {
      const success = authenticate(selectedRole, password)
      if (!success) {
        setError(true)
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-500 shadow-lg shadow-blue-500/10 transition-transform hover:scale-110">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security Hub</h1>
          <p className="text-slate-400">Confirm your identity to access Floow Digital Agency</p>
        </div>

        {!selectedRole ? (
          <div className="grid grid-cols-1 gap-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={() => setSelectedRole("PM")}
              className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <User size={24} />
              </div>
              <div>
                <div className="font-semibold text-white">Achraf</div>
                <div className="text-sm text-slate-400">Project Manager</div>
              </div>
              <ArrowRight className="ml-auto opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 text-blue-400" />
            </button>

            <button
              onClick={() => setSelectedRole("AM")}
              className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <User size={24} />
              </div>
              <div>
                <div className="font-semibold text-white">Saif</div>
                <div className="text-sm text-slate-400">Account Manager</div>
              </div>
              <ArrowRight className="ml-auto opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 text-blue-400" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <User size={18} />
              <span className="font-medium">Accessing as {selectedRole === "PM" ? "Achraf" : "Saif"}</span>
              <button 
                type="button"
                onClick={() => { setSelectedRole(null); setError(false); setPassword(""); }}
                className="ml-auto text-xs underline hover:text-blue-300"
              >
                Change
              </button>
            </div>

            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="Enter access code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className={`w-full rounded-2xl border ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:ring-blue-500/20'} bg-white/5 py-4 pl-12 pr-4 text-white outline-none ring-4 transition-all focus:border-blue-500/50`}
              />
            </div>

            {error && (
              <p className="text-center text-sm font-medium text-red-400">
                Invalid access code. Please try again.
              </p>
            )}

            <button
              disabled={isLoading || !password}
              className="relative w-full overflow-hidden rounded-2xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock size={18} />
                  <span>Enter Dashboard</span>
                </div>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          Secure Access Protocol v2.0 &bull; Floow Digital Agency
        </div>
      </div>
    </div>
  )
}
