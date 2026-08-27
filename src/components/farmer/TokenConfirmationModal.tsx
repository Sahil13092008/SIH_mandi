import React from 'react';
import { Token } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  QrCode, 
  Clock, 
  Building2, 
  Scale, 
  BadgeIndianRupee, 
  Printer, 
  ArrowRight,
  Share2,
  ShieldCheck
} from 'lucide-react';

interface TokenConfirmationModalProps {
  token: Token | null;
  isOpen: boolean;
  onClose: () => void;
  onViewTracker: () => void;
}

export const TokenConfirmationModal: React.FC<TokenConfirmationModalProps> = ({
  token,
  isOpen,
  onClose,
  onViewTracker
}) => {
  const { language } = useApp();

  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        
        {/* Success Header Banner */}
        <div className="bg-emerald-700 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-600/30 rounded-full blur-xl pointer-events-none" />
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md ring-4 ring-white/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-300 animate-pulse" />
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {language === 'hi' ? 'डिजिटल टोकन जारी हुआ!' : 'Digital Token Generated!'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            {language === 'hi' ? 'ई-मंडी प्रणाली द्वारा टोकन सफलतापूर्वक बुक हो गया है' : 'Your Mandi slot is confirmed. Keep this token handy at the gate.'}
          </p>
        </div>

        {/* Token Details Card */}
        <div className="p-6 space-y-5">
          
          {/* Main Token Badge & QR Code */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-stone-500 tracking-wider">
                {language === 'hi' ? 'टोकन संख्या' : 'Token Number'}
              </span>
              <div className="text-3xl font-black text-emerald-900 font-mono tracking-tight">
                {token.token_number}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Pos #{token.queue_position}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {token.estimated_time}
                </span>
              </div>
            </div>

            {/* Visual QR Code Box */}
            <div className="p-2 bg-white rounded-xl border border-stone-300 shadow-xs flex flex-col items-center">
              <QrCode className="w-12 h-12 text-stone-800" />
              <span className="text-[9px] font-bold text-stone-400 mt-0.5">GATE QR</span>
            </div>
          </div>

          {/* Grid Info Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 space-y-1">
              <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'hi' ? 'उपज व मात्रा' : 'Crop & Quantity'}</span>
              </div>
              <div className="font-bold text-stone-900 leading-tight">
                {token.crop}
              </div>
              <div className="font-mono font-bold text-emerald-800 text-sm">
                {token.quantity} Qtl
              </div>
            </div>

            <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 space-y-1">
              <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <BadgeIndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'hi' ? 'अनुमानित राशि' : 'Gross Payout'}</span>
              </div>
              <div className="font-bold text-stone-900 leading-tight">
                MSP ₹{token.msp_rate}/Qtl
              </div>
              <div className="font-mono font-bold text-emerald-800 text-sm">
                ₹{token.payment_amount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 space-y-1">
              <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'hi' ? 'समय स्लॉट' : 'Arrival Slot'}</span>
              </div>
              <div className="font-bold text-stone-900 leading-tight">
                {token.preferred_slot}
              </div>
            </div>

            <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 space-y-1">
              <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                <span>{language === 'hi' ? 'उपारजन केंद्र' : 'Mandi Center'}</span>
              </div>
              <div className="font-bold text-stone-900 leading-tight truncate">
                {token.center_name}
              </div>
            </div>
          </div>

          {/* Aadhaar Authenticated Badge */}
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>e-KYC Authenticated for Direct Bank Transfer (DBT)</span>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onViewTracker();
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              <span>{language === 'hi' ? 'लाइव ट्रैक देखें' : 'View Live Queue Tracker'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>{language === 'hi' ? 'रसीद प्रिंट करें' : 'Print Token Receipt'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
