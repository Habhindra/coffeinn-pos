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
    // GET: Fetch Expenses
    if (method === 'GET') {
      const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenses),
      };
    }

    // POST: Add New Expense
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

      const expense = await prisma.expense.create({
        data: {
          title,
          category: category || 'Bahan Baku',
          amount: parseFloat(amount),
          notes: notes || null,
          date: date ? new Date(date) : new Date(),
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, expense }),
      };
    }

    // DELETE: Remove Expense
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
        body: JSON.stringify({ success: true, message: 'Pengeluaran berhasil dihapus' }),
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