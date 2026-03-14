import { getClientWithTasks, getClients } from "@/lib/actions"
import { Card, CardHeader } from "@/components/ui/card"
import { AddTaskModal } from "./add-task-modal"
import { TaskGrid } from "./task-grid"
import { EditClientModal } from "./edit-client-modal"

export default async function ClientPage(props: { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const q = searchParams.q as string | undefined;
  const clientId = params.id
  
  // Quick hack to allow /clients/all to just redirect or show the first client for now
  if (clientId === 'all') {
    let clients = await getClients();
    if (q) {
      clients = clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
    }
    if (clients.length > 0) {
      return (
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">All Clients {q && `(Searching: "${q}")`}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clients.map(c => (
              <a key={c.id} href={`/clients/${c.id}`}>
                <Card className="bg-white hover:shadow-md cursor-pointer transition-all border border-slate-200 shadow-sm rounded-2xl overflow-hidden group">
                  <div className="h-1.5 w-full" style={{ backgroundColor: (c as any).card_color || '#3b82f6' }} />
                  <CardHeader className="flex flex-row items-center gap-4">
                    {(c as any).logo_url ? (
                      <img src={(c as any).logo_url} alt={c.name} className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: (c as any).card_color || '#3b82f6' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                      <p className="text-sm text-slate-500">{c.yearly_goals}</p>
                    </div>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )
    }
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
