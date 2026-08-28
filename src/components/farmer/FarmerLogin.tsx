import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Farmer } from '../../types';
import { ShieldCheck, ArrowRight, UserPlus, Sparkles } from 'lucide-react';

export interface DemoFarmerAccount {
  name: string;
  phone: string;
  village: string;
  crop?: string;
}

const DEFAULT_DEMO_ACCOUNTS: DemoFarmerAccount[] = [
  { name: 'Ramesh Kumar', phone: '9876543210', village: 'Rau Village', crop: 'Wheat' },
  { name: 'Suresh Patel', phone: '9826012345', village: 'Rangwasa', crop: 'Soybean' },
  { name: 'Rajesh Verma', phone: '9425098765', village: 'Sanwer', crop: 'Mustard' }
];

const loadSavedFarmers = (): DemoFarmerAccount[] => {
  try {
    const raw = localStorage.getItem('mandi_farmers_registry');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const phoneSet = new Set(parsed.map((p: DemoFarmerAccount) => p.phone));
        const merged: DemoFarmerAccount[] = [...parsed];
        DEFAULT_DEMO_ACCOUNTS.forEach(d => {
          if (!phoneSet.has(d.phone)) merged.push(d);
        });
        return merged;
      }
    }
  } catch (e) {}
  return DEFAULT_DEMO_ACCOUNTS;
};

export const FarmerLogin: React.FC<{ onLoggedIn: () => void }> = ({ onLoggedIn }) => {
  const { t, registerFarmer, refreshFarmerTokens } = useApp();
  const [demoAccounts, setDemoAccounts] = useState(loadSavedFarmers);
  const [phone, setPhone] = useState('9876543210');
  const [name, setName] = useState('Ramesh Kumar');
  const [village, setVillage] = useState('Rau Village');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [otp, setOtp] = useState('4582');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectDemo = (acc: typeof DEFAULT_DEMO_ACCOUNTS[0]) => {
    setPhone(acc.phone);
    setName(acc.name);
    setVillage(acc.village);
    setIsRegisterMode(false);
    setStep('otp');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isDemoAccount = DEFAULT_DEMO_ACCOUNTS.some(d => d.phone === phone);
    const matchedDemo = demoAccounts.find(d => d.phone === phone);
    const farmerName = (isRegisterMode ? name.trim() : '') || (matchedDemo ? matchedDemo.name : 'Kisan Bhaai');
    const farmerVillage = (isRegisterMode ? village.trim() : '') || (matchedDemo ? matchedDemo.village : 'Rau Village');

    // For demo seed accounts, keep the familiar aadhaar/bank stubs.
    // For newly registered farmers, leave those fields empty (last-4 unknown without real KYC).
    const farmerProfile: Farmer = {
      farmer_id: `f-${phone}`,
      name: farmerName,
      phone,
      village: farmerVillage,
      district: 'Indore',
      aadhaar_last4: isDemoAccount ? '7821' : undefined,
      bank_account_last4: isDemoAccount ? '4509' : undefined,
      is_aadhaar_verified: isDemoAccount,
      created_at: new Date().toISOString()
    };

    // Persist locally + to Supabase via registerFarmer (Group 1.5)
    // Also keep the local demo-accounts list in sync for the UI dropdown
    try {
      const demoEntry: DemoFarmerAccount = {
        name: farmerProfile.name,
        phone: farmerProfile.phone,
        village: farmerProfile.village
      };
      setDemoAccounts(prev => [
        demoEntry,
        ...prev.filter(e => e.phone !== farmerProfile.phone)
      ]);
    } catch (e) {}

    try {
      if (typeof window !== 'undefined' && import.meta.env.DEV && window.location.port === '3000') {
        const res = await fetch('/api/farmers/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            name: isRegisterMode ? name : undefined,
            village: isRegisterMode ? village : undefined
          })
        });
        if (res.ok) {
          const farmer = await res.json() as Farmer;
          if (farmer && farmer.farmer_id) {
            await registerFarmer(farmer);
            await refreshFarmerTokens(farmer.phone);
            onLoggedIn();
            return;
          }
        }
      }
    } catch (err) {
      // Fall through to client-side path
    }

    // Client-side path: registerFarmer writes to localStorage + Supabase
    await registerFarmer(farmerProfile);
    await refreshFarmerTokens(farmerProfile.phone);
    onLoggedIn();
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
          🌾
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">
          {t.farmerLoginTitle}
        </h2>
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          {t.farmerLoginSub}
        </p>
      </div>

      {/* Quick Demo Selector */}
      <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            {t.quickDemoFarmers}
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
            One-Click Login
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {demoAccounts.map(acc => (
            <button
              key={acc.phone}
              type="button"
              onClick={() => handleSelectDemo(acc)}
              className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all text-xs"
            >
              <div>
                <span className="font-bold text-stone-900">{acc.name}</span>
                <span className="text-stone-400 text-[11px] ml-1">({acc.village})</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                {acc.phone}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Login / OTP Form */}
      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t.phoneNumber}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 text-xs font-medium">
                +91
              </div>
              <input
                id="farmer-phone-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={t.phonePlaceholder}
                className="w-full pl-11 pr-3 py-2.5 rounded-lg border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {isRegisterMode && (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.village}
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="e.g. Rau Village"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                if (!isRegisterMode) {
                  setName('');
                  setVillage('');
                }
              }}
              className="text-xs text-stone-600 hover:text-emerald-700 underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isRegisterMode ? 'Standard Login' : (t.newFarmerOption || '+ New Farmer Registration')}</span>
            </button>
          </div>

          <button
            id="get-otp-btn"
            type="submit"
            disabled={phone.length < 10 || (isRegisterMode && (!name.trim() || !village.trim()))}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <span>{t.requestOtp}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-stone-600">{t.otpSentTo} </span>
              <span className="font-mono font-bold">+91 {phone}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-emerald-700 underline text-[11px] font-semibold"
            >
              Change
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t.enterOtp}
            </label>
            <input
              id="otp-input"
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              className="w-full text-center tracking-widest text-lg font-bold font-mono py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1 text-center">
              (Auto-filled test OTP for prototype demo)
            </p>
          </div>

          {isRegisterMode && (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.village}
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-stone-600 hover:text-emerald-700 underline"
            >
              {isRegisterMode ? 'Standard Login' : t.newFarmerOption}
            </button>
          </div>

          <button
            id="verify-otp-btn"
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : t.verifyAndProceed}</span>
          </button>
        </form>
      )}
    </div>
  );
};
