'use server'

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { checkAndMarkStaleTasks } from './utils';

export async function getClients() {
  return await prisma.client.findMany({
    where: { is_archived: false },
    include: {
      _count: {
        select: { tasks: { where: { is_archived: false } } }
      }
    }
  });
}

export async function archiveClient(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { is_archived: true }
  });
  revalidatePath('/clients/all');
  revalidatePath('/dashboard');
}

export async function unarchiveClient(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { is_archived: false }
  });
  revalidatePath('/clients/all');
  revalidatePath('/dashboard');
}

export async function getArchivedClients() {
  return await prisma.client.findMany({
    where: { is_archived: true },
    include: {
      _count: {
        select: { tasks: { where: { is_archived: false } } }
      }
    }
  });
}

export async function getClientWithTasks(clientId: string) {
  return await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      tasks: {
        include: {
          logs: {
            orderBy: { timestamp: 'desc' }
          },
          comments: {
            orderBy: { timestamp: 'asc' }
          }
        }
      }
    }
  });
}

export async function getWalkthroughTasks() {
  return await prisma.client.findMany({
    include: {
      tasks: {
        where: {
          status: { not: 'Done' }
        },
        include: {
          comments: {
            orderBy: { timestamp: 'asc' }
          }
        }
      }
    }
  });
}

export async function getDashboardTasks(role: 'PM' | 'AM') {
  // Trigger staleness check simulating chron job before fetching the PM tasks
  if (role === 'PM') {
    await checkAndMarkStaleTasks();
  }

  const includeRelations = { client: true, logs: { orderBy: { timestamp: 'desc' as const } }, comments: { orderBy: { timestamp: 'asc' as const } } };

  if (role === 'AM') {
    return await prisma.task.findMany({
      where: {
        status: { in: ['Blocked', 'Ready for AM Review'] }
      },
      include: includeRelations
    });
  } else if (role === 'PM') {
    return await prisma.task.findMany({
      where: {
        OR: [
          { is_stale: true },
          { status: 'You Can Proceed' }
        ]
      },
      include: includeRelations
    });
  }
  return [];
}

export async function updateTaskStatus(taskId: string, newStatus: string, note: string, userId?: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const previousStatus = task.status;
  const finalNote = userId ? `[${userId}] ${note}` : note;

  // Single Transaction for atomic updates
  await prisma.$transaction(async (tx) => {
    // 1. Update the task status, last_update timestamp, and clear staleness
    await tx.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        last_updated_at: new Date(),
        is_stale: false,
      }
    });

    // 2. Create the associated TaskLog record
    await tx.taskLog.create({
      data: {
        task_id: taskId,
        previous_status: previousStatus,
        new_status: newStatus,
        note: finalNote,
      }
    });
  });

  // Revalidate generic paths to update UI state
  revalidatePath('/', 'layout');
}

export async function createClient(name: string, goals: string, logoUrl?: string, cardColor?: string) {
  const client = await prisma.client.create({
    data: {
      name,
      yearly_goals: goals,
      logo_url: logoUrl || null,
      card_color: cardColor || '#3b82f6'
    }
  })
  revalidatePath('/clients/all')
  revalidatePath('/dashboard')
  revalidatePath('/walkthrough')
  return client
}

export async function updateClient(clientId: string, name: string, goals: string, logoUrl?: string, cardColor?: string) {
  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      yearly_goals: goals,
      logo_url: logoUrl || null,
      card_color: cardColor || '#3b82f6'
    }
  })
  revalidatePath('/clients/all')
  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/dashboard')
  revalidatePath('/walkthrough')
  return client
}

export async function createTask(clientId: string, title: string, notes?: string) {
  const task = await prisma.task.create({
    data: {
      client_id: clientId,
      title,
      notes: notes || null,
      status: "Not Started",
      is_stale: false,
      last_updated_at: new Date()
    }
  })
  
  await prisma.taskLog.create({
    data: {
      task_id: task.id,
      previous_status: "None",
      new_status: "Not Started",
      note: "Task created."
    }
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients/all')
  revalidatePath('/dashboard')
  revalidatePath('/walkthrough')
  return task
}

export async function addComment(taskId: string, author: string, content: string) {
  const comment = await prisma.comment.create({
    data: {
      task_id: taskId,
      author,
      content,
    }
  })
  
  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/walkthrough')
  return comment
}

export async function editComment(commentId: string, content: string) {
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content }
  })
  
  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/walkthrough')
  return comment
}

export async function updateTaskDetails(taskId: string, title: string, notes: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { title, notes }
  })
  
  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/dashboard')
  revalidatePath('/walkthrough')
  return task
}

export async function archiveTask(taskId: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { is_archived: true }
  })
  
  revalidatePath('/clients/[id]', 'page')
  revalidatePath('/dashboard')
  revalidatePath('/walkthrough')
  return task
}
