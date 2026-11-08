import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, CreditCard, Banknote, CheckCircle, LogOut, X, Search, Utensils, ShoppingBag as TakeAwayIcon, User, LayoutDashboard } from 'lucide-react';

interface Menu {
  id: string;
  name: string;
  price: number;
  hpp: number;
  categoryId: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
  menus: Menu[];
}

interface CartItem extends Menu {
  quantity: number;
}

interface PosLayoutProps {
  currentUser: { id: string; name: string; role: string };
  onLogout?: () => void;
  onOpenDashboard?: () => void;
}

export const PosLayout: React.FC<PosLayoutProps> = ({ currentUser, onLogout, onOpenDashboard }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // State Order Type & Customer Name
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_AWAY'>('DINE_IN');
  const [customerName, setCustomerName] = useState<string>('');
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashPaid, setCashPaid] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  
  // State drawer keranjang mobile
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      const res = await fetch('/.netlify/functions/menu-management');
      const data = await res.json();
      if (res.ok) {
        if (data.categories && data.menus) {
          const categoriesWithMenus = data.categories.map((cat: any) => ({
            ...cat,
            menus: data.menus.filter((m: any) => m.categoryId === cat.id),
          }));
          setCategories(categoriesWithMenus);
        } else if (Array.isArray(data)) {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data menu:', err);
    }
  };

  const formatNumberWithDots = (val: string | number) => {
    const numStr = val.toString().replace(/\D/g, '');
    if (!numStr) return '';
    return parseInt(numStr, 10).toLocaleString('id-ID');
  };

  const handleCashInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setCashPaid(rawValue);
  };

  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...menu, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const numericCashPaid = parseFloat(cashPaid) || 0;
  const change = numericCashPaid - totalAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && numericCashPaid < totalAmount) {
      alert('Uang pembayaran kurang!');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/.netlify/functions/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          customerName: customerName.trim() || 'Pelanggan',
          orderType,
          items: cart.map(item => ({
            menuId: item.id,
            quantity: item.quantity,
            price: item.price,
            hpp: item.hpp || 0
          })),
          paymentMethod,
          totalAmount,
          cashPaid: paymentMethod === 'CASH' ? numericCashPaid : totalAmount,
          changeAmount: paymentMethod === 'CASH' ? change : 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastTransaction(data.transaction);
        setCart([]);
        setCashPaid('');
        setCustomerName('');
        setIsMobileCartOpen(false);
      } else {
        alert(data.message || 'Transaksi gagal');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem saat memproses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter Menu Kategori & Search
  const allMenus = categories.flatMap((cat) => cat.menus || []);
  const filteredMenus = allMenus.filter((menu) => {
    const matchesCategory = selectedCategory === 'all' || menu.categoryId === selectedCategory;
    const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Render Panel Keranjang
  const RenderCartContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sky-600">
            <ShoppingBag size={22} />
            <h2 className="text-xl font-bold text-slate-900">Keranjang Pesanan</h2>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-700 p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Tipe Pesanan & Nama Pelanggan */}
        <div className="space-y-3 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                orderType === 'DINE_IN'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Utensils size={14} /> Dine In
            </button>
            <button
              type="button"
              onClick={() => setOrderType('TAKE_AWAY')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                orderType === 'TAKE_AWAY'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TakeAwayIcon size={14} /> Take Away
            </button>
          </div>

          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nama Pelanggan (Opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>
        </div>

        {/* List Pesanan */}
        <div className="space-y-2.5 max-h-[25vh] lg:max-h-[32vh] overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm font-medium">
              Keranjang masih kosong
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-200 shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                  <p className="text-xs font-bold text-sky-600 mt-0.5">
                    Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-300 active:scale-95 transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-5 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-300 active:scale-95 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Pembayaran */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-600 font-bold">Total Tagihan</span>
          <span className="text-2xl font-black text-sky-600">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
              paymentMethod === 'CASH'
                ? 'bg-sky-50 border-sky-500 text-sky-600 shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Banknote size={16} /> CASH
          </button>
          <button
            onClick={() => setPaymentMethod('QRIS')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
              paymentMethod === 'QRIS'
                ? 'bg-sky-50 border-sky-500 text-sky-600 shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <CreditCard size={16} /> QRIS
          </button>
        </div>

        {paymentMethod === 'CASH' && (
          <div className="mb-4">
            <label className="block text-xs text-slate-600 font-bold mb-1.5">
              Nominal Uang Tunai (Rp)
            </label>
            
            <input
              type="text"
              placeholder="50.000"
              value={cashPaid ? formatNumberWithDots(cashPaid) : ''}
              onChange={handleCashInputChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm tracking-wide shadow-sm"
            />

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setCashPaid(totalAmount.toString())}
                className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sky-600 font-bold text-[11px] border border-slate-200 transition active:scale-95"
              >
                Uang Pas
              </button>
              <button
                type="button"
                onClick={() => setCashPaid('50000')}
                className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200 transition active:scale-95"
              >
                50.000
              </button>
              <button
                type="button"
                onClick={() => setCashPaid('100000')}
                className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200 transition active:scale-95"
              >
                100.000
              </button>
            </div>

            {numericCashPaid > 0 && (
              <p
                className={`text-xs mt-2 font-bold ${
                  change >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {change >= 0
                  ? `Kembalian: Rp ${change.toLocaleString('id-ID')}`
                  : `Kurang: Rp ${Math.abs(change).toLocaleString('id-ID')}`}
              </p>
            )}
          </div>
        )}

        <button
          disabled={
            cart.length === 0 ||
            isProcessing ||
            (paymentMethod === 'CASH' && numericCashPaid < totalAmount)
          }
          onClick={handleCheckout}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-extrabold text-sm transition active:scale-95 shadow-md shadow-sky-500/20"
        >
          {isProcessing ? 'Memproses Transaksi...' : 'PROSES BAYAR'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col lg:flex-row h-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto pb-24 lg:pb-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-sky-600 tracking-wide">Coffeinn POS</h1>
            <p className="text-sm text-slate-500">
              Kasir Aktif: <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.role})
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser.role === 'OWNER' && onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <LayoutDashboard size={15} /> Dashboard Owner
              </button>
            )}
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <LogOut size={16} /> Ganti Shift
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu kopi atau minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none shadow-sm transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {filteredMenus.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-base font-semibold">Menu "{searchQuery}" tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                onClick={() => addToCart(menu)}
                className="bg-white border border-slate-200 hover:border-sky-500 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition active:scale-95 group shadow-sm hover:shadow-md"
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-sky-600">
                    {menu.name}
                  </h3>
                  <p className="text-sky-600 font-bold text-sm mt-1">
                    Rp {Number(menu.price).toLocaleString('id-ID')}
                  </p>
                </div>
                <button className="mt-4 w-full bg-slate-100 group-hover:bg-sky-500 group-hover:text-white text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center gap-1 text-sm transition">
                  <Plus size={16} /> Tambah
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:flex lg:w-96 bg-white border-l border-slate-200 p-6 flex-col justify-between shadow-lg">
        <RenderCartContent />
      </div>

      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="relative bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-xl shadow-sky-500/30 flex items-center justify-center transition active:scale-90"
        >
          <ShoppingBag size={26} />
          {totalItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setIsMobileCartOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="relative bg-white border-t border-slate-200 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <RenderCartContent />
          </div>
        </div>
      )}

      {lastTransaction && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <CheckCircle size={52} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-800 mb-1">Transaksi Berhasil!</h3>
            <p className="text-slate-500 text-xs mb-1 font-mono">
              ID: {lastTransaction.id}
            </p>
            <div className="bg-slate-50 p-4 rounded-xl mb-5 text-left text-xs space-y-1.5 border border-slate-200">
              <p className="text-slate-800 font-bold">
                Pelanggan: {lastTransaction.customerName || 'Pelanggan'}
              </p>
              <p className="text-slate-800 font-bold">
                Total: Rp {Number(lastTransaction.totalAmount).toLocaleString('id-ID')}
              </p>
              <p className="text-slate-600 font-semibold">Metode: {lastTransaction.paymentMethod}</p>
            </div>
            <button
              onClick={() => setLastTransaction(null)}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-3 rounded-xl text-sm transition active:scale-95 shadow-md shadow-sky-500/20"
            >
              Tutup & Pesanan Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};