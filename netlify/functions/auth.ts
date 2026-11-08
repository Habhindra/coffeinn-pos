import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { pin } = JSON.parse(event.body || '{}');

    if (!pin) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'PIN wajib diisi' }),
      };
    }

    // 1. Cek langsung PIN Fallback Standar
    if (pin === '111111') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          user: { id: 'kasir-1', name: 'Kasir Shift 1', role: 'CASHIER' },
        }),
      };
    }

    if (pin === '123456') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          user: { id: 'owner-1', name: 'Owner Coffeinn', role: 'OWNER' },
        }),
      };
    }

    // 2. Pencarian ke Database Supabase jika ada PIN kustom
    try {
      const user = await prisma.user.findFirst({
        where: { pin: pin.toString() },
      });

      if (user) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            user: { id: user.id, name: user.name, role: user.role },
          }),
        };
      }
    } catch (dbErr) {
      console.warn('Gagal membaca tabel User dari database, menggunakan validasi fallback PIN.');
    }

    // Jika PIN tidak cocok
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'PIN Salah! Silakan coba lagi.' }),
    };
  } catch (error: any) {
    console.error('Error Auth PIN Function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Terjadi kesalahan server' }),
    };
  }
};