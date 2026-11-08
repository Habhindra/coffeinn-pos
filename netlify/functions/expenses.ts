import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        body: JSON.stringify(expenses),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { title, category, amount, notes, date } = body;

      if (!title || !amount) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Judul dan nominal pengeluaran wajib diisi' }),
        };
      }

      // Parser Tanggal Aman (Mendukung DD/MM/YYYY maupun YYYY-MM-DD)
      let parsedDate = new Date();
      if (date) {
        if (typeof date === 'string' && date.includes('/')) {
          const parts = date.split('/');
          if (parts.length === 3) {
            // Ubah dari DD/MM/YYYY ke YYYY-MM-DD
            parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            parsedDate = d;
          }
        }
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }
      }

      const expense = await prisma.expense.create({
        data: {
          title: String(title),
          category: category ? String(category) : 'Bahan Baku',
          amount: parseFloat(amount),
          notes: notes ? String(notes) : null,
          date: parsedDate,
        },
      });

      return {
        statusCode: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        body: JSON.stringify({ success: true, expense }),
      };
    }

    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const { id } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ID Pengeluaran diperlukan' }),
        };
      }

      await prisma.expense.delete({ where: { id } });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Error Expenses Function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Gagal mencatat pengeluaran',
        error: error.message || String(error),
      }),
    };
  }
};