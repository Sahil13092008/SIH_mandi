import React, { useState } from 'react';
import { QualityCheckResult, Token } from '../../types';
import { ShieldCheck, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface QCModalProps {
  token: Token;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: QualityCheckResult) => Promise<void>;
}

export const QualityCheckModal: React.FC<QCModalProps> = ({ token, isOpen, onClose, onSubmit }) => {
  const [grade, setGrade] = useState<QualityCheckResult['grade']>('Grade A (FAQ)');
  const [moisture, setMoisture] = useState<number>(11.2);
  const [impurities, setImpurities] = useState<number>(0.9);
  const [offeredRate, setOfferedRate] = useState<number>(token.msp_rate || 2275);
  const [notes, setNotes] = useState<string>('Standard Fair Average Quality (FAQ). Uniform grain, dry and pest-free.');
  const [inspectorName, setInspectorName] = useState<string>('Dr. A. K. Sharma (Mandi QC)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGradeChange = (newGrade: QualityCheckResult['grade']) => {
    setGrade(newGrade);
    const baseMsp = token.msp_rate || 2275;
    if (newGrade === 'Grade A (FAQ)') setOfferedRate(baseMsp);
    else if (newGrade === 'Grade B') setOfferedRate(Math.round(baseMsp * 0.95));
    else if (newGrade === 'Grade C') setOfferedRate(Math.round(baseMsp * 0.88));
    else if (newGrade === 'Rejected') setOfferedRate(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        grade,
        moisture: Number(moisture),
        impurities: Number(impurities),
        offered_rate: grade === 'Rejected' ? 0 : Number(offeredRate),
        notes,
        inspector_name: inspectorName,
        inspected_at: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Quality Inspection & Grading Lab
              </h3>
              <p className="text-[11px] text-emerald-200">
                Token {token.token_number} • {token.farmer_name} ({token.crop})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Grade selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Procurement Grade (गुणवत्ता श्रेणी)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Grade A (FAQ)', 'Grade B', 'Grade C', 'Rejected'] as QualityCheckResult['grade'][]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGradeChange(g)}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                    grade === g
                      ? g === 'Rejected'
                        ? 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-600'
                        : 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{g}</span>
                    {grade === g && <CheckCircle2 className={`w-3.5 h-3.5 ${g === 'Rejected' ? 'text-red-600' : 'text-emerald-600'}`} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Moisture & Impurities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Moisture % (नमी)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={moisture}
                  onChange={e => setMoisture(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-stone-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">Limit: ≤ 12.0%</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Foreign Matter % (कचरा/धूल)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={impurities}
                  onChange={e => setImpurities(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-stone-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">Limit: ≤ 2.0%</span>
            </div>
          </div>

          {/* Quality Price / Offered Rate Adjustment */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-stone-800">
                Offered Procurement Rate (गुणवत्ता दर - ₹/Qtl)
              </label>
              <span className="text-[11px] text-stone-500 font-mono">
                MSP: ₹{token.msp_rate}/Qtl
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-bold text-stone-500 font-mono">₹</span>
              <input
                type="number"
                min="0"
                max="25000"
                disabled={grade === 'Rejected'}
                value={offeredRate}
                onChange={e => setOfferedRate(Math.max(0, Number(e.target.value)))}
                className="w-full pl-7 pr-16 py-1.5 rounded-lg border border-stone-300 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 disabled:bg-stone-100 disabled:text-stone-400"
                required
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">
                PER QTL
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              {grade === 'Rejected' 
                ? '❌ Lot is rejected. Offered procurement rate set to ₹0.' 
                : `Gross Payout for ${token.quantity} Qtl: ₹${(token.quantity * offeredRate).toLocaleString('en-IN')}`}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Lab Observations & Remarks
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Inspector Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Authorized Mandi Quality Officer
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={e => setInspectorName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              id="submit-qc-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Certify Quality & Advance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
