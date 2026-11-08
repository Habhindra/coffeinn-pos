import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // 1. GET: Ambil Daftar Menu & Kategori
  if (event.httpMethod === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        include: {
          menus: true,
        },
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categories),
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Gagal mengambil data menu', error: error.message }),
      };
    }
  }

  // 2. POST: Simpan Transaksi Kasir
  if (event.httpMethod === 'POST') {
    try {
      const { userId, items, paymentMethod, totalAmount, cashPaid, change } = JSON.parse(
        event.body || '{}'
      );

      if (!items || items.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Keranjang transaksi tidak boleh kosong' }),
        };
      }

      // Buat nomor struk otomatis: TRX-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.transaction.count();
      const invoiceNo = `TRX-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      // Simpan transaksi & item transaksi ke Supabase
      const transaction = await prisma.transaction.create({
        data: {
          invoiceNo,
          userId: userId || 'cashier-id-1',
          paymentMethod,
          totalAmount: parseFloat(totalAmount),
          cashPaid: parseFloat(cashPaid || totalAmount),
          change: parseFloat(change || 0),
          items: {
            create: items.map((item: any) => ({
              menuId: item.id,
              quantity: Number(item.quantity),
              price: parseFloat(item.price),
              hpp: parseFloat(item.hpp || 0),
              subtotal: parseFloat(item.price) * Number(item.quantity),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, transaction }),
      };
    } catch (error: any) {
      console.error('Error Transaction:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Gagal memproses transaksi', error: error.message }),
      };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};