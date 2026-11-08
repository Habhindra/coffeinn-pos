import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const handler: Handler = async (event) => {
  const method = event.httpMethod;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // 1. GET: Fetch Expenses dengan Filter Bulan & Tahun
    if (method === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const month = queryParams.month;
      const year = queryParams.year;

      let whereClause = {};
      if (month && year) {
        const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
        const endDate = new Date(new Date(`${year}-${month}-01T00:00:00.000Z`).setUTCMonth(startDate.getUTCMonth() + 1));
        
        whereClause = {
          date: {
            gte: startDate,
            lt: endDate,
          },
        };
      }

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
      });

      // Hitung total pengeluaran
      const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ expenses, totalExpense }),
      };
    }

    // 2. POST: Add New Expense (Mendukung Notes)
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { title, category, amount, notes, date } = body;

      if (!title || !amount) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Judul dan nominal pengeluaran wajib diisi' }),
        };
      }

      let parsedDate = new Date();
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
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
        headers,
        body: JSON.stringify({ success: true, expense }),
      };
    }

    // 3. DELETE: Remove Expense
    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const { id } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'ID Pengeluaran diperlukan' }),
        };
      }

      await prisma.expense.delete({ where: { id } });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Error Expenses Function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Gagal memproses pengeluaran',
        error: error.message || String(error),
      }),
    };
  }
};