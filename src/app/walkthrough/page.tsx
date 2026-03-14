import { getWalkthroughTasks } from "@/lib/actions"
import { WalkthroughClient } from "./client"

export const dynamic = 'force-dynamic'

export default async function WalkthroughPage() {
  const clients = await getWalkthroughTasks()
  
  return (
    <WalkthroughClient initialClients={clients} />
  )
}
