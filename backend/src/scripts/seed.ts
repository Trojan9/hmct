import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

const daysFromNow = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const tasks: { title: string; description?: string; status: TaskStatus; dueDate: Date }[] = [
  {
    title: 'Review hearing bundle for case 1742',
    description: 'Check all evidence is indexed and paginated before the hearing.',
    status: 'IN_PROGRESS',
    dueDate: daysFromNow(1),
  },
  {
    title: 'Send notice of hearing to respondent',
    status: 'PENDING',
    dueDate: daysFromNow(3, 9),
  },
  {
    title: 'Chase missing witness statement',
    description: 'Applicant’s solicitor has not filed the second witness statement.',
    status: 'PENDING',
    dueDate: daysFromNow(-2, 16),
  },
  {
    title: 'List directions hearing',
    status: 'COMPLETED',
    dueDate: daysFromNow(-5, 11),
  },
  {
    title: 'Update case record with new address',
    status: 'CANCELLED',
    dueDate: daysFromNow(7, 14),
  },
];

const main = async () => {
  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(`Skipping seed: ${existing} tasks already exist`);
    return;
  }
  await prisma.task.createMany({ data: tasks });
  console.log(`Seeded ${tasks.length} tasks`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
