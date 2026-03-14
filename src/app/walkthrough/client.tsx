"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { updateTaskStatus, addComment } from "@/lib/actions"
import ReactMarkdown from 'react-markdown'
import { useRouter } from "next/navigation"

type TaskStatus = "working" | "blocked" | "done" | "ok" | null

// Helper to render a DB status badge
function DbStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Blocked": "bg-red-500/10 text-red-600 border border-red-500/20",
    "Done": "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    "In Progress": "bg-sky-500/10 text-sky-700 border border-sky-500/20",
    "Ready for AM Review": "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    "You Can Proceed": "bg-violet-500/10 text-violet-700 border border-violet-500/20",
    "Not Started": "bg-slate-100 text-slate-500 border border-slate-200",
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${styles[status] || styles["Not Started"]}`}>
      {status}
    </span>
  )
}

export function WalkthroughClient({ initialClients }: { initialClients: any[] }) {
  const router = useRouter()
  const validClients = initialClients.filter(c => c.tasks && c.tasks.length > 0)
  
  const [currentClientIndex, setCurrentClientIndex] = useState(0)
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({})
  const [openDropdown, setOpenDropdown] = useState<{ taskId: string; type: "blocked" | "done" } | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [role, setRole] = useState<string>("PM")
  // AM-specific: task detail modal
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  // AM-specific: which tasks the AM has acknowledged
  const [acknowledgedTasks, setAcknowledgedTasks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setRole(localStorage.getItem("app_role") || "PM")
  }, [])

  const toggleComments = (taskId: string) => {
    setExpandedComments(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  // ---- PM: status update (writes to DB) ----
  const handleStatusUpdate = async (taskId: string, status: TaskStatus, dbStatus: string) => {
    setTaskStatuses((prev) => ({ ...prev, [taskId]: status }))
    setOpenDropdown(null)

    let note = ""
    if (dbStatus === "Blocked") {
      note = prompt("Why is this task blocked?", "Awaiting client assets") || "Blocked"
    } else if (dbStatus === "Done") {
      note = "Marked as completed in Walkthrough."
    } else {
      note = "Continued working on task."
    }

    try {
      await updateTaskStatus(taskId, dbStatus, note)
    } catch (e) {
      console.error(e)
    }
  }

  // ---- AM: "OK" acknowledgment (local only, no DB write) ----
  const handleAcknowledge = (taskId: string) => {
    setAcknowledgedTasks(prev => ({ ...prev, [taskId]: true }))
  }

  const currentClient = validClients[currentClientIndex]

  // PM: all tasks must have a status chosen in-session
  // AM: all tasks must be acknowledged
  const allTasksProcessed = role === "AM"
    ? currentClient?.tasks.every((task: any) => acknowledgedTasks[task.id])
    : currentClient?.tasks.every((task: any) => taskStatuses[task.id] !== undefined && taskStatuses[task.id] !== null)

  useEffect(() => {
    if (currentClient && allTasksProcessed) {
      const timer = setTimeout(() => {
        if (currentClientIndex < validClients.length - 1) {
          setCurrentClientIndex(prev => prev + 1)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [allTasksProcessed, currentClientIndex, validClients.length, currentClient])

  const nextClient = () => {
    if (currentClientIndex < validClients.length - 1) {
      setCurrentClientIndex(prev => prev + 1)
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "working":
        return <Badge className="bg-sky-500/20 text-sky-700 border-sky-500/30 hover:bg-sky-500/30">In Progress</Badge>
      case "blocked":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30">Blocked</Badge>
      case "done":
        return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30">Done</Badge>
      case "ok":
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30">OK</Badge>
      default:
        return null
    }
  }

  if (validClients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center bg-white shadow-sm border border-slate-200 rounded-3xl">
          <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
          <p className="text-muted-foreground">No active tasks require walkthrough updates right now.</p>
        </Card>
      </div>
    )
  }

  if (!currentClient) return null

  return (
    <div className="flex justify-center items-start h-full py-4">
      <Card className="w-full max-w-2xl bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
        <CardHeader className="pb-2 pt-6 px-8">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-secondary text-muted-foreground rounded-full px-4 py-1 text-xs font-medium">
              Client {currentClientIndex + 1} of {validClients.length}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span className="text-xs text-muted-foreground">{role === "AM" ? "AM Review" : "Active Window"}</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-card-foreground mt-4 tracking-tight">{currentClient.name}</h2>
          <p className="text-sm text-muted-foreground">Goal: {currentClient.yearly_goals}</p>
        </CardHeader>

        <CardContent className="px-8 py-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            {currentClient.tasks.map((task: any) => {
              const commentCount = task.comments?.length || 0
              const isExpanded = expandedComments[task.id] || false
              const isAcknowledged = acknowledgedTasks[task.id]

              return (
                <div key={task.id} className="space-y-2">
                  <div
                    className={`group flex items-center justify-between p-5 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all duration-200 ${
                      role === "AM" ? "cursor-pointer hover:border-blue-300" : "hover:border-blue-200"
                    } ${isAcknowledged ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"}`}
                    onClick={role === "AM" ? () => setSelectedTask(task) : undefined}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isAcknowledged ? "bg-emerald-500" : "bg-blue-600/40"}`}></div>
                      <span className="text-sm font-medium text-card-foreground truncate">{task.title}</span>
                      
                      <div className="flex items-center gap-2">
                        <DbStatusBadge status={task.status} />
                        {role === "PM" && taskStatuses[task.id] && (
                          <>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            {getStatusBadge(taskStatuses[task.id])}
                          </>
                        )}
                      </div>

                      {isAcknowledged && (
                        <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-[10px]">✓ Seen</Badge>
                      )}
                    </div>

                    {/* AM: single OK button. PM: full status buttons */}
                    {role === "AM" ? (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(task.id)}
                          disabled={isAcknowledged}
                          className={`text-xs rounded-xl border-amber-500/30 text-amber-700 hover:bg-amber-500/10 ${
                            isAcknowledged ? "bg-amber-500/20 opacity-50" : ""
                          }`}
                        >
                          {isAcknowledged ? "✓ OK" : "OK"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await updateTaskStatus(task.id, "You Can Proceed", "AM approved — you can proceed.");
                            handleAcknowledge(task.id);
                          }}
                          className="text-xs rounded-xl border-violet-500/30 text-violet-700 hover:bg-violet-500/10"
                        >
                          You Can Proceed
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, "working", "In Progress")}
                          className={`text-xs rounded-xl border-sky-500/30 text-sky-700 hover:bg-sky-500/10 ${
                            taskStatuses[task.id] === "working" ? "bg-sky-500/20" : ""
                          }`}
                        >
                          Still Working
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, "blocked", "Blocked")}
                          className={`text-xs rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/10 ${
                            taskStatuses[task.id] === "blocked" ? "bg-red-500/20" : ""
                          }`}
                        >
                          Blocked
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, "done", "Done")}
                          className={`text-xs rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 ${
                            taskStatuses[task.id] === "done" ? "bg-emerald-500/20" : ""
                          }`}
                        >
                          Done
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Comments Section (PM only — AM uses modal) */}
                  {role === "PM" && (
                    <div className="pl-6 border-l-2 border-blue-100 ml-4 space-y-3">
                      <button
                        onClick={() => toggleComments(task.id)}
                        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors py-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <MessageSquare className="w-3.5 h-3.5" />
                        {commentCount} {commentCount === 1 ? "comment" : "comments"}
                      </button>

                      {isExpanded && (
                        <>
                          {task.comments?.length > 0 && (
                            <div className="space-y-3 pt-1">
                              {task.comments.map((comment: any) => (
                                <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm group/comment relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-slate-700">{comment.author}</span>
                                    <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span>
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
                                    <div className="text-slate-600 prose prose-sm prose-blue max-w-none group-hover/comment:pr-12">
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
                            </div>
                          )}
                            
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const content = (form.elements.namedItem('content') as HTMLInputElement).value;
                              const author = "Achraf (PM)";
                              if (!content.trim()) return;
                              try {
                                await addComment(task.id, author, content);
                                form.reset();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="flex gap-3"
                          >
                            <input
                              name="content"
                              placeholder="Add a comment with Markdown..."
                              className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                            />
                            <Button type="submit" size="sm" className="bg-white text-blue-600 border border-slate-200 hover:bg-slate-50 rounded-xl px-4 font-medium shadow-sm transition-all whitespace-nowrap">
                              Post
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  )}

                  {/* AM: show a small comment count badge below the task */}
                  {role === "AM" && commentCount > 0 && (
                    <div className="pl-10 py-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> {commentCount} {commentCount === 1 ? "comment" : "comments"} — click task to view
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-6 pt-2 flex justify-end">
          <Button
            onClick={nextClient}
            disabled={!allTasksProcessed || currentClientIndex >= validClients.length - 1}
            className={`rounded-2xl px-6 py-3 text-sm font-medium transition-all ${
              allTasksProcessed
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            {currentClientIndex >= validClients.length - 1 && allTasksProcessed ? "All Done" : "Next Client"} <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>

      {/* ---- AM Task Detail Modal ---- */}
      <Modal
        isOpen={!!selectedTask && role === "AM"}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
      >
        {selectedTask && (
          <div className="space-y-6 pb-4">
            {/* Status Badge */}
            <DbStatusBadge status={selectedTask.status} />

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">{selectedTask.title}</h2>

            {/* Quick Actions — Status Update */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Update Status:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await updateTaskStatus(selectedTask.id, "In Progress", "Continued working on task.");
                  setSelectedTask((prev: any) => prev ? { ...prev, status: "In Progress" } : prev);
                }}
                className={`text-xs rounded-xl border-sky-500/30 text-sky-700 hover:bg-sky-500/10 ${
                  selectedTask.status === "In Progress" ? "bg-sky-500/20" : "bg-white"
                }`}
              >
                Still Working
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const reason = prompt("Why is this task blocked?", "Awaiting client assets") || "Blocked";
                  await updateTaskStatus(selectedTask.id, "Blocked", reason);
                  setSelectedTask((prev: any) => prev ? { ...prev, status: "Blocked" } : prev);
                }}
                className={`text-xs rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/10 ${
                  selectedTask.status === "Blocked" ? "bg-red-500/20" : "bg-white"
                }`}
              >
                Blocked
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await updateTaskStatus(selectedTask.id, "Done", "Marked as completed.");
                  setSelectedTask((prev: any) => prev ? { ...prev, status: "Done" } : prev);
                }}
                className={`text-xs rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 ${
                  selectedTask.status === "Done" ? "bg-emerald-500/20" : "bg-white"
                }`}
              >
                Done
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await updateTaskStatus(selectedTask.id, "You Can Proceed", "AM approved — you can proceed.");
                  setSelectedTask((prev: any) => prev ? { ...prev, status: "You Can Proceed" } : prev);
                }}
                className={`text-xs rounded-xl border-violet-500/30 text-violet-700 hover:bg-violet-500/10 ${
                  selectedTask.status === "You Can Proceed" ? "bg-violet-500/20" : "bg-white"
                }`}
              >
                You Can Proceed
              </Button>
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

            {/* History Log */}
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
                
                {/* Comment form for AM */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const content = (form.elements.namedItem('amComment') as HTMLInputElement).value;
                    if (!content.trim()) return;
                    try {
                      await addComment(selectedTask.id, "Saif (AM)", content);
                      form.reset();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="mt-3 border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50"
                >
                  <textarea 
                    name="amComment"
                    placeholder="Add a comment as Saif (AM)..."
                    className="w-full p-4 text-sm text-slate-700 bg-transparent focus:outline-none min-h-[70px] resize-y"
                  />
                  <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-medium px-2 uppercase tracking-wider">Markdown</span>
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-4 font-medium text-xs">
                      Comment
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Acknowledge from modal too */}
            {!acknowledgedTasks[selectedTask.id] && (
              <Button
                onClick={() => { handleAcknowledge(selectedTask.id); setSelectedTask(null); }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-5 font-medium shadow-md"
              >
                Mark as OK ✓
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
