import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppLanguage, AppRole, Center, Farmer, SMSLog, Token } from '../types';
import { translations } from '../utils/translations';
import { 
  FALLBACK_CENTERS, 
  FALLBACK_TOKENS, 
  FALLBACK_SMS_LOGS 
} from '../utils/clientFallback';

interface AppContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: typeof translations['en'];
  
  // Centers & Tokens
  centers: Center[];
  selectedCenterId: string;
  setSelectedCenterId: (id: string) => void;
  selectedCenter?: Center;
  centerQueue: Token[];
  refreshCenterQueue: () => Promise<void>;
  
  // Farmer session
  currentFarmer: Farmer | null;
  setCurrentFarmer: (farmer: Farmer | null) => void;
  updateFarmerProfile: (updates: Partial<Farmer>) => Promise<Farmer>;
  activeToken: Token | null;
  setActiveToken: (token: Token | null) => void;
  farmerTokens: Token[];
  refreshFarmerTokens: (phone?: string) => Promise<void>;
  
  // SMS Logs
  smsLogs: SMSLog[];
  refreshSmsLogs: () => Promise<void>;
  newSmsAlert: SMSLog | null;
  setNewSmsAlert: (sms: SMSLog | null) => void;
  
  // Actions
  createToken: (data: any) => Promise<Token>;
  advanceTokenStatus: (tokenId: string, nextStatus: Token['status'], qcResult?: any, note?: string) => Promise<Token>;
  simulatePaymentWebhook: (tokenId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  
  // Voice readout
  speakText: (textEn: string, textHi: string) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (val: boolean) => void;
  
  // Live Sync
  isConnected: boolean;
  lastUpdated: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<AppRole>('farmer');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [centers, setCenters] = useState<Center[]>(FALLBACK_CENTERS);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('c-rau');
  const [centerQueue, setCenterQueue] = useState<Token[]>(
    FALLBACK_TOKENS.filter(t => t.center_id === 'c-rau')
  );
  
  // Default Ramesh
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>({
    farmer_id: 'f-ramesh',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    village: 'Rau Village',
    district: 'Indore',
    aadhaar_last4: '7821',
    aadhaar_number: '7821 4509 1234',
    bank_account_last4: '4509',
    is_aadhaar_verified: true,
    created_at: new Date().toISOString()
  });

  const [allTokens, setAllTokens] = useState<Token[]>(FALLBACK_TOKENS);
  const [activeToken, setActiveToken] = useState<Token | null>(
    FALLBACK_TOKENS.find(t => t.token_id === 't-104') || FALLBACK_TOKENS[0]
  );
  const [farmerTokens, setFarmerTokens] = useState<Token[]>(
    FALLBACK_TOKENS.filter(t => t.farmer_phone === '9876543210')
  );
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>(FALLBACK_SMS_LOGS);
  const [newSmsAlert, setNewSmsAlert] = useState<SMSLog | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const t = translations[language];

  // Fetch Centers
  const fetchCenters = useCallback(async () => {
    try {
      const res = await fetch('/api/centers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCenters(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching centers from API, using client fallback:', err);
    }
    setCenters(FALLBACK_CENTERS);
  }, []);

  // Fetch Center Queue
  const refreshCenterQueue = useCallback(async () => {
    if (!selectedCenterId) return;
    try {
      const res = await fetch(`/api/centers/${selectedCenterId}/queue`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.queue)) {
          setCenterQueue(data.queue);
          setLastUpdated(new Date());
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching queue from API, using client fallback:', err);
    }
    setCenterQueue(allTokens.filter(t => t.center_id === selectedCenterId));
    setLastUpdated(new Date());
  }, [selectedCenterId, allTokens]);

  // Fetch Farmer Tokens
  const refreshFarmerTokens = useCallback(async (phone?: string) => {
    const targetPhone = phone || currentFarmer?.phone;
    if (!targetPhone) return;
    try {
      const res = await fetch(`/api/farmers/${targetPhone}/tokens`);
      if (res.ok) {
        const data: Token[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFarmerTokens(data);
          const found = activeToken ? data.find(t => t.token_id === activeToken.token_id) : data[0];
          setActiveToken(found || data[0]);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching farmer tokens from API, using client fallback:', err);
    }
    const filtered = allTokens.filter(t => t.farmer_phone === targetPhone);
    setFarmerTokens(filtered);
    if (filtered.length > 0 && !activeToken) {
      setActiveToken(filtered[0]);
    }
  }, [currentFarmer?.phone, activeToken, allTokens]);

  // Fetch SMS Logs
  const refreshSmsLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sms-log');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSmsLogs(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching SMS logs from API, using client fallback:', err);
    }
    setSmsLogs(FALLBACK_SMS_LOGS);
  }, []);

  // Initial Data Load
  useEffect(() => {
    fetchCenters();
    refreshSmsLogs();
  }, [fetchCenters, refreshSmsLogs]);

  useEffect(() => {
    refreshCenterQueue();
  }, [selectedCenterId, refreshCenterQueue]);

  useEffect(() => {
    if (currentFarmer?.phone) {
      refreshFarmerTokens(currentFarmer.phone);
    }
  }, [currentFarmer, refreshFarmerTokens]);

  // Realtime SSE Listener + Fallback Polling
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/events');
      
      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('connected', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('token_created', () => {
        refreshCenterQueue();
        if (currentFarmer?.phone) refreshFarmerTokens(currentFarmer.phone);
        refreshSmsLogs();
      });

      eventSource.addEventListener('token_updated', (e) => {
        const updatedToken: Token = JSON.parse(e.data);
        refreshCenterQueue();
        if (currentFarmer?.phone) refreshFarmerTokens(currentFarmer.phone);
        if (activeToken && activeToken.token_id === updatedToken.token_id) {
          setActiveToken(updatedToken);
        }
        refreshSmsLogs();
      });

      eventSource.addEventListener('queue_updated', () => {
        refreshCenterQueue();
        if (currentFarmer?.phone) refreshFarmerTokens(currentFarmer.phone);
      });

      eventSource.addEventListener('sms_sent', (e) => {
        const newLog: SMSLog = JSON.parse(e.data);
        setSmsLogs(prev => [newLog, ...prev]);
        setNewSmsAlert(newLog);
      });

      eventSource.addEventListener('seed_reset', () => {
        fetchCenters();
        refreshCenterQueue();
        if (currentFarmer?.phone) refreshFarmerTokens(currentFarmer.phone);
        refreshSmsLogs();
      });

      eventSource.onerror = () => {
        // Mark as connected/ready in static hosting mode
        setIsConnected(true);
      };
    } catch (err) {
      setIsConnected(true);
    }

    const interval = setInterval(() => {
      refreshCenterQueue();
      if (currentFarmer?.phone) refreshFarmerTokens(currentFarmer.phone);
    }, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [selectedCenterId, currentFarmer?.phone, activeToken?.token_id, refreshCenterQueue, refreshFarmerTokens, refreshSmsLogs, fetchCenters]);

  // Token Creation Action
  const createToken = async (data: any): Promise<Token> => {
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const token = await res.json();
        setActiveToken(token);
        await refreshFarmerTokens(token.farmer_phone);
        await refreshCenterQueue();
        await refreshSmsLogs();
        return token;
      }
    } catch (err) {
      console.warn('API create token failed, using client fallback:', err);
    }

    const nowIso = new Date().toISOString();
    const newToken: Token = {
      token_id: `t-${Date.now()}`,
      farmer_id: data.farmer_id || currentFarmer?.farmer_id || 'f-ramesh',
      farmer_name: data.farmer_name || currentFarmer?.name || 'Ramesh Kumar',
      farmer_phone: data.farmer_phone || currentFarmer?.phone || '9876543210',
      farmer_village: data.farmer_village || currentFarmer?.village || 'Rau Village',
      center_id: data.center_id,
      center_name: centers.find(c => c.center_id === data.center_id)?.name || 'Procurement Center',
      crop: data.crop,
      quantity: Number(data.quantity),
      msp_rate: Number(data.msp_rate || 2275),
      preferred_slot: data.preferred_slot || '07:00 AM - 09:00 AM',
      token_number: `A-${Math.floor(107 + Math.random() * 90)}`,
      queue_position: centerQueue.length + 1,
      estimated_time: '~20 mins',
      estimated_minutes: 20,
      status: 'Registered',
      payment_amount: Number(data.quantity) * Number(data.msp_rate || 2275),
      status_history: [
        { status: 'Registered', timestamp: nowIso, note: 'Digital token generated via Mandi Queue' }
      ],
      created_at: nowIso,
      updated_at: nowIso
    };

    setAllTokens(prev => [newToken, ...prev]);
    setActiveToken(newToken);
    setCenterQueue(prev => [newToken, ...prev]);
    setFarmerTokens(prev => [newToken, ...prev]);
    return newToken;
  };

  // Status Advance Action
  const advanceTokenStatus = async (tokenId: string, nextStatus: Token['status'], qcResult?: any, note?: string): Promise<Token> => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, quality_check_result: qcResult, note })
      });
      if (res.ok) {
        const token = await res.json();
        if (activeToken?.token_id === tokenId) {
          setActiveToken(token);
        }
        await refreshCenterQueue();
        await refreshFarmerTokens();
        await refreshSmsLogs();
        return token;
      }
    } catch (err) {
      console.warn('API advance status failed, using client fallback:', err);
    }

    const nowIso = new Date().toISOString();
    let targetToken = allTokens.find(t => t.token_id === tokenId) || centerQueue.find(t => t.token_id === tokenId) || activeToken;
    if (!targetToken) {
      targetToken = farmerTokens.find(t => t.token_id === tokenId) || FALLBACK_TOKENS[0];
    }

    const updatedToken: Token = {
      ...targetToken,
      status: nextStatus,
      quality_check_result: qcResult || targetToken.quality_check_result,
      status_history: [
        ...(targetToken.status_history || []),
        { status: nextStatus, timestamp: nowIso, note: note || `Status updated to ${nextStatus}` }
      ],
      updated_at: nowIso
    };

    setAllTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
    setCenterQueue(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
    setFarmerTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
    if (activeToken?.token_id === tokenId) setActiveToken(updatedToken);
    return updatedToken;
  };

  // Simulate Payment Webhook
  const simulatePaymentWebhook = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/payment-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_id: `UPI-DBT-${Math.floor(1000000000 + Math.random() * 9000000000)}` })
      });
      if (res.ok) {
        const data = await res.json();
        if (activeToken?.token_id === tokenId) {
          setActiveToken(data.token);
        }
        await refreshCenterQueue();
        await refreshFarmerTokens();
        await refreshSmsLogs();
        return;
      }
    } catch (err) {
      console.warn('API payment webhook failed, using client fallback:', err);
    }

    const nowIso = new Date().toISOString();
    let targetToken = allTokens.find(t => t.token_id === tokenId) || centerQueue.find(t => t.token_id === tokenId) || activeToken;
    if (targetToken) {
      const updatedToken: Token = {
        ...targetToken,
        status: 'Payment Sent',
        payment_confirmed_at: nowIso,
        payment_reference: `UPI-DBT-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        payment_method: 'DBT Direct Bank Transfer / UPI',
        updated_at: nowIso
      };
      setAllTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
      setCenterQueue(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
      setFarmerTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
      if (activeToken?.token_id === tokenId) setActiveToken(updatedToken);
    }
  };

  // Reset Demo Action
  const resetDemoData = async () => {
    try {
      await fetch('/api/seed/reset', { method: 'POST' });
    } catch (err) {
      // ignore
    }
    setAllTokens(FALLBACK_TOKENS);
    await fetchCenters();
    await refreshCenterQueue();
    await refreshSmsLogs();
    setCurrentFarmer({
      farmer_id: 'f-ramesh',
      name: 'Ramesh Kumar',
      phone: '9876543210',
      village: 'Rau Village',
      district: 'Indore',
      aadhaar_last4: '7821',
      aadhaar_number: '7821 4509 1234',
      bank_account_last4: '4509',
      is_aadhaar_verified: true,
      created_at: new Date().toISOString()
    });
    await refreshFarmerTokens('9876543210');
  };

  // Text-To-Speech helper
  const speakText = (textEn: string, textHi: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak = language === 'hi' ? textHi : textEn;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Update Farmer Profile Action
  const updateFarmerProfile = async (updates: Partial<Farmer>): Promise<Farmer> => {
    if (!currentFarmer) throw new Error('No active farmer');
    try {
      const res = await fetch(`/api/farmers/${currentFarmer.farmer_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated: Farmer = await res.json();
        setCurrentFarmer(updated);
        return updated;
      }
    } catch (err) {
      console.warn('API update farmer profile failed, using client fallback:', err);
    }

    const cleanAadhaar = updates.aadhaar_number ? updates.aadhaar_number.replace(/\D/g, '') : '';
    const updatedFarmer: Farmer = {
      ...currentFarmer,
      ...updates,
      aadhaar_last4: cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : currentFarmer.aadhaar_last4,
      is_aadhaar_verified: cleanAadhaar.length === 12
    };
    setCurrentFarmer(updatedFarmer);
    return updatedFarmer;
  };

  const selectedCenter = centers.find(c => c.center_id === selectedCenterId) || centers[0];

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        t,
        centers,
        selectedCenterId,
        setSelectedCenterId,
        selectedCenter,
        centerQueue,
        refreshCenterQueue,
        currentFarmer,
        setCurrentFarmer,
        updateFarmerProfile,
        activeToken,
        setActiveToken,
        farmerTokens,
        refreshFarmerTokens,
        smsLogs,
        refreshSmsLogs,
        newSmsAlert,
        setNewSmsAlert,
        createToken,
        advanceTokenStatus,
        simulatePaymentWebhook,
        resetDemoData,
        speakText,
        voiceEnabled,
        setVoiceEnabled,
        isConnected,
        lastUpdated
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
