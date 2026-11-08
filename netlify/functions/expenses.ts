import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    // 1. GET: Ambil Daftar Pengeluaran Berdasarkan Filter Bulan & Tahun
    if (method === 'GET') {
      const params = event.queryStringParameters || {};
      const now = new Date();

      let selectedMonth = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();
      let selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

      if (isNaN(selectedMonth) || selectedMonth < 0 || selectedMonth > 11) {
        selectedMonth = now.getMonth();
      }
      if (isNaN(selectedYear) || selectedYear < 2000) {
        selectedYear = now.getFullYear();
      }

      const startOfMonth = new Date(selectedYear, selectedMonth, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

      const expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: { date: 'desc' },
      });

      const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses,
          totalExpense,
          selectedPeriod: { month: selectedMonth + 1, year: selectedYear },
        }),
      };
    }

    // 2. POST: Catat Pengeluaran Baru
    if (method === 'POST') {
      const { title, category, amount, notes, date } = JSON.parse(event.body || '{}');

      if (!title || !amount) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Judul dan nominal pengeluaran wajib diisi' }),
        };
      }

      const newExpense = await prisma.expense.create({
        data: {
          title,
          category: category || 'Bahan Baku',
          amount: parseFloat(amount),
          notes: notes || '',
          date: date ? new Date(date) : new Date(),
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, expense: newExpense }),
      };
    }

    // 3. DELETE: Hapus Catatan Pengeluaran
    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');

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
    console.error('Error Expense Management:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Terjadi kesalahan server', error: error.message }),
    };
  }
};