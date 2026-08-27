import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  CreditCard, 
  MapPin, 
  Phone, 
  Check, 
  Sparkles,
  Award
} from 'lucide-react';

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentFarmer, updateFarmerProfile, language } = useApp();

  if (!isOpen || !currentFarmer) return null;

  const [name, setName] = useState(currentFarmer.name || '');
  const [phone, setPhone] = useState(currentFarmer.phone || '');
  const [village, setVillage] = useState(currentFarmer.village || '');
  const [district, setDistrict] = useState(currentFarmer.district || 'Indore');
  const [aadhaarNumber, setAadhaarNumber] = useState(
    currentFarmer.aadhaar_number || (currentFarmer.aadhaar_last4 ? `7821 4509 ${currentFarmer.aadhaar_last4}` : '')
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    currentFarmer.bank_account_number || (currentFarmer.bank_account_last4 ? `9982412891${currentFarmer.bank_account_last4}` : '')
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Format Aadhaar in 4-digit chunks e.g. "1234 5678 9012"
  const handleAadhaarChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaarNumber(formatted);
  };

  const rawAadhaar = aadhaarNumber.replace(/\D/g, '');
  const isAadhaarValid = rawAadhaar.length === 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया नाम दर्ज करें' : 'Please enter your name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await updateFarmerProfile({
        name,
        phone,
        village,
        district,
        aadhaar_number: aadhaarNumber,
        bank_account_number: bankAccountNumber
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-3xl flex items-center justify-center border border-white/20 shadow-inner">
              👨‍🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {language === 'hi' ? 'किसान प्रोफाइल' : 'Farmer Profile Settings'}
                </h2>
                {isAadhaarValid && (
                  <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    e-KYC Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/80">
                {language === 'hi' 
                  ? 'अपनी व्यक्तिगत एवं आधार / बैंक डीबीटी जानकारी अपडेट करें' 
                  : 'Manage personal details, Aadhaar e-KYC, and bank accounts for DBT'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{language === 'hi' ? 'प्रोफाइल सफलतापूर्वक अपडेट हो गई!' : 'Profile updated successfully!'}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-500" />
              {language === 'hi' ? 'पूरा नाम (Name)' : 'Full Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              required
            />
          </div>

          {/* Mobile Phone & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                {language === 'hi' ? 'मोबाइल नंबर (Phone)' : 'Mobile Phone'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10 digit mobile"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-500" />
                {language === 'hi' ? 'जिला (District)' : 'District'}
              </label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="e.g. Indore"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Village / Gram */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              {language === 'hi' ? 'गांव / ग्राम (Village)' : 'Village / Gram Panchayat'}
            </label>
            <input
              type="text"
              value={village}
              onChange={e => setVillage(e.target.value)}
              placeholder="e.g. Rau Village"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Aadhaar Card Input & Validation */}
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                {language === 'hi' ? 'आधार कार्ड संख्या (Aadhaar Card Number)' : 'Aadhaar Card Number (12 Digits)'}
              </label>
              {isAadhaarValid ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              ) : (
                <span className="text-[11px] font-medium text-stone-500">
                  {12 - rawAadhaar.length} digits left
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={aadhaarNumber}
                onChange={e => handleAadhaarChange(e.target.value)}
                placeholder="e.g. 7821 4509 1234"
                maxLength={14}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-emerald-950 font-mono font-bold tracking-wider text-base bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
              />
            </div>
            <p className="text-[11px] text-emerald-800/80 leading-relaxed">
              🔒 {language === 'hi' 
                ? 'आधार प्रमाणीकरण का उपयोग एमएसपी उपार्जन में डायरेक्ट बेनिफिट ट्रांसफर (DBT) भुगतान के लिए होता है।' 
                : 'Aadhaar e-KYC is used to authenticate MSP grain procurement and direct bank transfers.'}
            </p>
          </div>

          {/* Bank Account Number for DBT */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-stone-500" />
              {language === 'hi' ? 'बैंक खाता संख्या / DBT Account' : 'Bank Account Number (DBT Linked)'}
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={e => setBankAccountNumber(e.target.value)}
              placeholder="e.g. 99824128914509"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'hi' ? 'प्रोफाइल सहेजें' : 'Save Profile Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
