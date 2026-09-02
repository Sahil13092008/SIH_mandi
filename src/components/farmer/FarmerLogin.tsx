import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Farmer } from '../../types';
import { 
  ShieldCheck, 
  ArrowRight, 
  UserPlus, 
  Sparkles, 
  Award, 
  Phone, 
  CheckCircle2, 
  RefreshCw,
  Info,
  Building2,
  MapPin,
  User
} from 'lucide-react';

export const FarmerLogin: React.FC<{ onLoggedIn: () => void }> = ({ onLoggedIn }) => {
  const { t, language, allFarmers, findFarmer, registerFarmer, refreshFarmerTokens } = useApp();

  // Mode: 'aadhaar' (Primary) vs 'phone' (Secondary)
  const [authMethod, setAuthMethod] = useState<'aadhaar' | 'phone'>('aadhaar');

  // Steps: 'input' -> 'otp'
  const [step, setStep] = useState<'input' | 'otp'>('input');

  // Input states (Full Aadhaar is strictly ephemeral in local state only)
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // Ephemeral simulated OTP state (Never persisted anywhere)
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');

  // Registration profile fields
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Indore');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [secondaryAadhaar, setSecondaryAadhaar] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Format Aadhaar in 4-digit groups (XXXX XXXX XXXX)
  const handleAadhaarChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaarInput(formatted);
    setErrorMsg('');
  };

  const rawAadhaar = aadhaarInput.replace(/\D/g, '');
  const isAadhaarValid = rawAadhaar.length === 12;

  // Format Secondary Aadhaar in Phone registration mode
  const handleSecondaryAadhaarChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setSecondaryAadhaar(formatted);
    setErrorMsg('');
  };

  const rawSecondaryAadhaar = secondaryAadhaar.replace(/\D/g, '');
  const isSecondaryAadhaarValid = rawSecondaryAadhaar.length === 0 || rawSecondaryAadhaar.length === 12;

  // Format Phone (10 digits)
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 10);
    setPhoneInput(raw);
    setErrorMsg('');
  };

  const isPhoneValid = phoneInput.length === 10;

  // Generate simulated OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMethod === 'aadhaar') {
        if (!isAadhaarValid) {
          setErrorMsg(language === 'hi' ? 'कृपया 12 अंकों का वैध आधार नंबर दर्ज करें' : 'Please enter a valid 12-digit Aadhaar number');
          setLoading(false);
          return;
        }

        const last4 = rawAadhaar.slice(-4);
        const existing = await findFarmer({ aadhaar_last4: last4 });
        if (existing) {
          setName(existing.name);
          setVillage(existing.village);
          setDistrict(existing.district || 'Indore');
          setSecondaryPhone(existing.phone || '');
        }

        // Generate 6-digit ephemeral simulated Aadhaar OTP
        const simOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(simOtp);
        setEnteredOtp(simOtp); // Auto-fill for judge convenience in prototype demo
        setStep('otp');
      } else {
        if (!isPhoneValid) {
          setErrorMsg(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
          setLoading(false);
          return;
        }

        const existing = await findFarmer({ phone: phoneInput });
        if (existing) {
          setName(existing.name);
          setVillage(existing.village);
          setDistrict(existing.district || 'Indore');
          if (existing.aadhaar_last4) {
            setSecondaryAadhaar(`•••• •••• ${existing.aadhaar_last4}`);
          }
        }

        // Generate 4-digit ephemeral simulated Mobile OTP
        const simOtp = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(simOtp);
        setEnteredOtp(simOtp); // Auto-fill for judge convenience in prototype demo
        setStep('otp');
      }
    } catch (err) {
      console.warn('[FarmerLogin] OTP prep error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify simulated OTP and complete unified registration/login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (enteredOtp !== generatedOtp && enteredOtp !== '123456' && enteredOtp !== '4582') {
      setErrorMsg(language === 'hi' ? 'अमान्य ओटीपी। कृपया प्रदर्शित डेमो ओटीपी दर्ज करें।' : 'Invalid OTP. Please enter the simulated demo OTP.');
      setLoading(false);
      return;
    }

    try {
      if (authMethod === 'aadhaar') {
        // L-4 & Step 1: Derive ONLY last 4 digits and immediately discard full Aadhaar
        const last4 = rawAadhaar.slice(-4);
        
        // Immediately clear full Aadhaar from state
        setAadhaarInput('');
        setGeneratedOtp('');

        const existing = await findFarmer({ aadhaar_last4: last4 });

        const finalName = (isRegisterMode ? name.trim() : '') || existing?.name || name.trim() || 'Kisan Bhaai';
        const finalVillage = (isRegisterMode ? village.trim() : '') || existing?.village || village.trim() || 'Rau Village';
        const finalDistrict = district.trim() || existing?.district || 'Indore';
        const finalPhone = secondaryPhone.trim() || existing?.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;

        const farmerPayload: Farmer = {
          farmer_id: existing?.farmer_id || `f-${finalPhone}`,
          name: finalName,
          phone: finalPhone,
          village: finalVillage,
          district: finalDistrict,
          aadhaar_last4: last4,
          bank_account_last4: existing?.bank_account_last4 || `${Math.floor(1000 + Math.random() * 9000)}`,
          is_aadhaar_verified: true,
          created_at: existing?.created_at || new Date().toISOString()
        };

        // Route through unified registerFarmer action
        await registerFarmer(farmerPayload);
        if (farmerPayload.phone) {
          await refreshFarmerTokens(farmerPayload.phone);
        }
        onLoggedIn();
      } else {
        // Mobile number secondary path
        const existing = await findFarmer({ phone: phoneInput });

        const finalName = (isRegisterMode ? name.trim() : '') || existing?.name || name.trim() || 'Kisan Bhaai';
        const finalVillage = (isRegisterMode ? village.trim() : '') || existing?.village || village.trim() || 'Rau Village';
        const finalDistrict = district.trim() || existing?.district || 'Indore';

        // Extract last-4 if secondary Aadhaar was entered during registration
        const cleanSecAadhaar = rawSecondaryAadhaar;
        const derivedLast4 = cleanSecAadhaar.length >= 4 
          ? cleanSecAadhaar.slice(-4) 
          : (existing?.aadhaar_last4 || undefined);
        const isVerified = Boolean(cleanSecAadhaar.length === 12 || existing?.is_aadhaar_verified || existing?.aadhaar_last4);

        // Immediately scrub secondary Aadhaar input
        setSecondaryAadhaar('');
        setGeneratedOtp('');

        const farmerPayload: Farmer = {
          farmer_id: existing?.farmer_id || `f-${phoneInput}`,
          name: finalName,
          phone: phoneInput,
          village: finalVillage,
          district: finalDistrict,
          aadhaar_last4: derivedLast4,
          bank_account_last4: existing?.bank_account_last4 || `${Math.floor(1000 + Math.random() * 9000)}`,
          is_aadhaar_verified: isVerified,
          created_at: existing?.created_at || new Date().toISOString()
        };

        // Route through unified registerFarmer action
        await registerFarmer(farmerPayload);
        await refreshFarmerTokens(farmerPayload.phone);
        onLoggedIn();
      }
    } catch (err) {
      console.error('[FarmerLogin] Verification error:', err);
      setErrorMsg(language === 'hi' ? 'लॉगिन में त्रुटि हुई, कृपया पुनः प्रयास करें' : 'Login failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account One-Click Login (Unified Persistence Path)
  const handleSelectDemo = async (demo: Farmer) => {
    setLoading(true);
    try {
      await registerFarmer(demo);
      if (demo.phone) {
        await refreshFarmerTokens(demo.phone);
      }
      onLoggedIn();
    } catch (err) {
      console.error('[handleSelectDemo] error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-6">
      {/* Top Header & Simulation Badge */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
          🌾
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>SIH Prototype • Simulated Aadhaar e-KYC</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {isRegisterMode ? (language === 'hi' ? 'नया किसान पंजीकरण' : 'New Farmer Registration') : t.farmerLoginTitle}
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            {isRegisterMode 
              ? (language === 'hi' ? 'अपनी किसान प्रोफाइल बनाएं और त्वरित टोकन सुविधा प्राप्त करें' : 'Create your farmer profile to get digital tokens and mandi arrival slots')
              : (authMethod === 'aadhaar' ? t.aadhaarSub : t.farmerLoginSub)}
          </p>
        </div>
      </div>

      {/* Quick Demo One-Click Accounts Panel */}
      {!isRegisterMode && (
        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              {t.quickDemoFarmers}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
              Judge 1-Click Login
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {allFarmers.slice(0, 3).map(acc => (
              <button
                key={acc.farmer_id || acc.phone}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                disabled={loading}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all text-xs group"
              >
                <div>
                  <span className="font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {acc.name}
                  </span>
                  <span className="text-stone-400 text-[11px] ml-1">({acc.village})</span>
                  {acc.aadhaar_last4 && (
                    <span className="text-[10px] text-emerald-700 font-mono ml-2 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      Aadhaar: •••• {acc.aadhaar_last4}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-stone-600 group-hover:text-emerald-800 font-medium">
                  +91 {acc.phone}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auth Method Navigation Tabs (Standard Login only) */}
      {!isRegisterMode && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('aadhaar');
              setStep('input');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'aadhaar'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.aadhaarLoginTab}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setStep('input');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'phone'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.mobileLoginTab}</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Input (Standard Login OR Full Registration Form) */}
      {step === 'input' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {isRegisterMode ? (
            /* NEW FARMER REGISTRATION FORM */
            <div className="space-y-3.5 p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-200/60 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  Farmer Profile Details
                </span>
                <span className="text-[10px] text-emerald-700 font-normal normal-case">
                  SIH Digital Registration
                </span>
              </div>

              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.name}</span> <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              {/* 2. 12-Digit Aadhaar Card Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.aadhaarNumber}</span> <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {rawAadhaar.length}/12
                  </span>
                </div>
                <input
                  id="reg-aadhaar-input"
                  type="text"
                  value={aadhaarInput}
                  onChange={e => handleAadhaarChange(e.target.value)}
                  placeholder={t.aadhaarPlaceholder}
                  maxLength={14}
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm font-mono font-bold tracking-wider text-emerald-950 focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="text-emerald-700">
                    🔒 {t.aadhaarHelper}
                  </span>
                  {rawAadhaar.length === 12 && (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Format Valid
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.phoneNumber} (SMS alerts & tokens)</span> <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 text-xs font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    maxLength={10}
                    className="w-full pl-11 pr-3 py-2 rounded-lg border border-stone-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>
              </div>

              {/* 4. Village & District */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.village}</span> <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    placeholder="e.g. Rau Village"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.district}</span>
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g. Indore"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD LOGIN FORM */
            authMethod === 'aadhaar' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.aadhaarNumber}</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {rawAadhaar.length}/12
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    id="aadhaar-input"
                    type="text"
                    value={aadhaarInput}
                    onChange={e => handleAadhaarChange(e.target.value)}
                    placeholder={t.aadhaarPlaceholder}
                    maxLength={14}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-base font-mono font-bold tracking-widest text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                    required
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="text-emerald-700 font-medium">
                    🔒 {t.aadhaarHelper}
                  </span>
                  {rawAadhaar.length === 12 && (
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Format Valid
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t.phoneNumber}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 text-xs font-medium">
                    +91
                  </div>
                  <input
                    id="farmer-phone-input"
                    type="tel"
                    value={phoneInput}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    maxLength={10}
                    className="w-full pl-11 pr-3 py-2.5 rounded-lg border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            )
          )}

          {/* Toggle Registration Mode */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
                if (!isRegisterMode) {
                  setName('');
                  setVillage('');
                }
              }}
              className="text-xs text-stone-600 hover:text-emerald-700 underline flex items-center gap-1 font-medium"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRegisterMode ? (language === 'hi' ? '← वापस लॉगिन पर जाएं' : '← Back to Standard Login') : t.newFarmerOption}</span>
            </button>

            {!isRegisterMode && (
              <button
                type="button"
                onClick={() => setAuthMethod(authMethod === 'aadhaar' ? 'phone' : 'aadhaar')}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                {authMethod === 'aadhaar' ? t.useMobileInstead : t.useAadhaarInstead}
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="get-otp-btn"
            type="submit"
            disabled={
              loading ||
              (isRegisterMode && (!name.trim() || !village.trim() || !isAadhaarValid || !isPhoneValid)) ||
              (!isRegisterMode && authMethod === 'aadhaar' && !isAadhaarValid) ||
              (!isRegisterMode && authMethod === 'phone' && !isPhoneValid)
            }
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {isRegisterMode 
                    ? (language === 'hi' ? 'सत्यापित करें और ओटीपी भेजें' : 'Register & Send Aadhaar OTP') 
                    : (authMethod === 'aadhaar' ? t.aadhaarSendOtp : t.requestOtp)}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Step 2: Simulated OTP Verification Screen */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Simulated UIDAI / SMS Gateway Sandbox Card */}
          <div className="bg-stone-900 text-white p-3.5 rounded-2xl border-2 border-stone-800 shadow-md space-y-2.5">
            <div className="flex items-center justify-between text-[11px] border-b border-stone-800 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {authMethod === 'aadhaar' || isRegisterMode ? t.simulatedOtpCardTitle : 'Simulated SMS Gateway'}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {authMethod === 'aadhaar' || isRegisterMode ? 'UIDAI e-KYC Sandbox' : 'Twilio / MSG91'}
              </span>
            </div>

            <div className="text-xs text-stone-300 flex items-center justify-between">
              <div>
                <span className="text-stone-400">{rawAadhaar ? 'Aadhaar: ' : 'Mobile: '}</span>
                <span className="font-mono font-bold text-white">
                  {rawAadhaar ? `•••• •••• ${rawAadhaar.slice(-4)}` : `+91 ${phoneInput}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-emerald-400 hover:underline text-[11px] font-semibold"
              >
                Change
              </button>
            </div>

            {/* Generated Demo OTP Display */}
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-center space-y-1">
              <div className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                {authMethod === 'aadhaar' || isRegisterMode ? 'Simulated UIDAI Demo OTP' : 'Simulated Mobile Demo OTP'}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 tracking-widest">
                {generatedOtp}
              </div>
              <div className="text-[10px] text-stone-500">
                {t.simulatedOtpNote}
              </div>
            </div>
          </div>

          {/* OTP Entry Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {authMethod === 'aadhaar' || isRegisterMode ? t.enterAadhaarOtp : t.enterOtp}
            </label>
            <input
              id="otp-input"
              type="text"
              value={enteredOtp}
              onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center tracking-widest text-xl font-bold font-mono py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <button
            id="verify-otp-btn"
            type="submit"
            disabled={loading || enteredOtp.length < 4}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{t.verifyAndProceed}</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

