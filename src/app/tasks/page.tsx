import { getOpenTasksByClient } from "@/lib/actions"
import { TaskGrid } from "@/app/clients/[id]/task-grid"

export const dynamic = "force-dynamic"

export default async function TasksPage() {
  const clients = await getOpenTasksByClient()

  if (clients.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-8">All Open Tasks</h1>
        <div className="text-center text-slate-500 bg-slate-50 border border-slate-100 rounded-3xl p-12">
          No open tasks right now.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-12">
      <div>
         <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-8">All Open Tasks</h1>
         {clients.map(client => (
           <div key={client.id} className="mb-12">
             <div className="flex items-center gap-4 mb-6">
               {(client as any).logo_url ? (
                 <img src={(client as any).logo_url} alt={client.name} className="w-10 h-10 object-contain rounded-xl bg-white border border-slate-200 p-1 shadow-sm" />
               ) : (
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: (client as any).card_color || '#3b82f6' }}>
                   {client.name.charAt(0).toUpperCase()}
                 </div>
               )}
               <h2 className="text-2xl font-bold text-slate-800">{client.name}</h2>
             </div>
             <TaskGrid client={client} tasks={(client as any).tasks} />
           </div>
         ))}
      </div>
    </div>
  )
}
