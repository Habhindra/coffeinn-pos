import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method Not Allowed' }) 
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const now = new Date();

    // Handling aman jika parameter kosong atau invalid
    let selectedMonth = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();
    let selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

    if (isNaN(selectedMonth) || selectedMonth < 0 || selectedMonth > 11) {
      selectedMonth = now.getMonth();
    }
    if (isNaN(selectedYear) || selectedYear < 2000) {
      selectedYear = now.getFullYear();
    }

    // Awal & Akhir Bulan yang Dipilih
    const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    // 1. Ambil Transaksi Penjualan (Pemasukan)
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfSelectedMonth,
          lte: endOfSelectedMonth,
        },
      },
      include: {
        items: {
          include: { menu: true },
        },
      },
    });

    // 2. Ambil Data Pengeluaran (Expense) jika tabel Expense ada
    let expenses: any[] = [];
    try {
      expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: startOfSelectedMonth,
            lte: endOfSelectedMonth,
          },
        },
      });
    } catch (expErr) {
      console.warn('Tabel Expense belum ada atau tidak dapat diakses, lanjut dengan array kosong.');
    }

    let totalOmset = 0;
    let totalHpp = 0;
    const menuSalesMap: { [key: string]: { name: string; qty: number; totalSales: number } } = {};

    transactions.forEach((trx) => {
      const amount = Number(trx.totalAmount || 0);
      totalOmset += amount;

      if (trx.items && Array.isArray(trx.items)) {
        trx.items.forEach((item) => {
          const itemHpp = Number(item.hpp || 0) * item.quantity;
          totalHpp += itemHpp;

          const menuName = item.menu?.name || 'Menu';
          if (!menuSalesMap[menuName]) {
            menuSalesMap[menuName] = { name: menuName, qty: 0, totalSales: 0 };
          }
          menuSalesMap[menuName].qty += item.quantity;
          menuSalesMap[menuName].totalSales += Number(item.price || 0) * item.quantity;
        });
      }
    });

    const totalPengeluaran = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const labaKotor = totalOmset - totalHpp;
    const labaBersihRiil = labaKotor - totalPengeluaran;

    const bestSellers = Object.values(menuSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedPeriod: {
          month: selectedMonth + 1,
          year: selectedYear,
        },
        summary: {
          totalOmset,
          totalHpp,
          labaKotor,
          totalPengeluaran,
          labaBersihRiil,
        },
        bestSellers,
        transactionCount: transactions.length,
      }),
    };
  } catch (error: any) {
    console.error('Error Owner Dashboard Function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Gagal memuat data dashboard', error: error.message }),
    };
  }
};