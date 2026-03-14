import { prisma } from './prisma';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Evaluates all active tasks and marks them as 'stale' if their last update 
 * exceeds 24 business hours (ignoring weekends).
 */
export async function checkAndMarkStaleTasks() {
  const tasks = await prisma.task.findMany({
    where: { 
      is_stale: false, 
      status: { not: 'Done' } 
    }
  });

  const now = new Date();
  const staleTaskIds: string[] = [];

  for (const task of tasks) {
    const lastUpdated = new Date(task.last_updated_at);
    
    let businessHours = 0;
    let tempDate = new Date(lastUpdated);
    
    // Accumulate business hours elapsed
    while (tempDate < now) {
      if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) { // 0 = Sunday, 6 = Saturday
        businessHours += 1;
      }
      tempDate.setHours(tempDate.getHours() + 1);
    }

    if (businessHours > 24) {
      staleTaskIds.push(task.id);
    }
  }

  // Batch update any tasks identified as stale
  if (staleTaskIds.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: staleTaskIds } },
      data: { is_stale: true }
    });
  }
}
