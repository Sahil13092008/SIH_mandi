import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Tractor, 
  Building2, 
  MessageSquareText, 
  BarChart3, 
  RotateCcw, 
  Radio, 
  Languages, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AppRole } from '../../types';

export const Header: React.FC = () => {
  const { 
    role, 
    setRole, 
    language, 
    setLanguage, 
    t, 
    resetDemoData, 
    isConnected, 
    smsLogs 
  } = useApp();

  const [isResetting, setIsResetting] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetDemoData();
    setIsResetting(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const navItems: { role: AppRole; label: string; icon: React.ReactNode; badge?: number }[] = [
    { role: 'farmer', label: t.roleFarmer, icon: <Tractor className="w-4 h-4" /> },
    { role: 'staff', label: t.roleStaff, icon: <Building2 className="w-4 h-4" /> },
    { 
      role: 'sms', 
      label: t.roleSMS, 
      icon: <MessageSquareText className="w-4 h-4" />,
      badge: smsLogs.length 
    },
    { role: 'admin', label: t.roleAdmin, icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* National Tricolor Accent Bar */}
      <div className="h-1 w-full bg-linear-to-r from-amber-600 via-stone-100 to-emerald-600" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Top Branding Row */}
        <div className="flex items-center justify-between py-2.5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs ring-1 ring-emerald-800/20">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  SIH Prototype • e-NAM
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">
                {t.govHeader}
              </p>
            </div>
          </div>

          {/* Right utility buttons: Language, Live Sync, Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600 animate-pulse' : 'text-stone-400'}`} />
              <span className="text-[11px] sm:text-xs font-semibold">{isConnected ? (t.liveSync || 'Live Sync Active') : 'Connecting...'}</span>
            </div>

            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="Toggle Language / भाषा बदलें"
            >
              <Languages className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Reset Demo Button */}
            <button
              id="reset-demo-btn"
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
              title="Reset sample queue, tokens and SMS logs to initial state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.resetDemo}</span>
            </button>
          </div>
        </div>

        {/* Role Navigation Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar">
          {navItems.map(item => {
            const isActive = role === item.role;
            return (
              <button
                key={item.role}
                id={`nav-role-${item.role}`}
                onClick={() => setRole(item.role)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toast confirmation */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-stone-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Demo queue & data restored to pristine initial state!</span>
        </div>
      )}
    </header>
  );
};
