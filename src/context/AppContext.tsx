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
  allTokens: Token[];
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

import { supabaseClient, syncTokenToSupabase } from '../utils/supabaseClient';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<AppRole>('farmer');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [centers, setCenters] = useState<Center[]>(FALLBACK_CENTERS);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('c-rau');
  
  // Default Ramesh with localStorage persistence
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>(() => {
    try {
      const saved = localStorage.getItem('mandi_current_farmer');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
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
    };
  });

  // Persistent Tokens State across sessions & devices
  const [allTokens, setAllTokens] = useState<Token[]>(() => {
    try {
      const saved = localStorage.getItem('mandi_all_tokens');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return FALLBACK_TOKENS;
  });

  const [centerQueue, setCenterQueue] = useState<Token[]>(
    FALLBACK_TOKENS.filter(t => t.center_id === 'c-rau')
  );

  const [activeToken, setActiveToken] = useState<Token | null>(
    allTokens.find(t => t.token_id === 't-104') || allTokens[0]
  );
  const [farmerTokens, setFarmerTokens] = useState<Token[]>(
    allTokens.filter(t => t.farmer_phone === '9876543210')
  );
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>(() => {
    try {
      const saved = localStorage.getItem('mandi_sms_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return FALLBACK_SMS_LOGS;
  });
  const [newSmsAlert, setNewSmsAlert] = useState<SMSLog | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const t = translations[language];

  // Auto-save state changes to LocalStorage & Sync Supabase DB on mount
  useEffect(() => {
    try {
      localStorage.setItem('mandi_all_tokens', JSON.stringify(allTokens));
    } catch (e) {}
  }, [allTokens]);

  useEffect(() => {
    try {
      if (currentFarmer) localStorage.setItem('mandi_current_farmer', JSON.stringify(currentFarmer));
      else localStorage.removeItem('mandi_current_farmer');
    } catch (e) {}
  }, [currentFarmer]);

  useEffect(() => {
    try {
      localStorage.setItem('mandi_sms_logs', JSON.stringify(smsLogs));
    } catch (e) {}
  }, [smsLogs]);

  // Keep derived states in sync automatically
  useEffect(() => {
    if (selectedCenterId) {
      setCenterQueue(allTokens.filter(t => t.center_id === selectedCenterId));
    }
  }, [allTokens, selectedCenterId]);

  useEffect(() => {
    if (currentFarmer?.phone) {
      const tokens = allTokens.filter(t => t.farmer_phone === currentFarmer.phone);
      setFarmerTokens(tokens);
      if (activeToken) {
        const match = tokens.find(t => t.token_id === activeToken.token_id);
        if (match) setActiveToken(match);
      } else if (tokens.length > 0) {
        setActiveToken(tokens[0]);
      }
    }
  }, [allTokens, currentFarmer?.phone]);

  // Instant Cross-Tab Sync via Storage Event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mandi_all_tokens' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllTokens(parsed);
            setLastUpdated(new Date());
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Supabase Initial Sync & High-Frequency Cross-Device Sync (3s Polling + Realtime WebSockets)
  useEffect(() => {
    if (!supabaseClient) return;

    const parseRemote = (d: any): Token => ({
      ...d,
      quality_check_result: typeof d.quality_check_result === 'string' ? JSON.parse(d.quality_check_result) : d.quality_check_result,
      status_history: typeof d.status_history === 'string' ? JSON.parse(d.status_history) : (d.status_history || [])
    });

    const loadSupabaseTokens = async () => {
      try {
        const { data, error } = await supabaseClient.from('tokens').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          if (data.length === 0) {
            // Auto-seed initial tokens to Supabase DB
            allTokens.forEach(t => syncTokenToSupabase(t));
          } else {
            const remoteTokens: Token[] = data.map(parseRemote);
            // Supabase Cloud Database is 100% authoritative for all multi-device sessions
            setAllTokens(remoteTokens);
            setLastUpdated(new Date());
          }
        } else if (error) {
          console.error('[Supabase Fetch Error]', error.message, error.details, error.hint);
        }
      } catch (err) {
        console.error('[Supabase Fetch Exception]', err);
      }
    };

    loadSupabaseTokens();

    // 1-Second High Frequency Sync Loop for Cross-Device Phone <-> Laptop
    const interval = setInterval(loadSupabaseTokens, 1500);

    // Supabase Realtime WebSocket Listener for Immediate Push
    const channel = supabaseClient
      .channel('realtime:tokens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, payload => {
        const newRecord = payload.new as any;
        if (newRecord && newRecord.token_id) {
          const formatted = parseRemote(newRecord);
          setAllTokens(prev => {
            const exists = prev.some(t => t.token_id === formatted.token_id);
            if (exists) {
              return prev.map(t => t.token_id === formatted.token_id ? formatted : t);
            } else {
              return [formatted, ...prev];
            }
          });
          setLastUpdated(new Date());
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabaseClient.removeChannel(channel);
    };
  }, []);

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
    
    // Async Live Database Sync
    syncTokenToSupabase(newToken);

    const createSms: SMSLog = {
      id: `sms-${Date.now()}`,
      token_id: newToken.token_id,
      phone: newToken.farmer_phone,
      farmer_name: newToken.farmer_name,
      message: `[e-MANDI ALERT] Digital Token ${newToken.token_number} generated for ${newToken.farmer_name}. Lot: ${newToken.quantity} Qtl ${newToken.crop}. Time slot: ${newToken.preferred_slot}.`,
      message_hi: `[ई-मंडी सूचना] किसान ${newToken.farmer_name} के लिए डिजिटल टोकन ${newToken.token_number} जारी किया गया। उपज: ${newToken.quantity} क्विंटल ${newToken.crop}। समय: ${newToken.preferred_slot}।`,
      trigger_event: 'TOKEN_CONFIRMED',
      sent_at: nowIso,
      status: 'Delivered'
    };
    setSmsLogs(prev => [createSms, ...prev]);
    setNewSmsAlert(createSms);

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

    const isRejected = nextStatus === 'Rejected' || qcResult?.grade === 'Rejected';
    const finalStatus: Token['status'] = isRejected ? 'Rejected' : nextStatus;
    const rate = isRejected 
      ? 0 
      : (qcResult?.offered_rate !== undefined ? qcResult.offered_rate : targetToken.msp_rate);
    const newPaymentAmount = isRejected ? 0 : targetToken.quantity * rate;

    const updatedToken: Token = {
      ...targetToken,
      status: finalStatus,
      msp_rate: rate,
      payment_amount: newPaymentAmount,
      quality_check_result: qcResult || targetToken.quality_check_result,
      status_history: [
        ...(targetToken.status_history || []),
        { status: finalStatus, timestamp: nowIso, note: note || `Status updated to ${finalStatus}` }
      ],
      updated_at: nowIso
    };

    setAllTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
    setCenterQueue(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
    setFarmerTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
    if (activeToken?.token_id === tokenId) setActiveToken(updatedToken);

    // Async Live Database Sync
    syncTokenToSupabase(updatedToken);

    let eventName: SMSLog['trigger_event'] = 'QUEUE_ADVANCED';
    let msgEn = `[e-MANDI ALERT] Token ${updatedToken.token_number} status updated to ${finalStatus}.`;
    let msgHi = `[ई-मंडी सूचना] टोकन ${updatedToken.token_number} का स्टेटस ${finalStatus} हो गया है।`;

    if (isRejected) {
      eventName = 'QUALITY_CHECK_DONE';
      msgEn = `[e-MANDI REJECTION NOTICE] Token ${updatedToken.token_number} (${updatedToken.farmer_name}): Crop lot REJECTED during Quality Inspection. Moisture: ${qcResult?.moisture}%. Lot Disqualified for procurement.`;
      msgHi = `[ई-मंडी अस्वीकृति] टोकन ${updatedToken.token_number} (${updatedToken.farmer_name}): गुणवत्ता जाँच में उपज अस्वीकृत पाई गई। उपार्जन रद्द।`;
    } else if (finalStatus === 'In Queue') {
      eventName = 'QUEUE_ADVANCED';
      msgEn = `[e-MANDI GATE ENTRY] Token ${updatedToken.token_number} (${updatedToken.farmer_name}): Gate entry verified at ${updatedToken.center_name}. Position #${updatedToken.queue_position}.`;
      msgHi = `[ई-मंडी प्रवेश] टोकन ${updatedToken.token_number} (${updatedToken.farmer_name}): गेट पर सत्यापन सफल। कतार स्थान: #${updatedToken.queue_position}।`;
    } else if (finalStatus === 'Quality Check') {
      eventName = 'QUALITY_CHECK_DONE';
      msgEn = `[e-MANDI LAB TEST] Token ${updatedToken.token_number}: Quality inspection passed (${qcResult?.grade || 'Grade A'}). Offered Rate: ₹${updatedToken.msp_rate}/Qtl.`;
      msgHi = `[ई-मंडी लैब जाँच] टोकन ${updatedToken.token_number}: गुणवत्ता परीक्षण पास (${qcResult?.grade || 'Grade A'})। स्वीकृत दर: ₹${updatedToken.msp_rate}/क्विंटल।`;
    } else if (finalStatus === 'Procured') {
      eventName = 'PROCURED';
      msgEn = `[e-MANDI WEIGHBRIDGE] Token ${updatedToken.token_number}: ${updatedToken.quantity} Qtl ${updatedToken.crop} weighed & procured at ₹${updatedToken.msp_rate}/Qtl. Gross amount: ₹${updatedToken.payment_amount.toLocaleString('en-IN')}.`;
      msgHi = `[ई-मंडी तौल] टोकन ${updatedToken.token_number}: ${updatedToken.quantity} क्विंटल ${updatedToken.crop} का उपार्जन दर्ज हुआ। कुल राशि: ₹${updatedToken.payment_amount.toLocaleString('en-IN')}।`;
    }

    const statusSms: SMSLog = {
      id: `sms-${Date.now()}`,
      token_id: updatedToken.token_id,
      phone: updatedToken.farmer_phone,
      farmer_name: updatedToken.farmer_name,
      message: msgEn,
      message_hi: msgHi,
      trigger_event: eventName,
      sent_at: nowIso,
      status: 'Delivered'
    };
    setSmsLogs(prev => [statusSms, ...prev]);
    setNewSmsAlert(statusSms);

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

      // Async Live Database Sync
      syncTokenToSupabase(updatedToken);

      const paymentSms: SMSLog = {
        id: `sms-${Date.now()}`,
        token_id: updatedToken.token_id,
        phone: updatedToken.farmer_phone,
        farmer_name: updatedToken.farmer_name,
        message: `[GOV-PFMS / DBT] Payment of ₹${updatedToken.payment_amount.toLocaleString('en-IN')} successfully SENT to bank account of ${updatedToken.farmer_name} for Token ${updatedToken.token_number}. Ref: ${updatedToken.payment_reference}.`,
        message_hi: `[डीबीटी भुगतान सफल] टोकन ${updatedToken.token_number} के एवज में ₹${updatedToken.payment_amount.toLocaleString('en-IN')} की राशि किसान ${updatedToken.farmer_name} के बैंक खाते में भेज दी गई है। संदर्भ: ${updatedToken.payment_reference}।`,
        trigger_event: 'PAYMENT_SENT',
        sent_at: nowIso,
        status: 'Delivered'
      };
      setSmsLogs(prev => [paymentSms, ...prev]);
      setNewSmsAlert(paymentSms);
    }
  };

  // Reset Demo Action
  const resetDemoData = async () => {
    try {
      localStorage.removeItem('mandi_all_tokens');
      localStorage.removeItem('mandi_sms_logs');
      localStorage.removeItem('mandi_current_farmer');
      if (supabaseClient) {
        await supabaseClient.from('tokens').delete().neq('token_id', '');
        FALLBACK_TOKENS.forEach(t => syncTokenToSupabase(t));
      }
    } catch (err) {
      // ignore
    }
    setAllTokens(FALLBACK_TOKENS);
    setSmsLogs(FALLBACK_SMS_LOGS);
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
        allTokens,
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
