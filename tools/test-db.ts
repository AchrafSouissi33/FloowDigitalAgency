import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Database Read...');
  const clients = await prisma.client.findMany({ include: { tasks: true } });
  
  console.dir(clients, { depth: null });
  console.log(`\nSuccessfully read ${clients.length} clients and ${clients.reduce((acc, c) => acc + c.tasks.length, 0)} tasks.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
