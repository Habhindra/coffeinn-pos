import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

// Reuse PrismaClient instance untuk serverless runtime
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    // 1. GET: Fetch Menus & Categories
    if (method === 'GET') {
      const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
      const menus = await prisma.menu.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus, categories }),
      };
    }

    // 2. POST: Add New Menu
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, price, hpp, categoryName, imageUrl } = body;

      if (!name || !price) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Nama dan harga wajib diisi' }),
        };
      }

      const targetCatName = categoryName || 'Coffee';

      // Find or create Category by Name
      let category = await prisma.category.findFirst({
        where: { name: targetCatName },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: targetCatName },
        });
      }

      const newMenu = await prisma.menu.create({
        data: {
          name,
          price: parseFloat(price),
          hpp: parseFloat(hpp || 0),
          categoryId: category.id,
          imageUrl: imageUrl || null,
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, menu: newMenu }),
      };
    }

    // 3. PUT: Edit Menu
    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { id, name, price, hpp, categoryName, imageUrl } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ID Menu diperlukan' }),
        };
      }

      const targetCatName = categoryName || 'Coffee';
      let category = await prisma.category.findFirst({
        where: { name: targetCatName },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: targetCatName },
        });
      }

      const updatedMenu = await prisma.menu.update({
        where: { id },
        data: {
          name,
          price: parseFloat(price),
          hpp: parseFloat(hpp || 0),
          categoryId: category.id,
          imageUrl: imageUrl || null,
        },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, menu: updatedMenu }),
      };
    }

    // 4. DELETE: Remove Menu
    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const { id } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ID Menu diperlukan' }),
        };
      }

      await prisma.menu.delete({ where: { id } });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Menu berhasil dihapus' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Error Menu Management Function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Gagal menyimpan menu ke Supabase',
        error: error.message || String(error),
      }),
    };
  }
};