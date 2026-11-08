import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Calculator, Plus, Trash2, ArrowLeft, Award, Coffee, Receipt, Calendar, Wallet } from 'lucide-react';

interface OwnerDashboardProps {
  onBackToPos: () => void;
  onOpenMenuManagement?: () => void;
  onOpenExpenses?: () => void;
}

interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
  unit: string;
  amountUsed: number;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onBackToPos, onOpenMenuManagement, onOpenExpenses }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State Kalender (Bulan & Tahun, Format: YYYY-MM)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonthStr);

  // State Kalkulator HPP Resep
  const [recipeName, setRecipeName] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Bijikopi (Espresso Blend)', costPerUnit: 200, unit: 'gram', amountUsed: 18 },
    { id: '2', name: 'Fresh Milk', costPerUnit: 20, unit: 'ml', amountUsed: 120 },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonthYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [yearStr, monthStr] = selectedMonthYear.split('-');
      const res = await fetch(`/.netlify/functions/owner-dashboard?month=${monthStr}&year=${yearStr}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: '', costPerUnit: 0, unit: 'gram', amountUsed: 0 },
    ]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const calculatedTotalHPP = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.costPerUnit) || 0) * (Number(ing.amountUsed) || 0),
    0
  );

  const estimatedProfit = sellingPrice - calculatedTotalHPP;
  const marginPercentage = sellingPrice > 0 ? ((estimatedProfit / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans pb-12">
      {/* Header & Filter Kalender Bulan */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sky-600 tracking-wide">Owner Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">Rekapitulasi Penjualan, HPP & Pengeluaran</p>
        </div>

        {/* Filter Kalender Bulan & Tombol Navigasi */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 items-stretch sm:items-center">
          {/* Input Picker Kalender Bulan */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={18} className="text-sky-600" />
            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {onOpenExpenses && (
            <button
              onClick={onOpenExpenses}
              className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
            >
              <Receipt size={16} /> Pengeluaran
            </button>
          )}
          {onOpenMenuManagement && (
            <button
              onClick={onOpenMenuManagement}
              className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-sky-500/20 transition active:scale-95"
            >
              <Coffee size={16} /> Kelola Menu
            </button>
          )}
          <button
            onClick={onBackToPos}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
          >
            <ArrowLeft size={16} /> POS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium text-sm">Memuat laporan periode pilihan...</div>
      ) : (
        <>
          {/* Summary Financial Card Berdasarkan Bulan Dipilih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Total Omset */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Omset</span>
                <DollarSign size={18} className="text-sky-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                Rp {(data?.summary?.totalOmset || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {data?.transactionCount || 0} Transaksi Terjadi
              </p>
            </div>

            {/* Total HPP Bahan Baku */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Total HPP Menu</span>
                <ShoppingBag size={18} className="text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                Rp {(data?.summary?.totalHpp || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Modal Bahan Baku Terjual
              </p>
            </div>

            {/* Total Pengeluaran Operasional */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center text-slate-400 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Pengeluaran</span>
                <Wallet size={18} className="text-red-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-red-500">
                -Rp {(data?.summary?.totalPengeluaran || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Listrik, Gaji, dll
              </p>
            </div>

            {/* Laba Bersih Riil */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex justify-between items-center text-emerald-600 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Laba Bersih Riil</span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600">
                Rp {(data?.summary?.labaBersihRiil || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-1 font-bold">
                Omset - HPP - Pengeluaran
              </p>
            </div>
          </div>

          {/* Section: Best Seller & Kalkulator HPP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menu Terlaris (Best Seller Periode Ini) */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-sky-600" size={20} />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Menu Terlaris Periode Ini</h2>
              </div>

              {!data?.bestSellers || data?.bestSellers?.length === 0 ? (
                <p className="text-slate-400 text-xs sm:text-sm text-center py-8">Belum ada data penjualan pada bulan ini</p>
              ) : (
                <div className="space-y-3">
                  {data?.bestSellers?.map((item: any, idx: number) => {
                    const maxQty = data.bestSellers[0].qty || 1;
                    const percentage = Math.round((item.qty / maxQty) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800">{idx + 1}. {item.name}</span>
                          <span className="text-sky-600">{item.qty} Porsi (Rp {item.totalSales.toLocaleString('id-ID')})</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Simulator / Kalkulator HPP Resep Kopi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="text-sky-600" size={20} />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Kalkulator HPP Resep Kopi</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Menu</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dirty Latte"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    placeholder="22000"
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* List Bahan Baku */}
              <div className="space-y-2 mb-4">
                <label className="block text-[11px] font-bold text-slate-600">Komposisi Bahan Baku</label>
                {ingredients.map((ing) => (
                  <div key={ing.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 sm:items-center">
                    <input
                      type="text"
                      placeholder="Nama Bahan"
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                      className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    />
                    <div className="flex gap-2 items-center justify-between sm:justify-start">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400">Takaran</span>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            placeholder="18"
                            value={ing.amountUsed || ''}
                            onChange={(e) => updateIngredient(ing.id, 'amountUsed', Number(e.target.value))}
                            className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                          />
                          <span className="text-[10px] font-bold text-slate-400">{ing.unit}</span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400">Modal (Rp/{ing.unit})</span>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            placeholder="200"
                            value={ing.costPerUnit || ''}
                            onChange={(e) => updateIngredient(ing.id, 'costPerUnit', Number(e.target.value))}
                            className="w-18 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                          />
                          <button
                            onClick={() => removeIngredient(ing.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addIngredient}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <Plus size={14} /> Tambah Bahan Baku
                </button>
              </div>

              {/* Ringkasan Profitability Resep */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Total HPP Resep:</span>
                  <span className="font-bold text-slate-900">Rp {calculatedTotalHPP.toLocaleString('id-ID')}</span>
                </div>
                {sellingPrice > 0 && (
                  <>
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Profit Bersih / Porsi:</span>
                      <span className="font-bold text-emerald-600">Rp {estimatedProfit.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sky-700 pt-1 border-t border-sky-200">
                      <span>Margin Keuntungan:</span>
                      <span>{marginPercentage}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};