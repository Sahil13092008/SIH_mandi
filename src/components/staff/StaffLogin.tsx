import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  role_title: string;
  center_id: string;
  center_name: string;
  phone: string;
}

const DEMO_STAFF: StaffUser[] = [
  {
    id: 'STAFF-RAU-01',
    name: 'Dr. A. K. Sharma',
    role_title: 'Mandi Quality Inspector & Gate Officer',
    center_id: 'c-rau',
    center_name: 'Rau Mandi Procurement Center',
    phone: '9826011111'
  },
  {
    id: 'STAFF-IND-02',
    name: 'Rajeshwar Singh',
    role_title: 'Senior Procurement Officer',
    center_id: 'c-indore',
    center_name: 'Indore Main APMC Mandi',
    phone: '9826022222'
  },
  {
    id: 'STAFF-UJJ-03',
    name: 'Vikramaditya Rao',
    role_title: 'Chief Mandi Secretary & Auditor',
    center_id: 'c-ujjain',
    center_name: 'Ujjain Krishi Upaj Mandi',
    phone: '9826033333'
  }
];

export const StaffLogin: React.FC<{ onLoggedIn: (staff: StaffUser) => void }> = ({ onLoggedIn }) => {
  const { setSelectedCenterId, language } = useApp();

  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStaffLogin = (user: StaffUser) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedCenterId(user.center_id);
      onLoggedIn(user);
      setIsLoading(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setError('Please select or enter a Mandi Staff Officer ID');
      return;
    }
    const matched = DEMO_STAFF.find(s => s.id.toLowerCase() === staffId.toLowerCase() || s.phone === staffId) || DEMO_STAFF[0];
    handleStaffLogin(matched);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-6 text-center relative">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
          🏛️
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Mandi Staff & Officer Portal
        </h2>
        <p className="text-xs text-stone-400 mt-1 font-medium">
          Ministry of Agriculture • Official Mandi Procurement Terminal
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Demo Staff Login Accounts */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              1-Click Demo Officer Login
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>

          <div className="space-y-2">
            {DEMO_STAFF.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleStaffLogin(user)}
                className="w-full p-3 rounded-2xl border border-stone-200 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/50 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-xs group-hover:text-emerald-900">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded">
                      {user.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {user.role_title} • {user.center_name.split(' ')[0]}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-widest absolute">
            or Staff Credentials
          </span>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              Staff Officer ID / Mobile Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. STAFF-RAU-01"
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
                className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-stone-300 font-medium text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              Mandi Terminal PIN / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-stone-300 font-medium text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          >
            <span>{isLoading ? 'Authenticating Staff Terminal...' : 'Login to Staff Terminal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2 text-[11px] text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Restricted to Authorized Government Mandi Officers & Gate Clerks</span>
        </div>
      </div>
    </div>
  );
};
