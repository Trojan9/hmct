import { PrismaClient } from '@prisma/client';
import { demoTasks } from '../tasks/demoTasks';

const prisma = new PrismaClient();

const main = async () => {
  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(`Skipping seed: ${existing} tasks already exist`);
    return;
  }
  const tasks = demoTasks();
  await prisma.task.createMany({ data: tasks });
  console.log(`Seeded ${tasks.length} tasks`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
