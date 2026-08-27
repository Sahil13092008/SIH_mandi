import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FarmerLogin } from './FarmerLogin';
import { RegisterLot } from './RegisterLot';
import { LiveTokenTracker } from './LiveTokenTracker';
import { FarmerProfileModal } from './FarmerProfileModal';
import { 
  User, 
  PlusCircle, 
  Smartphone, 
  Monitor, 
  History, 
  LogOut, 
  Edit3,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Token } from '../../types';

export const FarmerApp: React.FC = () => {
  const { 
    currentFarmer, 
    setCurrentFarmer, 
    activeToken, 
    setActiveToken, 
    farmerTokens, 
    t,
    language 
  } = useApp();

  const [view, setView] = useState<'tracker' | 'register' | 'history'>('tracker');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  if (!currentFarmer) {
    return (
      <div className="py-8 px-4">
        <FarmerLogin onLoggedIn={() => setView('tracker')} />
      </div>
    );
  }

  const isAadhaarVerified = currentFarmer.is_aadhaar_verified || (currentFarmer.aadhaar_last4 && currentFarmer.aadhaar_last4.length === 4);

  return (
    <div className="py-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Profile & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Farmer Info Banner with Edit Action */}
        <div 
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-3 group cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-stone-50 transition-colors"
          title="Click to View / Edit Profile & Aadhaar Number"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
            👨‍🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 text-sm sm:text-base group-hover:text-emerald-800 transition-colors">
                {currentFarmer.name}
              </span>
              <span className="text-[11px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                +91 {currentFarmer.phone}
              </span>
              {isAadhaarVerified ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Aadhaar Verified
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  Add Aadhaar
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <span>{currentFarmer.village}, {currentFarmer.district || 'Indore'}</span>
              <span className="text-emerald-700 font-semibold underline text-[11px] inline-flex items-center gap-0.5">
                <Edit3 className="w-3 h-3" /> Edit Profile
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-stone-600" />
            <span>Profile & Aadhaar</span>
          </button>

          <button
            id="book-slot-btn"
            onClick={() => setView('register')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'register'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Book New Lot</span>
          </button>

          {/* Tokens selector dropdown if multiple tokens */}
          {farmerTokens.length > 0 && (
            <div className="relative">
              <select
                id="select-token-dropdown"
                value={activeToken?.token_id || ''}
                onChange={e => {
                  const selected = farmerTokens.find(t => t.token_id === e.target.value);
                  if (selected) {
                    setActiveToken(selected);
                    setView('tracker');
                  }
                }}
                className="text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-lg border border-stone-300 bg-white text-stone-700 focus:ring-2 focus:ring-emerald-500"
              >
                {farmerTokens.map(tok => (
                  <option key={tok.token_id} value={tok.token_id}>
                    Token {tok.token_number} ({tok.crop} - {tok.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Device Frame */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors hidden md:block"
            title={isMobileFrame ? 'Expand to Full Width' : 'Wrap in Phone Frame'}
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Switch Farmer */}
          <button
            onClick={() => setCurrentFarmer(null)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
            title="Switch / Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container: Mobile Frame vs Wide */}
      <div className={isMobileFrame ? 'max-w-md mx-auto' : 'max-w-4xl mx-auto'}>
        {isMobileFrame && (
          <div className="text-center mb-2">
            <span className="text-[11px] font-medium text-stone-400">
              📱 Farmer Mobile PWA Mode
            </span>
          </div>
        )}

        <div className={isMobileFrame ? 'p-3 bg-stone-900 rounded-3xl shadow-2xl border-4 border-stone-800' : ''}>
          <div className={isMobileFrame ? 'bg-stone-50 rounded-2xl p-4 overflow-y-auto max-h-[80vh] border border-stone-200' : ''}>
            {view === 'register' ? (
              <RegisterLot
                onCreated={() => setView('tracker')}
                onCancel={() => setView('tracker')}
              />
            ) : activeToken ? (
              <LiveTokenTracker
                token={activeToken}
                onBookAnother={() => setView('register')}
              />
            ) : (
              <div className="text-center py-12 space-y-4 bg-white rounded-2xl border border-stone-200 p-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                  🌾
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  No Active Tokens Found
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Book a slot to get a digital queue token for your crop lot.
                </p>
                <button
                  onClick={() => setView('register')}
                  className="py-2.5 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-800"
                >
                  Book Mandi Token Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile & Aadhaar Modal */}
      <FarmerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
