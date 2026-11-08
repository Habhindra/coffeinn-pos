import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Coffee, X } from 'lucide-react';

interface Menu {
  id: string;
  name: string;
  price: number;
  hpp: number;
  categoryId: string;
  imageUrl?: string;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface MenuManagementProps {
  onBackToDashboard: () => void;
}

// Fallback 5 Kategori Standar Coffeinn
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-coffee', name: 'Coffee' },
  { id: 'cat-non-coffee', name: 'Non-Coffee' },
  { id: 'cat-seasonal', name: 'Seasonal Menu' },
  { id: 'cat-1liter', name: '1 Liter' },
  { id: 'cat-snack', name: 'Snack' },
];

export const MenuManagement: React.FC<MenuManagementProps> = ({ onBackToDashboard }) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Input Form
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    hpp: '',
    categoryId: DEFAULT_CATEGORIES[0].id,
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch('/.netlify/functions/menu-management');
      if (res.ok) {
        const data = await res.json();
        setMenus(data.menus || []);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMenu(null);
    setFormData({
      name: '',
      price: '',
      hpp: '',
      categoryId: categories[0]?.id || DEFAULT_CATEGORIES[0].id,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
      hpp: menu.hpp ? menu.hpp.toString() : '0',
      categoryId: menu.categoryId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingMenu ? 'PUT' : 'POST';
    const payload = editingMenu ? { ...formData, id: editingMenu.id } : formData;

    try {
      const res = await fetch('/.netlify/functions/menu-management', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMenus();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Gagal menyimpan menu');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat menyimpan menu');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;

    try {
      const res = await fetch('/.netlify/functions/menu-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchMenus();
      } else {
        alert('Gagal menghapus menu');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus menu');
    }
  };

  const priceNum = parseFloat(formData.price) || 0;
  const hppNum = parseFloat(formData.hpp) || 0;
  const profitMargin = priceNum > 0 ? (((priceNum - hppNum) / priceNum) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-sky-600 tracking-wide">Manajemen Menu & HPP</h1>
          <p className="text-sm text-slate-500">Kelola daftar produk, harga jual, dan HPP bahan baku per porsi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition active:scale-95"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-sm shadow-md shadow-sky-500/20 transition active:scale-95"
          >
            <Plus size={18} /> Tambah Menu Baru
          </button>
        </div>
      </div>

      {/* Grid Tabel Daftar Menu */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Memuat katalog menu...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-4">Nama Menu</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Harga Jual</th>
                  <th className="p-4">HPP / Porsi</th>
                  <th className="p-4">Estimasi Laba</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menus.map((menu) => {
                  const menuPrice = Number(menu.price);
                  const menuHpp = Number(menu.hpp || 0);
                  const menuProfit = menuPrice - menuHpp;

                  return (
                    <tr key={menu.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                          <Coffee size={18} />
                        </div>
                        {menu.name}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                          {menu.category?.name || 'Coffee'}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900">
                        Rp {menuPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-bold text-slate-500">
                        Rp {menuHpp.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">
                        +Rp {menuProfit.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(menu)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-sky-600 rounded-lg transition"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(menu.id, menu.name)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Add/Edit Menu */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingMenu ? 'Edit Menu Kopi' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sea Salt Latte"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Select Kategori dengan Guaranteed Fallback Options */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kategori</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">HPP / Porsi (Rp)</label>
                  <input
                    type="number"
                    placeholder="8000"
                    value={formData.hpp}
                    onChange={(e) => setFormData({ ...formData, hpp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Box Preview Profitability */}
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Estimasi Laba per Cup:</span>
                  <span className="font-bold text-emerald-600">
                    Rp {(priceNum - hppNum > 0 ? priceNum - hppNum : 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Margin Profit:</span>
                  <span className="font-bold text-sky-600">{profitMargin}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-extrabold text-sm transition shadow-md shadow-sky-500/20"
                >
                  {editingMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};