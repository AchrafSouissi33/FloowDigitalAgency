import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');
  
  // 3 fake clients
  const client1 = await prisma.client.create({
    data: { name: 'Acme Corp', yearly_goals: 'Increase Q3 revenue by 20%' }
  });
  const client2 = await prisma.client.create({
    data: { name: 'Globex', yearly_goals: 'Launch new product line' }
  });
  const client3 = await prisma.client.create({
    data: { name: 'Initech', yearly_goals: 'Improve employee retention' }
  });

  // 10 fake tasks with varying statuses and last_updated_at
  const tasksData = [
    { client_id: client1.id, title: 'Design Landing Page', status: 'In Progress', is_stale: false },
    { client_id: client1.id, title: 'Write Sales Copy', status: 'Blocked', last_updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000), is_stale: true },
    { client_id: client1.id, title: 'Setup Analytics', status: 'Done', is_stale: false },
    { client_id: client1.id, title: 'A/B Test Hero Section', status: 'Not Started', is_stale: false },
    
    { client_id: client2.id, title: 'Product Photography', status: 'Ready for AM Review', is_stale: false },
    { client_id: client2.id, title: 'Packaging Design', status: 'In Progress', last_updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000), is_stale: true },
    { client_id: client2.id, title: 'Social Media Strategy', status: 'Not Started', is_stale: false },
    
    { client_id: client3.id, title: 'Update Onboarding Flow', status: 'Blocked', last_updated_at: new Date(Date.now() - 72 * 60 * 60 * 1000), is_stale: true },
    { client_id: client3.id, title: 'Revise benefits package', status: 'In Progress', is_stale: false },
    { client_id: client3.id, title: 'Internal survey', status: 'Done', is_stale: false }
  ];

  for (const t of tasksData) {
    await prisma.task.create({ data: t });
  }

  console.log('Database Seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
