"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { updateTaskStatus, updateTaskDetails, archiveTask, unarchiveTask, deleteTask, addComment } from "@/lib/actions"
import ReactMarkdown from "react-markdown"
import { useRole } from "@/components/role-provider"

export function TaskGrid({ client, tasks }: { client: any, tasks: any[] }) {
  const { role } = useRole()
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [newCommentContent, setNewCommentContent] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")

  const openTaskModal = (task: any) => {
    setSelectedTask(task)
    setEditTitle(task.title)
    setEditNotes(task.notes || "")
    setIsEditingTitle(false)
    setIsEditingNotes(false)
  }

  const handleSaveDetails = async () => {
    if (!selectedTask) return
    try {
      const updatedTask = await updateTaskDetails(selectedTask.id, editTitle, editNotes)
      // Update local state to reflect changes instantly
      setSelectedTask((prev: any) => ({ ...prev, title: updatedTask.title, notes: updatedTask.notes }))
      setIsEditingTitle(false)
      setIsEditingNotes(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusUpdate = async (taskId: string, status: string, name: string) => {
    let note = ""
    if (name === "Blocked") {
      note = prompt("Why is this task blocked?", "Awaiting assets") || "Blocked"
    } else if (name === "Done") {
      note = "Marked as completed."
    } else {
      note = "Continued working on task."
    }

    try {
      await updateTaskStatus(taskId, name, note)
      if (role === "AM" && name === "Done") {
        await archiveTask(taskId)
      }
      // In a real app we'd refresh the data fully here or use optimistic UI.
      // Since this is a simple local app, we rely on Server Action revalidation 
      // which will refresh the page when the modal closes, or we can just update local state.
      setSelectedTask((prev: any) => ({ ...prev, status: name }))
    } catch (e) {
      console.error(e)
    }
  }

  const handleArchiveTask = async () => {
    if (!selectedTask || !confirm("Are you sure you want to archive this task?")) return
    try {
      await archiveTask(selectedTask.id)
      setSelectedTask(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUnarchiveTask = async (taskId: string) => {
    try {
      await unarchiveTask(taskId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask || !confirm("DANGER: Are you sure you want to PERMANENTLY delete this task? This action cannot be undone.")) return
    try {
      await deleteTask(selectedTask.id)
      setSelectedTask(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentContent.trim() || !selectedTask) return
    const author = localStorage.getItem("app_role") === "PM" ? "Achraf (PM)" : "Saif (AM)"
    try {
      await addComment(selectedTask.id, author, newCommentContent)
      setNewCommentContent("")
      // the real app relies on revalidatePath, but modal state needs local update here if we don't refetch
      // (For simplicity we just let a full refresh happen or close the modal if they close it)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks.map(task => (
          <div key={task.id} className="relative group/wrapper">
            <Card 
              className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-full"
              onClick={() => openTaskModal(task)}
            >
              <CardHeader className="bg-slate-50/50 pb-4 pt-6 px-6 border-b border-slate-100 group-hover:bg-blue-50/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">{task.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
                    task.status === 'Blocked' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
                    task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                    task.status === 'In Progress' ? 'bg-sky-500/10 text-sky-700 border border-sky-500/20' :
                    task.status === 'You Can Proceed' ? 'bg-violet-500/10 text-violet-700 border border-violet-500/20' :
                    'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5 flex-1 flex flex-col justify-between">
                <div>
                  {(task as any).notes ? (
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{(task as any).notes}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic line-clamp-3 mb-4">No notes added.</p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {task.comments?.length || 0}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                    {new Date(task.last_updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
            {task.is_archived && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnarchiveTask(task.id);
                }}
                className="absolute top-4 right-4 opacity-0 group-hover/wrapper:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border-blue-200 text-blue-600 hover:bg-blue-50 h-8 px-2 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore
              </Button>
            )}
          </div>
        ))}
      </div>

      <Modal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)}
        title="Task Details"
      >
        {selectedTask && (
          <div className="space-y-8 pb-4">
            <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 inline-block mb-4 ${
              selectedTask?.status === 'Blocked' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
              selectedTask?.status === 'Done' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
              selectedTask?.status === 'In Progress' ? 'bg-sky-500/10 text-sky-700 border border-sky-500/20' :
              selectedTask?.status === 'You Can Proceed' ? 'bg-violet-500/10 text-violet-700 border border-violet-500/20' :
              'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {selectedTask?.status}
            </div>
            
            {/* Title Section */}
            <div>
              {isEditingTitle ? (
                <div className="flex gap-2">
                  <input 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)}
                    className="flex-1 text-2xl font-bold text-slate-900 border border-blue-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Button size="sm" onClick={handleSaveDetails} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingTitle(false); setEditTitle(selectedTask.title) }}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-start justify-between group">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug pr-4">{selectedTask.title}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 shrink-0">Edit</Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Update Status:</span>
                <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(selectedTask.id, "working", "In Progress")}
                className={`text-xs rounded-xl border-sky-500/30 text-sky-700 hover:bg-sky-500/10 ${
                  selectedTask.status === "In Progress" ? "bg-sky-500/20" : "bg-white"
                }`}
              >
                Still Working
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(selectedTask.id, "blocked", "Blocked")}
                className={`text-xs rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/10 ${
                  selectedTask.status === "Blocked" ? "bg-red-500/20" : "bg-white"
                }`}
              >
                Blocked
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(selectedTask.id, "done", "Done")}
                className={`text-xs rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 ${
                  selectedTask.status === "Done" ? "bg-emerald-500/20" : "bg-white"
                }`}
              >
                Done
              </Button>
              {role === "AM" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedTask.id, "proceed", "You Can Proceed")}
                  className={`text-xs rounded-xl border-violet-500/30 text-violet-700 hover:bg-violet-500/10 ${
                    selectedTask.status === "You Can Proceed" ? "bg-violet-500/20" : "bg-white"
                  }`}
                >
                  You Can Proceed
                </Button>
              )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost" 
                  size="sm" 
                  onClick={handleArchiveTask}
                  className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  Archive Task
                </Button>
                <Button
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteTask}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete Task
                </Button>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-3 group">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Task Notes
                </h4>
                {!isEditingNotes && (
                   <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2 text-xs">Edit Notes</Button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea 
                    value={editNotes} 
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full text-sm text-slate-700 border border-blue-300 rounded-xl p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                    placeholder="Add detailed task notes here..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditingNotes(false); setEditNotes(selectedTask.notes || "") }}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveDetails} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save Notes</Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 min-h-[80px] whitespace-pre-wrap">
                  {selectedTask.notes ? selectedTask.notes : <span className="text-slate-400 italic">No notes have been added to this task yet.</span>}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-8 grid grid-cols-1 gap-8">
              {/* History Log */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Timeline History
                </h4>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
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
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Discussion
                </h4>
                <div className="space-y-3">
                  {selectedTask.comments?.map((comment: any) => (
                     <div key={comment.id} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm group/comment relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800">{comment.author}</span>
                          <span className="text-xs font-medium text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              className="w-full text-sm text-slate-700 border border-blue-300 rounded-xl p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y bg-white"
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={async () => {
                                try {
                                  const { editComment } = await import("@/lib/actions");
                                  await editComment(comment.id, editCommentContent);
                                  setEditingCommentId(null);
                                } catch (e) { console.error(e) }
                              }}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-700 prose prose-slate prose-sm max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-700 group-hover/comment:pr-12">
                            <ReactMarkdown>{comment.content}</ReactMarkdown>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-3 right-2 opacity-0 group-hover/comment:opacity-100 text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-6 px-2 text-xs transition-opacity"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditCommentContent(comment.content);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                  ))}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No comments yet. Start a discussion below.</p>
                  )}
                  
                  <form 
                    onSubmit={handleAddComment}
                    className="mt-4 border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow transition-colors"
                  >
                    <textarea 
                      value={newCommentContent}
                      onChange={e => setNewCommentContent(e.target.value)}
                      placeholder="Add a comment... (Supports Markdown links & tags)"
                      className="w-full p-4 text-sm text-slate-700 bg-transparent focus:outline-none min-h-[80px] resize-y"
                    />
                    <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium px-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        Markdown Supported
                      </span>
                      <Button 
                        type="submit" 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-4 font-medium tracking-wide text-xs group"
                        disabled={!newCommentContent.trim()}
                      >
                        Comment
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>
    </>
  )
}
