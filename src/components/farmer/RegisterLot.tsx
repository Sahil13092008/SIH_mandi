import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MSP_DATA } from '../../utils/translations';
import { 
  Building2, 
  Clock, 
  BadgeIndianRupee, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight,
  Scale
} from 'lucide-react';

import { TokenConfirmationModal } from './TokenConfirmationModal';
import { Token } from '../../types';

export const RegisterLot: React.FC<{ onCreated: () => void; onCancel: () => void }> = ({ onCreated, onCancel }) => {
  const { currentFarmer, centers, createToken, t, language } = useApp();
  
  const [selectedCenterId, setSelectedCenterId] = useState(centers[0]?.center_id || 'c-rau');
  const [selectedCrop, setSelectedCrop] = useState('Wheat (गेहूं)');
  const [quantity, setQuantity] = useState<number>(10);
  const [selectedSlot, setSelectedSlot] = useState('07:00 AM - 09:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdToken, setCreatedToken] = useState<Token | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const selectedCenter = centers.find(c => c.center_id === selectedCenterId) || centers[0];
  const mspRate = MSP_DATA[selectedCrop]?.rate || 2275;
  const estimatedGrossAmount = quantity * mspRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFarmer) return;
    setIsSubmitting(true);
    try {
      const tok = await createToken({
        farmer_id: currentFarmer.farmer_id,
        farmer_name: currentFarmer.name,
        farmer_phone: currentFarmer.phone,
        farmer_village: currentFarmer.village,
        center_id: selectedCenterId,
        crop: selectedCrop,
        quantity: Number(quantity),
        msp_rate: mspRate,
        preferred_slot: selectedSlot
      });
      setCreatedToken(tok);
      setIsConfirmationOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.registerLotTitle}
            </h2>
            <p className="text-xs text-stone-500">
              {t.registerLotSub}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Select Procurement Center */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
            1. {t.selectCenter}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {centers.map(center => {
              const isSelected = center.center_id === selectedCenterId;
              return (
                <button
                  key={center.center_id}
                  type="button"
                  onClick={() => {
                    setSelectedCenterId(center.center_id);
                    if (center.slots.length > 0) setSelectedSlot(center.slots[0]);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Building2 className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-stone-400'}`} />
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-stone-900 leading-tight">
                      {center.name}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {center.district}, {center.state}
                    </div>
                    <div className="mt-2 text-[10px] inline-block px-1.5 py-0.5 rounded font-medium bg-stone-100 text-stone-700">
                      Cap: {center.daily_capacity} Qtl
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Select Crop with MSP pricing */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
            2. {t.selectCrop}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(MSP_DATA).map(([cropName, meta]) => {
              const isSelected = selectedCrop === cropName;
              return (
                <button
                  key={cropName}
                  type="button"
                  onClick={() => setSelectedCrop(cropName)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-stone-900 leading-snug">
                        {language === 'hi' ? meta.name_hi : cropName.split(' ')[0]}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        ₹{meta.rate.toLocaleString('en-IN')}/Qtl
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Crop Quantity & Live Calculation */}
        <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-stone-800">
                3. {t.cropQuantity}
              </label>
              <span className="text-[11px] text-stone-500">
                {t.quintalHelper}
              </span>
            </div>
            {/* Quick adjust stepper */}
            <div className="flex items-center gap-1.5">
              {[5, 10, 20, 50].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuantity(val)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                    quantity === val
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {val} Qtl
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              min="1"
              max="200"
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full py-2.5 px-3 rounded-lg border border-stone-300 font-bold text-lg font-mono focus:ring-2 focus:ring-emerald-500"
              required
            />
            <span className="absolute right-3 top-3 text-xs font-bold text-stone-400">
              QUINTALS
            </span>
          </div>

          {/* Gross Payout Banner */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 text-xs">
            <span className="text-stone-600 font-medium flex items-center gap-1">
              <BadgeIndianRupee className="w-4 h-4 text-emerald-700" />
              {t.estimatedGrossPayout}:
            </span>
            <span className="font-extrabold text-base text-emerald-800 font-mono">
              ₹{estimatedGrossAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 4. Preferred Time Slot */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
            4. {t.preferredSlot}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(selectedCenter?.slots || [
              '07:00 AM - 09:00 AM',
              '09:00 AM - 11:00 AM',
              '11:00 AM - 01:00 PM',
              '02:00 PM - 04:00 PM'
            ]).map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  selectedSlot === slot
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-600'
                    : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  {slot}
                </span>
                {selectedSlot === slot && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          id="confirm-token-btn"
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isSubmitting ? 'Generating Token...' : t.generateTokenBtn}</span>
        </button>
      </form>

      {/* Confirmation Screen Modal */}
      <TokenConfirmationModal
        isOpen={isConfirmationOpen}
        token={createdToken}
        onClose={() => setIsConfirmationOpen(false)}
        onViewTracker={onCreated}
      />
    </div>
  );
};
