"use client"

import { useRole } from "@/components/role-provider"
import { useEffect, useState } from "react"
import { getDashboardTasks, updateTaskStatus, addComment } from "@/lib/actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import ReactMarkdown from "react-markdown"

export function DashboardClient() {
  const { role } = useRole()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [newCommentContent, setNewCommentContent] = useState("")

  useEffect(() => {
    let mounted = true
    setLoading(true)

    getDashboardTasks(role).then(data => {
      if (mounted) {
        setTasks(data)
        setLoading(false)
      }
    }).catch(e => {
      console.error(e)
      if (mounted) setLoading(false)
    })

    return () => { mounted = false }
  }, [role])

  const handleStatusUpdate = async (taskId: string, status: string) => {
    let note = ""
    if (status === "Blocked") {
      note = prompt("Why is this task blocked?", "Awaiting assets") || "Blocked"
    } else if (status === "Done") {
      note = "Marked as completed."
    } else {
      note = "Continued working on task."
    }
    try {
      await updateTaskStatus(taskId, status, note)
      setSelectedTask((prev: any) => prev ? { ...prev, status } : prev)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentContent.trim() || !selectedTask) return
    const author = role === "PM" ? "Achraf (PM)" : "Saif (AM)"
    try {
      await addComment(selectedTask.id, author, newCommentContent)
      setNewCommentContent("")
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Syncing...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-card-foreground">Action Required</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {role === "PM" 
              ? "Stale tasks and tasks approved by the Account Manager." 
              : "These tasks are blocked or awaiting your review."}
          </p>
        </div>
        <Badge variant="outline" className="border-red-500 text-red-600 bg-red-500/10">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} flagged
        </Badge>
      </div>

      {tasks.length === 0 ? (
         <Card className="bg-white shadow-sm border border-slate-200 rounded-3xl p-12 text-center">
            <h3 className="text-xl font-medium text-slate-800 mb-2">Clear Dashboard</h3>
            <p className="text-sm text-slate-500">No interventions required at this time.</p>
         </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map(task => (
            <Card 
              key={task.id} 
              className="bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <CardHeader className="bg-slate-50/50 pb-4 pt-6 px-6 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="rounded-full px-3 text-xs">
                    {task.client.name}
                  </Badge>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    task.status === 'Blocked' ? 'bg-red-500/20 text-red-600' : 
                    task.status === 'Ready for AM Review' ? 'bg-[#eab308]/20 text-[#eab308]' :
                    task.status === 'You Can Proceed' ? 'bg-violet-500/20 text-violet-700' :
                    'bg-sky-500/20 text-sky-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg mt-3 text-card-foreground leading-tight">{task.title}</h3>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{new Date(task.last_updated_at).toLocaleDateString()}</span>
                </div>
                {task.is_stale && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    <strong>Stale:</strong> Over 24h since last update
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => { setSelectedTask(null); setNewCommentContent(""); }}
        title="Task Details"
      >
        {selectedTask && (
          <div className="space-y-6 pb-4">
            {/* Status */}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block ${
              selectedTask.status === 'Blocked' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
              selectedTask.status === 'Done' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
              selectedTask.status === 'In Progress' ? 'bg-sky-500/10 text-sky-700 border border-sky-500/20' :
              selectedTask.status === 'Ready for AM Review' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
              selectedTask.status === 'You Can Proceed' ? 'bg-violet-500/10 text-violet-700 border border-violet-500/20' :
              'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {selectedTask.status}
            </span>

            {/* Client name */}
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{selectedTask.client?.name}</p>

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">{selectedTask.title}</h2>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Update Status:</span>
              <Button variant="outline" size="sm"
                onClick={() => handleStatusUpdate(selectedTask.id, "In Progress")}
                className={`text-xs rounded-xl border-sky-500/30 text-sky-700 hover:bg-sky-500/10 ${selectedTask.status === "In Progress" ? "bg-sky-500/20" : "bg-white"}`}
              >Still Working</Button>
              <Button variant="outline" size="sm"
                onClick={() => handleStatusUpdate(selectedTask.id, "Blocked")}
                className={`text-xs rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/10 ${selectedTask.status === "Blocked" ? "bg-red-500/20" : "bg-white"}`}
              >Blocked</Button>
              <Button variant="outline" size="sm"
                onClick={() => handleStatusUpdate(selectedTask.id, "Done")}
                className={`text-xs rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 ${selectedTask.status === "Done" ? "bg-emerald-500/20" : "bg-white"}`}
              >Done</Button>
              {role === "AM" && (
                <Button variant="outline" size="sm"
                  onClick={() => {
                    handleStatusUpdate(selectedTask.id, "You Can Proceed")
                  }}
                  className={`text-xs rounded-xl border-violet-500/30 text-violet-700 hover:bg-violet-500/10 ${selectedTask.status === "You Can Proceed" ? "bg-violet-500/20" : "bg-white"}`}
                >You Can Proceed</Button>
              )}
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Task Notes
              </h4>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 min-h-[60px] whitespace-pre-wrap">
                {selectedTask.notes ? selectedTask.notes : <span className="text-slate-400 italic">No notes added.</span>}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Timeline History
              </h4>
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                {selectedTask.logs?.map((log: any) => (
                  <div key={log.id} className="relative flex items-start gap-4">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-slate-300 shadow-sm shrink-0 z-10 mt-1"></div>
                    <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-900">{log.new_status}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600">{log.note || 'Status updated.'}</p>
                    </div>
                  </div>
                ))}
                {(!selectedTask.logs || selectedTask.logs.length === 0) && (
                  <p className="text-xs text-slate-400 italic pl-8">No history recorded.</p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Discussion
              </h4>
              <div className="space-y-3">
                {selectedTask.comments?.map((comment: any) => (
                  <div key={comment.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">{comment.author}</span>
                      <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-700 prose prose-sm max-w-none">
                      <ReactMarkdown>{comment.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                  <p className="text-xs text-slate-400 italic">No comments yet.</p>
                )}

                <form
                  onSubmit={handleAddComment}
                  className="mt-3 border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50"
                >
                  <textarea
                    value={newCommentContent}
                    onChange={e => setNewCommentContent(e.target.value)}
                    placeholder="Add a comment... (Supports Markdown)"
                    className="w-full p-4 text-sm text-slate-700 bg-transparent focus:outline-none min-h-[70px] resize-y"
                  />
                  <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-medium px-2 uppercase tracking-wider">Markdown</span>
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-4 font-medium text-xs" disabled={!newCommentContent.trim()}>
                      Comment
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
