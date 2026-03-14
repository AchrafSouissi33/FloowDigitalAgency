"use client"

import { useState } from "react"
import { createClient } from "@/lib/actions"
import { Modal } from "./ui/modal"
import { Button } from "./ui/button"
import { Plus } from "lucide-react"

const COLOR_PRESETS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#6366f1", "#64748b", "#000000",
]

export function AddClientModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cardColor, setCardColor] = useState("#3b82f6")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const goals = formData.get("goals") as string
    const logoUrl = formData.get("logoUrl") as string
    
    await createClient(name, goals, logoUrl, cardColor)
    setLoading(false)
    setIsOpen(false)
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        size="icon" 
        className="rounded-xl bg-blue-600 border-0 hover:bg-blue-700 h-10 w-10 text-white shadow-md transition-all"
      >
        <Plus className="w-4 h-4" />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Client">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">Client Name</label>
            <input 
              required
              id="name"
              name="name" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="goals" className="text-sm font-medium text-slate-700">Yearly Goal</label>
            <input 
              required
              id="goals"
              name="goals" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="e.g. Double organic traffic"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="logoUrl" className="text-sm font-medium text-slate-700">Logo URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input 
              id="logoUrl"
              name="logoUrl" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Card Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCardColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                    cardColor === color ? "border-slate-900 ring-2 ring-offset-1 ring-blue-500 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-medium shadow-md transition-all"
          >
            {loading ? "Creating..." : "Create Client"}
          </Button>
        </form>
      </Modal>
    </>
  )
}
