import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Token, TokenStatus } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Receipt, 
  Download, 
  Share2, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  Building2, 
  Truck,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LiveTokenTracker: React.FC<{ token: Token; onBookAnother: () => void }> = ({ token, onBookAnother }) => {
  const { t, language, speakText } = useApp();

  const stages: { key: TokenStatus; labelEn: string; labelHi: string; icon: string }[] = [
    { key: 'Registered', labelEn: 'Registered', labelHi: 'पंजीकृत', icon: '📝' },
    { key: 'In Queue', labelEn: 'In Queue', labelHi: 'कतार में', icon: '🚜' },
    { key: 'Quality Check', labelEn: 'Quality Check', labelHi: 'गुणवत्ता जांच', icon: '🔬' },
    { key: 'Procured', labelEn: 'Procured', labelHi: 'तौल संपन्न', icon: '⚖️' },
    { key: 'Payment Sent', labelEn: 'Payment Sent', labelHi: 'भुगतान सफल', icon: '💰' }
  ];

  const stageOrder: Record<TokenStatus, number> = {
    'Registered': 0,
    'In Queue': 1,
    'Quality Check': 2,
    'Procured': 3,
    'Payment Sent': 4,
    'Rejected': -1,
    'Cancelled': -1
  };

  const currentStageIndex = stageOrder[token.status] ?? 0;

  // Trigger confetti when payment is sent
  useEffect(() => {
    if (token.status === 'Payment Sent') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // fallback safe
      }
    }
  }, [token.status]);

  // Voice advice strings
  const getStageAdvice = () => {
    switch (token.status) {
      case 'Registered':
        return {
          en: t.tipRegistered,
          hi: t.tipRegistered
        };
      case 'In Queue':
        return {
          en: t.tipInQueue,
          hi: t.tipInQueue
        };
      case 'Quality Check':
        return {
          en: t.tipQualityCheck,
          hi: t.tipQualityCheck
        };
      case 'Procured':
        return {
          en: t.tipProcured,
          hi: t.tipProcured
        };
      case 'Payment Sent':
        return {
          en: t.tipPaymentSent.replace('{amount}', token.payment_amount.toLocaleString('en-IN')),
          hi: t.tipPaymentSent.replace('{amount}', token.payment_amount.toLocaleString('en-IN'))
        };
      default:
        return { en: '', hi: '' };
    }
  };

  const advice = getStageAdvice();

  const handlePlayVoice = () => {
    const speechEn = `Token ${token.token_number}. Current status is ${token.status}. ${advice.en}`;
    const speechHi = `टोकन संख्या ${token.token_number}। आपकी वर्तमान स्थिति ${token.status} है। ${advice.hi}`;
    speakText(speechEn, speechHi);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. Main High-Contrast Token Card */}
      <div className="bg-linear-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden border border-emerald-800">
        {/* Subtle decorative grain background */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Row: Mandi & Slot */}
          <div className="flex items-start justify-between border-b border-emerald-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-emerald-200">
                  {token.center_name}
                </div>
                <div className="text-[11px] text-emerald-300/80 font-mono">
                  Arrival Slot: {token.preferred_slot}
                </div>
              </div>
            </div>

            {/* Audio Readout Assistant */}
            <button
              id="voice-guidance-btn"
              onClick={handlePlayVoice}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-colors shadow-xs"
              title="Listen to status in audio"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'आवाज सुनें' : 'Listen Status'}</span>
            </button>
          </div>

          {/* Center Main: Huge Token Number & Live Queue Pos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                {t.tokenNumber}
              </span>
              <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-white flex items-center gap-2">
                <span>{token.token_number}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-200 border border-emerald-700 font-sans font-bold">
                  {token.status}
                </span>
              </div>
              <div className="text-xs text-emerald-200/90 mt-1">
                {token.farmer_name} • {token.farmer_village}
              </div>
            </div>

            {/* Queue Position Box */}
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300">
                  {t.queuePosition}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
                  {token.queue_position > 0 ? `#${token.queue_position}` : '—'}
                </div>
                <div className="text-[11px] text-emerald-200">
                  {token.queue_position > 1 ? `${token.queue_position - 1} ${t.aheadOfYou}` : 'Next turn in yard'}
                </div>
              </div>

              <div className="text-right border-l border-emerald-700/60 pl-3">
                <span className="text-[10px] uppercase font-bold text-emerald-300">
                  {t.estimatedWaitTime}
                </span>
                <div className="text-sm sm:text-base font-bold text-white flex items-center justify-end gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{token.estimated_time}</span>
                </div>
                <div className="text-[10px] text-emerald-300 mt-0.5">
                  Est. 10m / lot
                </div>
              </div>
            </div>
          </div>

          {/* Crop & Quantity Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-800 text-emerald-100 font-medium">
                {token.crop}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {token.quantity} Quintals (1000 kg)
              </span>
            </div>
            <div className="font-mono text-emerald-300 text-xs">
              MSP Rate: ₹{token.msp_rate.toLocaleString('en-IN')}/Qtl
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Status Stepper */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
          {t.liveStatusTitle}
        </h3>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-4 right-4 h-1 bg-stone-200 -z-0 hidden sm:block">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
            />
          </div>

          {/* Stepper items */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage.key}
                  className={`flex sm:flex-col items-center gap-3 sm:gap-2 p-2.5 sm:p-2 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-emerald-50 border border-emerald-300'
                      : isPast
                      ? 'bg-stone-50 border border-stone-200 opacity-90'
                      : 'opacity-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-xs shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 animate-pulse'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : stage.icon}
                  </div>

                  <div className="text-left sm:text-center min-w-0">
                    <div className={`text-xs font-bold truncate ${isCurrent ? 'text-emerald-900' : 'text-stone-700'}`}>
                      {language === 'hi' ? stage.labelHi : stage.labelEn}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                        • Current •
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Contextual Tip / Advice */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">
              {language === 'hi' ? 'मार्गदर्शन (Instructions): ' : 'Yard Guidance: '}
            </span>
            {language === 'hi' ? advice.hi : advice.en}
          </div>
        </div>
      </div>

      {/* 3. Quality Check Results Card (if completed or in progress) */}
      {token.quality_check_result && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-stone-900">
                Official Quality Grading & Lab Report
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {token.quality_check_result.grade}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 text-[11px] block">Moisture Content</span>
              <span className="font-extrabold text-stone-900 font-mono text-sm">
                {token.quality_check_result.moisture}%
              </span>
              <span className="text-[10px] text-emerald-700 block font-medium">Standard (≤ 12%)</span>
            </div>

            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 text-[11px] block">Foreign Matter / Dust</span>
              <span className="font-extrabold text-stone-900 font-mono text-sm">
                {token.quality_check_result.impurities}%
              </span>
              <span className="text-[10px] text-emerald-700 block font-medium">Permissible (≤ 2%)</span>
            </div>

            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 col-span-2 sm:col-span-1">
              <span className="text-stone-500 text-[11px] block">Certified Inspector</span>
              <span className="font-bold text-stone-900 text-xs">
                {token.quality_check_result.inspector_name}
              </span>
            </div>
          </div>

          {token.quality_check_result.notes && (
            <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded border border-stone-200/80">
              <span className="font-semibold text-stone-700">Remarks: </span>
              {token.quality_check_result.notes}
            </div>
          )}
        </div>
      )}

      {/* 4. Payment Receipt Card (If Payment Sent) */}
      {token.status === 'Payment Sent' && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-lg space-y-4 relative">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                ₹
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  {t.paymentReceipt}
                </h4>
                <p className="text-[11px] text-stone-500">
                  Ref: {token.payment_reference || 'UPI-DBT-9982412891'}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ✓ {t.creditedSuccess}
            </span>
          </div>

          {/* Receipt Breakdown */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2 text-xs">
            <div className="flex justify-between text-stone-700">
              <span>Beneficiary Farmer:</span>
              <span className="font-bold text-stone-900">{token.farmer_name}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Crop & Quantity:</span>
              <span className="font-mono font-bold text-stone-900">{token.crop} ({token.quantity} Qtl)</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Government MSP Rate:</span>
              <span className="font-mono text-stone-900">₹{token.msp_rate.toLocaleString('en-IN')}/Qtl</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Bank Account:</span>
              <span className="font-mono text-stone-900">A/c ending in ...4509 (DBT Linked)</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Payment Time:</span>
              <span className="font-mono text-stone-900">{token.payment_confirmed_at ? new Date(token.payment_confirmed_at).toLocaleString() : new Date().toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm">
              <span className="font-bold text-emerald-950">Total Amount Credited:</span>
              <span className="font-black text-xl text-emerald-900 font-mono">
                ₹{token.payment_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.downloadReceipt}</span>
            </button>
            <button
              onClick={() => {
                const text = `e-MANDI Receipt: Token ${token.token_number} - ₹${token.payment_amount} credited for ${token.quantity}q ${token.crop}.`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.shareReceipt}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Book Another Button */}
      <div className="pt-2 text-center">
        <button
          onClick={onBookAnother}
          className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline flex items-center justify-center gap-1 mx-auto"
        >
          <span>{t.registerAnother}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
