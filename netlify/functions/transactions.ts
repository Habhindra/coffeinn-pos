import { Handler } from '@netlify/functions';
import { PrismaClient, PaymentMethod, OrderStatus } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const transactions = await prisma.transaction.findMany({
        include: {
          items: {
            include: { menu: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactions),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { paymentMethod, customerName, items, totalAmount, cashPaid, changeAmount } = body;

      if (!items || !items.length) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Keranjang belanja tidak boleh kosong' }),
        };
      }

      // Mapping PaymentMethod ke Enum Prisma (CASH / QRIS)
      const validPaymentMethod = paymentMethod === 'QRIS' ? PaymentMethod.QRIS : PaymentMethod.CASH;

      const transaction = await prisma.transaction.create({
        data: {
          customerName: customerName || '-',
          paymentMethod: validPaymentMethod,
          totalAmount: parseFloat(totalAmount),
          cashAmount: cashPaid ? parseFloat(cashPaid) : null,
          changeAmount: changeAmount ? parseFloat(changeAmount) : null,
          status: OrderStatus.COMPLETED,
          items: {
            create: items.map((item: any) => ({
              menuId: item.menuId || item.id,
              quantity: parseInt(item.quantity),
              priceAtSale: parseFloat(item.price),
              hppAtSale: parseFloat(item.hpp || 0),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, transaction }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Error Transactions Function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Gagal memproses transaksi',
        error: error.message || String(error),
      }),
    };
  }
};