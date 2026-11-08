import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Receipt, Wallet, Calendar } from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes?: string;
  date: string;
}

interface ExpenseDashboardProps {
  onBackToDashboard: () => void;
}

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ onBackToDashboard }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // State Filter Kalender Bulan & Tahun (Format: YYYY-MM)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonthStr);

  // Form Input Transaksi Baru
  const todayStr = now.toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonthYear]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const [yearStr, monthStr] = selectedMonthYear.split('-');
      const res = await fetch(`/.netlify/functions/expenses?month=${monthStr}&year=${yearStr}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setTotalExpense(data.totalExpense || 0);
      }
    } catch (err) {
      console.error('Gagal mengambil data pengeluaran:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/.netlify/functions/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          amount: parseFloat(amount),
          date,
          notes,
        }),
      });

      if (res.ok) {
        setTitle('');
        setAmount('');
        setNotes('');
        setDate(todayStr);
        fetchExpenses();
      } else {
        alert('Gagal mencatat pengeluaran');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, expTitle: string) => {
    if (!confirm(`Hapus pencatatan pengeluaran "${expTitle}"?`)) return;

    try {
      const res = await fetch('/.netlify/functions/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) fetchExpenses();
    } catch (err) {
      alert('Gagal menghapus catatan');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-sky-600 tracking-wide">Laporan Pengeluaran</h1>
          <p className="text-sm text-slate-500">Catat dan pantau pengeluaran operasional & bahan baku</p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition active:scale-95"
        >
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Form Input */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 text-sky-600">
            <Plus size={22} />
            <h2 className="text-lg font-bold text-slate-900">Catat Pengeluaran Baru</h2>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Judul / Nama Pengeluaran</label>
              <input
                type="text"
                required
                placeholder="Contoh: Biji Kopi Arabica 2kg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Input Tanggal Transaksi */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="Bahan Baku">Bahan Baku (Kopi, Milk, Syrup)</option>
                <option value="Operasional">Operasional (Cup, Tissue, Packaging)</option>
                <option value="Utilitas">Utilitas (Listrik, Air, WiFi)</option>
                <option value="Gaji">Gaji Karyawan</option>
                <option value="Lainnya">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                placeholder="350000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                rows={2}
                placeholder="Pembelian grosir..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-extrabold text-sm transition active:scale-95 shadow-md shadow-sky-500/20"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </form>
        </div>

        {/* Panel Riwayat & Filter Bulan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Summary + Filter Picker Bulan & Tahun */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran Bulan Ini</p>
                <p className="text-2xl font-black text-slate-900">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Input Picker Kalender Bulan */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 self-stretch sm:self-auto justify-center">
              <Calendar size={18} className="text-sky-600" />
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Daftar Riwayat Pengeluaran */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-sky-600" /> Riwayat Pengeluaran
              </div>
              <span className="bg-slate-100 text-slate-600 px-3 py-0.5 rounded-full text-xs font-bold">
                {expenses.length} Item
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 font-medium">Memuat data pengeluaran...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                Belum ada pengeluaran yang dicatat pada bulan ini
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{exp.title}</h4>
                        <span className="bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {exp.category}
                        </span>
                      </div>
                      {exp.notes && <p className="text-xs text-slate-400">{exp.notes}</p>}
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono font-bold">
                        <Calendar size={12} className="text-sky-500" /> {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-red-500 text-sm">
                        -Rp {Number(exp.amount).toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.title)}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};