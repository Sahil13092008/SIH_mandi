import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppLanguage, AppRole, Center, Farmer, SMSLog, Token } from '../types';
import { translations } from '../utils/translations';

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
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('c-rau');
  const [centerQueue, setCenterQueue] = useState<Token[]>([]);
  
  // Default to Ramesh Kumar for immediate seamless demo testing
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>({
    farmer_id: 'f-ramesh',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    village: 'Rau Village',
    district: 'Indore',
    aadhaar_last4: '7821',
    bank_account_last4: '4509',
    created_at: new Date().toISOString()
  });

  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [farmerTokens, setFarmerTokens] = useState<Token[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
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
        setCenters(data);
      }
    } catch (err) {
      console.error('Error fetching centers:', err);
    }
  }, []);

  // Fetch Center Queue
  const refreshCenterQueue = useCallback(async () => {
    if (!selectedCenterId) return;
    try {
      const res = await fetch(`/api/centers/${selectedCenterId}/queue`);
      if (res.ok) {
        const data = await res.json();
        setCenterQueue(data.queue || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  }, [selectedCenterId]);

  // Fetch Farmer Tokens
  const refreshFarmerTokens = useCallback(async (phone?: string) => {
    const targetPhone = phone || currentFarmer?.phone;
    if (!targetPhone) return;
    try {
      const res = await fetch(`/api/farmers/${targetPhone}/tokens`);
      if (res.ok) {
        const data: Token[] = await res.json();
        setFarmerTokens(data);
        if (data.length > 0) {
          // If active token not set or needs update
          const found = activeToken ? data.find(t => t.token_id === activeToken.token_id) : data[0];
          setActiveToken(found || data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching farmer tokens:', err);
    }
  }, [currentFarmer?.phone, activeToken?.token_id]);

  // Fetch SMS Logs
  const refreshSmsLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sms-log');
      if (res.ok) {
        const data = await res.json();
        setSmsLogs(data);
      }
    } catch (err) {
      console.error('Error fetching SMS logs:', err);
    }
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

      eventSource.addEventListener('token_created', (e) => {
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
        setIsConnected(false);
      };
    } catch (err) {
      setIsConnected(false);
    }

    // Polling interval fallback (every 5 seconds) to ensure fresh status
    const interval = setInterval(() => {
      refreshCenterQueue();
      if (currentFarmer?.phone) refreshFarmerTokens(currentFarmer.phone);
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [selectedCenterId, currentFarmer?.phone, activeToken?.token_id, refreshCenterQueue, refreshFarmerTokens, refreshSmsLogs, fetchCenters]);

  // Token Creation Action
  const createToken = async (data: any): Promise<Token> => {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate token');
    }
    const token = await res.json();
    setActiveToken(token);
    await refreshFarmerTokens(token.farmer_phone);
    await refreshCenterQueue();
    await refreshSmsLogs();
    return token;
  };

  // Status Advance Action
  const advanceTokenStatus = async (tokenId: string, nextStatus: Token['status'], qcResult?: any, note?: string): Promise<Token> => {
    const res = await fetch(`/api/tokens/${tokenId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, quality_check_result: qcResult, note })
    });
    if (!res.ok) {
      throw new Error('Failed to update token status');
    }
    const token = await res.json();
    if (activeToken?.token_id === tokenId) {
      setActiveToken(token);
    }
    await refreshCenterQueue();
    await refreshFarmerTokens();
    await refreshSmsLogs();
    return token;
  };

  // Simulate Payment Webhook
  const simulatePaymentWebhook = async (tokenId: string) => {
    const res = await fetch(`/api/tokens/${tokenId}/payment-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference_id: `UPI-DBT-${Math.floor(1000000000 + Math.random() * 9000000000)}` })
    });
    if (!res.ok) {
      throw new Error('Payment webhook simulation failed');
    }
    const data = await res.json();
    if (activeToken?.token_id === tokenId) {
      setActiveToken(data.token);
    }
    await refreshCenterQueue();
    await refreshFarmerTokens();
    await refreshSmsLogs();
  };

  // Reset Demo Action
  const resetDemoData = async () => {
    await fetch('/api/seed/reset', { method: 'POST' });
    await fetchCenters();
    await refreshCenterQueue();
    await refreshSmsLogs();
    // Default Ramesh
    setCurrentFarmer({
      farmer_id: 'f-ramesh',
      name: 'Ramesh Kumar',
      phone: '9876543210',
      village: 'Rau Village',
      district: 'Indore',
      aadhaar_last4: '7821',
      bank_account_last4: '4509',
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
    const res = await fetch(`/api/farmers/${currentFarmer.farmer_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      throw new Error('Failed to update farmer profile');
    }
    const updated: Farmer = await res.json();
    setCurrentFarmer(updated);
    return updated;
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
