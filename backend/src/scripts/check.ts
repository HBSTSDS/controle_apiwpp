import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { products: true, sales: true, customers: true, receivables: true }
      }
    }
  });
  console.log('Companies status:', JSON.stringify(companies, null, 2));
  
  // Check if there are any receivables with PENDING status
  const pending = await prisma.receivable.count({ where: { status: 'PENDING' } });
  const paid = await prisma.receivable.count({ where: { status: 'PAID' } });
  console.log(`Receivables: ${pending} PENDING, ${paid} PAID`);

  await prisma.$disconnect();
}

check();
