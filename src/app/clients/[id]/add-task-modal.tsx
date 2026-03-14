"use client"

import { useState } from "react"
import { createTask } from "@/lib/actions"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function AddTaskModal({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const notes = formData.get("notes") as string
    
    await createTask(clientId, title, notes)
    setLoading(false)
    setIsOpen(false)
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">Task Title</label>
            <input 
              required
              id="title"
              name="title" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="e.g. Design Homepage v2"
            />
          </div>
          <div className="space-y-2 mt-4">
            <label htmlFor="notes" className="text-sm font-medium text-slate-700">Task Notes</label>
            <textarea 
              id="notes"
              name="notes" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px]" 
              placeholder="Add details, links, or instructions here..."
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-medium shadow-md transition-all"
          >
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </form>
      </Modal>
    </>
  )
}
