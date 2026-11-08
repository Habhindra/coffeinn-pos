import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed User Kasir & Owner
  const owner = await prisma.user.upsert({
    where: { id: 'owner-id-1' },
    update: {},
    create: {
      id: 'owner-id-1',
      name: 'Owner Coffeinn',
      pin: '123456',
      role: 'OWNER',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { id: 'cashier-id-1' },
    update: {},
    create: {
      id: 'cashier-id-1',
      name: 'Kasir Shift 1',
      pin: '111111',
      role: 'CASHIER',
    },
  });

  // 2. Seed Kategori Produk Utama
  const coffeeCat = await prisma.category.upsert({
    where: { id: 'cat-coffee' },
    update: {},
    create: {
      id: 'cat-coffee',
      name: 'Coffee',
    },
  });

  const nonCoffeeCat = await prisma.category.upsert({
    where: { id: 'cat-non-coffee' },
    update: {},
    create: {
      id: 'cat-non-coffee',
      name: 'Non-Coffee',
    },
  });

  // 3. Seed Menu Awal Coffeinn
  await prisma.menu.upsert({
    where: { id: 'menu-dirty-latte' },
    update: {},
    create: {
      id: 'menu-dirty-latte',
      name: 'Dirty Latte',
      categoryId: coffeeCat.id,
      price: 22000,
      hpp: 9500,
    },
  });

  await prisma.menu.upsert({
    where: { id: 'menu-v60-pourover' },
    update: {},
    create: {
      id: 'menu-v60-pourover',
      name: 'V60 Manual Brew',
      categoryId: coffeeCat.id,
      price: 25000,
      hpp: 11000,
    },
  });

  console.log('✅ Seed Data Berhasil! User & Menu Awal Coffeinn POS Telah Dibuat.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });