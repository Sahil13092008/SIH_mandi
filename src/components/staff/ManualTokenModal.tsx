import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MSP_DATA } from '../../utils/translations';
import { X, UserPlus, Sparkles } from 'lucide-react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualTokenModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  const { selectedCenterId, createToken } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [crop, setCrop] = useState('Wheat (गेहूं)');
  const [quantity, setQuantity] = useState<number>(15);
  const [slot, setSlot] = useState('07:00 AM - 09:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !quantity) return;
    setIsSubmitting(true);
    try {
      await createToken({
        farmer_name: name,
        farmer_phone: phone,
        farmer_village: village || 'Local Village',
        center_id: selectedCenterId,
        crop,
        quantity: Number(quantity),
        msp_rate: MSP_DATA[crop]?.rate || 2275,
        preferred_slot: slot
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
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm sm:text-base">
              Gate Walk-In Token Entry
            </h3>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Farmer Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Radheshyam Sharma"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Village / Gram
              </label>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                placeholder="e.g. Sanwer"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Crop
              </label>
              <select
                value={crop}
                onChange={e => setCrop(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {Object.keys(MSP_DATA).map(c => (
                  <option key={c} value={c}>
                    {c.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Quantity (Quintals)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Issue Token & Send SMS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
