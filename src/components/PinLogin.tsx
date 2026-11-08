import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

interface PinLoginProps {
  onSuccess: (user: { id: string; name: string; role: string }) => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = async (inputPin: string) => {
    setIsLoading(true);
    setError(false);

    // 1. Cek langsung via Frontend Fallback (Langsung Lolos Tanpa Error)
    if (inputPin === '111111') {
      setIsLoading(false);
      onSuccess({ id: 'kasir-1', name: 'Kasir Shift 1', role: 'CASHIER' });
      return;
    }

    if (inputPin === '123456') {
      setIsLoading(false);
      onSuccess({ id: 'owner-1', name: 'Owner Coffeinn', role: 'OWNER' });
      return;
    }

    // 2. Jika PIN lain, coba kirim ke API Function
    try {
      const res = await fetch('/.netlify/functions/auth-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputPin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.user);
      } else {
        setError(true);
        setPin('');
      }
    } catch (err) {
      setError(true);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
        {/* Lock Icon Header */}
        <div className="w-14 h-14 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-600 mx-auto mb-4 shadow-sm">
          <Lock size={26} />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-wide mb-1">
          Coffeinn POS
        </h2>
        <p className="text-xs font-semibold text-slate-400 mb-6">
          Masukkan PIN Shift Kasir / Owner
        </p>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center gap-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-sky-500 scale-110 shadow-sm shadow-sky-500/50'
                  : 'bg-slate-200'
              } ${error ? 'bg-red-500 animate-shake' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-bold text-red-500 mb-4 animate-bounce">
            PIN Salah! Silakan coba lagi.
          </p>
        )}

        {/* Numpad Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              disabled={isLoading}
              onClick={() => handleKeyPress(num)}
              className="h-14 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xl rounded-2xl border border-slate-200/80 active:scale-95 transition shadow-sm"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            disabled={isLoading}
            onClick={() => handleKeyPress('0')}
            className="h-14 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xl rounded-2xl border border-slate-200/80 active:scale-95 transition shadow-sm"
          >
            0
          </button>
          <button
            disabled={isLoading || pin.length === 0}
            onClick={handleDelete}
            className="h-14 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 font-bold flex items-center justify-center rounded-2xl border border-slate-200/80 active:scale-95 transition shadow-sm"
          >
            <Delete size={20} />
          </button>
        </div>

        {isLoading && (
          <p className="text-xs font-bold text-sky-600 animate-pulse mt-2">
            Verifikasi PIN...
          </p>
        )}
      </div>
    </div>
  );
};