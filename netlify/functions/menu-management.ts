import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    // 1. GET: Ambil Semua Menu & Kategori
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

    // 2. POST: Tambah Menu Baru (Auto-find or Create Category Name)
    if (method === 'POST') {
      const { name, price, hpp, categoryName, imageUrl } = JSON.parse(event.body || '{}');

      if (!name || !price) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Nama dan harga wajib diisi' }),
        };
      }

      const targetCategoryName = categoryName || 'Coffee';

      // Find or Create Category
      let category = await prisma.category.findFirst({
        where: { name: targetCategoryName },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: targetCategoryName },
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

    // 3. PUT: Edit Menu & HPP
    if (method === 'PUT') {
      const { id, name, price, hpp, categoryName, imageUrl } = JSON.parse(event.body || '{}');

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ID Menu diperlukan' }),
        };
      }

      const targetCategoryName = categoryName || 'Coffee';
      let category = await prisma.category.findFirst({
        where: { name: targetCategoryName },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: targetCategoryName },
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

    // 4. DELETE: Hapus Menu
    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');

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
    console.error('Error Menu Management:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Gagal menyimpan menu ke Supabase', error: error.message }),
    };
  }
};