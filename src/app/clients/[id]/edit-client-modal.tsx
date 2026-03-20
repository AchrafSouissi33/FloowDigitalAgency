"use client"

import { useState } from "react"
import { updateClient } from "@/lib/actions"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#64748b", // Slate
  "#000000", // Black
]

export function EditClientModal({ client }: { client: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(client.name)
  const [goals, setGoals] = useState(client.yearly_goals)
  const [logoUrl, setLogoUrl] = useState(client.logo_url || "")
  const [cardColor, setCardColor] = useState(client.card_color || "#3b82f6")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await updateClient(client.id, name, goals, logoUrl, cardColor)
    setLoading(false)
    setIsOpen(false)
  }

  const handleDelete = async () => {
    if (confirm("DANGER: Are you sure you want to PERMANENTLY delete this client and all associated tasks? This action cannot be undone.")) {
      setLoading(true)
      const { deleteClient } = await import("@/lib/actions")
      await deleteClient(client.id)
      window.location.href = '/clients/all'
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl h-9 px-3 gap-2 transition-all"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit Client
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Client">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Client Name</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Yearly Goal</label>
            <input
              required
              value={goals}
              onChange={e => setGoals(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Logo URL</label>
            <input
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <img src={logoUrl} alt="Logo preview" className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-200 p-1" onError={e => (e.currentTarget.style.display = 'none')} />
                <span className="text-xs text-slate-500">Logo preview</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Card Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCardColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    cardColor === color ? "border-slate-900 ring-2 ring-offset-2 ring-blue-500 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={cardColor}
                onChange={e => setCardColor(e.target.value)}
                placeholder="#3b82f6"
                className="w-28 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: cardColor }} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-medium shadow-md transition-all"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleDelete}
            className="w-full mt-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl py-5 font-medium transition-all"
          >
            Delete Client
          </Button>
        </form>
      </Modal>
    </>
  )
}
