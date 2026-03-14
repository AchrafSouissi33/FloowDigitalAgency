import { getClientWithTasks, getClients, getArchivedClients, archiveClient } from "@/lib/actions"
import { Card, CardHeader } from "@/components/ui/card"
import { AddTaskModal } from "./add-task-modal"
import { TaskGrid } from "./task-grid"
import { EditClientModal } from "./edit-client-modal"
import { Trash2, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ClientPage(props: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const q = searchParams.q as string | undefined;
  const clientId = params.id
  
  // All clients view
  if (clientId === 'all') {
    let clients = await getClients();
    const archivedClients = await getArchivedClients();

    if (q) {
      clients = clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
    }

    return (
      <div className="p-8 space-y-12">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Active Clients {q && `(Searching: "${q}")`}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clients.map(c => {
              const taskCount = (c as any)._count?.tasks || 0;
              return (
                <div key={c.id} className="group relative h-full">
                  <a href={`/clients/${c.id}`}>
                    <Card className="bg-white hover:shadow-lg cursor-pointer transition-all border border-slate-200 shadow-sm rounded-3xl overflow-hidden h-full flex flex-col">
                      <div className="h-2 w-full" style={{ backgroundColor: (c as any).card_color || '#3b82f6' }} />
                      <CardHeader className="flex flex-row items-center gap-4 flex-1">
                        {(c as any).logo_url ? (
                          <img src={(c as any).logo_url} alt={c.name} className="w-12 h-12 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm" style={{ backgroundColor: (c as any).card_color || '#3b82f6' }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{c.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{c.yearly_goals}</p>
                        </div>
                      </CardHeader>
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                         <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                           {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
                         </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">View Details →</p>
                      </div>
                    </Card>
                  </a>
                  <form 
                    action={async () => {
                      'use server';
                      await archiveClient(c.id);
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button 
                      type="submit"
                      className="p-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-200 shadow-sm transition-all"
                      title="Archive Client"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )
            })}
            {clients.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500">No active clients found.</p>
              </div>
            )}
          </div>
        </div>

        {archivedClients.length > 0 && (
          <div className="opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
              <Archive className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Archived Clients</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {archivedClients.map(c => (
                <a key={c.id} href={`/clients/${c.id}`} className="group">
                  <Card className="bg-slate-50/50 hover:bg-white hover:shadow-md cursor-pointer transition-all border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100">
                    <div className="h-1 w-full bg-slate-300 group-hover:bg-blue-300" />
                    <div className="p-4 flex items-center gap-3">
                      {(c as any).logo_url ? (
                        <img src={(c as any).logo_url} alt={c.name} className="w-8 h-8 object-contain rounded-lg bg-white border border-slate-200 p-1 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: (c as any).card_color || '#cbd5e1' }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-700 truncate">{c.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate">{(c as any)._count?.tasks || 0} Tasks</p>
                      </div>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const client = await getClientWithTasks(clientId) as any
  
  if (!client) {
    return <div>Client not found.</div>
  }

  const activeTasks = client.tasks.filter((t: any) => !t.is_archived)
  const archivedTasks = client.tasks.filter((t: any) => t.is_archived)

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        {/* Client Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="w-14 h-14 object-contain rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm" style={{ backgroundColor: client.card_color || '#3b82f6' }}>
                {client.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{client.name}</h1>
              <p className="text-sm text-slate-500 mt-1">Goal: {client.yearly_goals}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EditClientModal client={client} />
            <AddTaskModal clientId={client.id} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Active Tasks ({activeTasks.length})
          </h2>
          {activeTasks.length > 0 ? (
            <TaskGrid client={client} tasks={activeTasks} />
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
              No active tasks.
            </div>
          )}
        </div>
      </div>

      {archivedTasks.length > 0 && (
        <div className="pt-8 border-t border-slate-200 opacity-70 hover:opacity-100 transition-opacity">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            Archived Tasks ({archivedTasks.length})
          </h2>
          <TaskGrid client={client} tasks={archivedTasks} />
        </div>
      )}
    </div>
  )
}
