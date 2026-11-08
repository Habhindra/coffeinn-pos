import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REQUIRED_CATEGORIES = [
  'Coffee',
  'Non-Coffee',
  'Seasonal Menu',
  '1 Liter',
  'Snack',
];

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    // 1. GET: Ambil Semua Menu & Kategori (Pastikan 5 Kategori Tersedia)
    if (method === 'GET') {
      for (const catName of REQUIRED_CATEGORIES) {
        const exists = await prisma.category.findFirst({ where: { name: catName } });
        if (!exists) {
          await prisma.category.create({ data: { name: catName } });
        }
      }

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

    // 2. POST: Tambah Menu Baru (Auto-resolve Category ID)
    if (method === 'POST') {
      const { name, price, hpp, categoryId, imageUrl } = JSON.parse(event.body || '{}');

      if (!name || !price) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Nama dan harga wajib diisi' }),
        };
      }

      // Validasi/Cari Kategori yang Valid di Database Supabase
      let targetCategory = await prisma.category.findUnique({ where: { id: categoryId } });
      
      if (!targetCategory) {
        // Fallback: Gunakan kategori 'Coffee' default jika ID tidak ditemukan
        targetCategory = await prisma.category.findFirst({ where: { name: 'Coffee' } });
        
        // Jika masih kosong, buat kategori 'Coffee'
        if (!targetCategory) {
          targetCategory = await prisma.category.create({ data: { name: 'Coffee' } });
        }
      }

      const newMenu = await prisma.menu.create({
        data: {
          name,
          price: parseFloat(price),
          hpp: parseFloat(hpp || 0),
          categoryId: targetCategory.id,
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
      const { id, name, price, hpp, categoryId, imageUrl } = JSON.parse(event.body || '{}');

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ID Menu diperlukan' }),
        };
      }

      let targetCategoryId = categoryId;
      const validCategory = await prisma.category.findUnique({ where: { id: categoryId } });
      
      if (!validCategory) {
        const defaultCategory = await prisma.category.findFirst({ where: { name: 'Coffee' } });
        if (defaultCategory) targetCategoryId = defaultCategory.id;
      }

      const updatedMenu = await prisma.menu.update({
        where: { id },
        data: {
          name,
          price: parseFloat(price),
          hpp: parseFloat(hpp || 0),
          categoryId: targetCategoryId,
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