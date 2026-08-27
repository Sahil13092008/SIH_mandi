import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppLanguage, AppRole, Center, Farmer, QualityCheckResult, SMSLog, Token } from '../types';
import { translations, MSP_DATA } from '../utils/translations';
import { 
  FALLBACK_CENTERS, 
  FALLBACK_TOKENS, 
  FALLBACK_SMS_LOGS 
} from '../utils/clientFallback';
import { supabaseClient, syncTokenToSupabase } from '../utils/supabaseClient';
import { CreateTokenSchema, AdvanceStatusSchema } from '../utils/validation';

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
  createToken: (data: Partial<Token>) => Promise<Token>;
  advanceTokenStatus: (tokenId: string, nextStatus: Token['status'], qcResult?: QualityCheckResult, note?: string) => Promise<Token>;
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

// Helper to check if local Express dev server is running (H-1 / M-4)
const isLocalDevServer = (): boolean => {
  return typeof window !== 'undefined' && import.meta.env.DEV && window.location.port === '3000';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<AppRole>('farmer');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [centers, setCenters] = useState<Center[]>(FALLBACK_CENTERS);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('c-rau');
  
  // Ref for optimistic sync tracking to avoid 1.5s poll flicker race condition (H-3)
  const pendingSyncTokens = useRef<Set<string>>(new Set());

  // Default Ramesh with localStorage persistence (L-4: no full Aadhaar stored)
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
      bank_account_last4: '4509',
      is_aadhaar_verified: true,
      created_at: new Date().toISOString()
    };
  });

  // Persistent Tokens State across sessions & devices (M-7: capped history)
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
  
  // L-1: isConnected starts false and reflects real Supabase connectivity
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const t = translations[language];

  // Auto-save state changes to LocalStorage (M-7: Cap to last 100 tokens to avoid quota failure)
  useEffect(() => {
    try {
      const capped = allTokens.slice(0, 100);
      localStorage.setItem('mandi_all_tokens', JSON.stringify(capped));
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
      localStorage.setItem('mandi_sms_logs', JSON.stringify(smsLogs.slice(0, 50)));
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
    if (!supabaseClient) {
      setIsConnected(false);
      return;
    }

    const parseRemote = (d: Record<string, any>): Token => ({
      token_id: d.token_id,
      farmer_id: d.farmer_id,
      farmer_name: d.farmer_name,
      farmer_phone: d.farmer_phone,
      farmer_village: d.farmer_village,
      center_id: d.center_id,
      center_name: d.center_name,
      crop: d.crop,
      quantity: Number(d.quantity),
      msp_rate: Number(d.msp_rate),
      preferred_slot: d.preferred_slot,
      token_number: d.token_number,
      queue_position: Number(d.queue_position || 0),
      estimated_time: d.estimated_time || '~15 mins',
      estimated_minutes: Number(d.estimated_minutes || 15),
      status: d.status,
      quality_check_result: typeof d.quality_check_result === 'string' ? JSON.parse(d.quality_check_result) : d.quality_check_result,
      payment_amount: Number(d.payment_amount || 0),
      payment_method: d.payment_method,
      payment_reference: d.payment_reference,
      payment_confirmed_at: d.payment_confirmed_at,
      status_history: typeof d.status_history === 'string' ? JSON.parse(d.status_history) : (d.status_history || []),
      created_at: d.created_at,
      updated_at: d.updated_at
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
            
            // H-3: Avoid clobbering pending local optimistic mutations
            setAllTokens(prev => {
              const pendingIds = pendingSyncTokens.current;
              if (pendingIds.size === 0) {
                return remoteTokens;
              }
              // Merge preserving pending local tokens
              const remoteMap = new Map(remoteTokens.map(t => [t.token_id, t]));
              return prev.map(localT => {
                if (pendingIds.has(localT.token_id)) {
                  return localT; // keep optimistic state until sync confirmed
                }
                return remoteMap.get(localT.token_id) || localT;
              });
            });
            setLastUpdated(new Date());
            setIsConnected(true);
          }
        } else if (error) {
          console.error('[Supabase Fetch Error]', error.message, error.details, error.hint);
        }
      } catch (err) {
        console.error('[Supabase Fetch Exception]', err);
      }
    };

    loadSupabaseTokens();

    // Supabase Realtime WebSocket Listener for Immediate Push (L-1)
    const channel = supabaseClient
      .channel('realtime:tokens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, payload => {
        const newRecord = payload.new as Record<string, any>;
        if (newRecord && newRecord.token_id) {
          const formatted = parseRemote(newRecord);
          // If this record was pending, remove from pendingSync set as remote is now confirmed
          pendingSyncTokens.current.delete(formatted.token_id);

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
        }
      });

    // 2.5s Polling loop for guaranteed state sync across all 3+ active devices
    const pollInterval = setInterval(loadSupabaseTokens, 2500);

    return () => {
      clearInterval(pollInterval);
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Fetch Centers
  const fetchCenters = useCallback(async () => {
    if (isLocalDevServer()) {
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
        // use fallback
      }
    }
    setCenters(FALLBACK_CENTERS);
  }, []);

  // Fetch Center Queue
  const refreshCenterQueue = useCallback(async () => {
    if (!selectedCenterId) return;
    if (isLocalDevServer()) {
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
        // use fallback
      }
    }
    setCenterQueue(allTokens.filter(t => t.center_id === selectedCenterId));
    setLastUpdated(new Date());
  }, [selectedCenterId, allTokens]);

  // Fetch Farmer Tokens
  const refreshFarmerTokens = useCallback(async (phone?: string) => {
    const targetPhone = phone || currentFarmer?.phone;
    if (!targetPhone) return;
    if (isLocalDevServer()) {
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
        // fallback
      }
    }
    const filtered = allTokens.filter(t => t.farmer_phone === targetPhone);
    setFarmerTokens(filtered);
    if (filtered.length > 0 && !activeToken) {
      setActiveToken(filtered[0]);
    }
  }, [currentFarmer?.phone, activeToken, allTokens]);

  // Fetch SMS Logs
  const refreshSmsLogs = useCallback(async () => {
    if (isLocalDevServer()) {
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
        // fallback
      }
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

  // Realtime SSE Listener (Dev only)
  useEffect(() => {
    if (!isLocalDevServer()) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onopen = () => setIsConnected(true);
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
      eventSource.addEventListener('sms_sent', (e) => {
        const newLog: SMSLog = JSON.parse(e.data);
        setSmsLogs(prev => [newLog, ...prev]);
        setNewSmsAlert(newLog);
      });
      eventSource.onerror = () => {
        // don't mask error
      };
    } catch (err) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [selectedCenterId, currentFarmer?.phone, activeToken?.token_id, refreshCenterQueue, refreshFarmerTokens, refreshSmsLogs]);

  // Token Creation Action (H-2: Monotonic sequence; M-5: crypto.randomUUID; H-3: pendingSync)
  const createToken = async (data: Partial<Token>): Promise<Token> => {
    const nowIso = new Date().toISOString();
    const tokenUid = `t-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
    const selectedCrop = (data.crop || 'Wheat (गेहूं)') as any;
    const officialRate = (MSP_DATA as any)[selectedCrop]?.rate || 2275;
    const quantityNum = Number(data.quantity || 10);
    const targetCenterId = data.center_id || selectedCenterId || 'c-rau';
    const centerInfo = centers.find(c => c.center_id === targetCenterId);

    // Compute monotonic token number (H-2 / Collision prevention)
    const existingNums = allTokens
      .map(t => {
        const match = (t.token_number || '').match(/A-(\d+)/);
        return match ? parseInt(match[1], 10) : 100;
      })
      .filter(n => !isNaN(n));
    const maxSeq = existingNums.length > 0 ? Math.max(...existingNums) : 106;
    const nextTokenNumber = `A-${maxSeq + 1}`;

    const activeInCenter = allTokens.filter(t => t.center_id === targetCenterId && ['Registered', 'In Queue', 'Quality Check'].includes(t.status)).length;
    const initialPosition = activeInCenter + 1;
    const estimatedMin = initialPosition * (centerInfo?.avg_service_time_min || 10);

    const newToken: Token = {
      token_id: tokenUid,
      farmer_id: data.farmer_id || currentFarmer?.farmer_id || 'f-ramesh',
      farmer_name: data.farmer_name || currentFarmer?.name || 'Ramesh Kumar',
      farmer_phone: data.farmer_phone || currentFarmer?.phone || '9876543210',
      farmer_village: data.farmer_village || currentFarmer?.village || 'Rau Village',
      center_id: targetCenterId,
      center_name: centerInfo?.name || 'Procurement Center',
      crop: selectedCrop,
      quantity: quantityNum,
      msp_rate: officialRate,
      preferred_slot: data.preferred_slot || '07:00 AM - 09:00 AM',
      token_number: nextTokenNumber,
      queue_position: initialPosition,
      estimated_time: `~${estimatedMin} mins`,
      estimated_minutes: estimatedMin,
      status: 'Registered',
      payment_amount: quantityNum * officialRate,
      status_history: [
        { status: 'Registered', timestamp: nowIso, note: 'Digital token generated via Mandi Queue' }
      ],
      created_at: nowIso,
      updated_at: nowIso
    };

    // Optimistic UI state update
    pendingSyncTokens.current.add(newToken.token_id);
    setAllTokens(prev => [newToken, ...prev]);
    setActiveToken(newToken);
    setCenterQueue(prev => [newToken, ...prev]);
    setFarmerTokens(prev => [newToken, ...prev]);

    // Live Database Sync (C-2 / Group 1)
    syncTokenToSupabase(newToken).then(() => {
      pendingSyncTokens.current.delete(newToken.token_id);
    });

    // SMS Log Simulation
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

  // Status Advance Action (M-6: Queue positions decrement automatically)
  const advanceTokenStatus = async (
    tokenId: string, 
    nextStatus: Token['status'], 
    qcResult?: QualityCheckResult, 
    note?: string
  ): Promise<Token> => {
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
      queue_position: ['Procured', 'Payment Sent', 'Rejected', 'Cancelled'].includes(finalStatus) ? 0 : targetToken.queue_position,
      status_history: [
        ...(targetToken.status_history || []),
        { status: finalStatus, timestamp: nowIso, note: note || `Status updated to ${finalStatus}` }
      ],
      updated_at: nowIso
    };

    pendingSyncTokens.current.add(tokenId);

    // M-6: Recalculate queue positions for all remaining active tokens at this center
    const centerId = targetToken.center_id;
    const centerInfo = centers.find(c => c.center_id === centerId);
    const avgMin = centerInfo?.avg_service_time_min || 10;

    setAllTokens(prev => {
      // 1. Update target token
      const nextList = prev.map(t => t.token_id === tokenId ? updatedToken : t);
      
      // 2. Identify remaining active tokens in center (In Queue / Registered)
      const activeWaiting = nextList
        .filter(t => t.center_id === centerId && (t.status === 'In Queue' || t.status === 'Registered'))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // 3. Re-index queue positions
      const positionMap = new Map<string, { pos: number; estMins: number; estTime: string }>();
      activeWaiting.forEach((tok, idx) => {
        const pos = idx + 1;
        const estMins = pos * avgMin;
        const estTime = pos === 1 ? '~5 mins (Next in line)' : `~${estMins} mins`;
        positionMap.set(tok.token_id, { pos, estMins, estTime });
      });

      // 4. Return new array with updated queue positions
      return nextList.map(tok => {
        if (positionMap.has(tok.token_id)) {
          const info = positionMap.get(tok.token_id)!;
          const updatedWaiting: Token = {
            ...tok,
            queue_position: info.pos,
            estimated_minutes: info.estMins,
            estimated_time: info.estTime
          };
          syncTokenToSupabase(updatedWaiting);
          return updatedWaiting;
        }
        return tok;
      });
    });

    if (activeToken?.token_id === tokenId) setActiveToken(updatedToken);

    // Live Database Sync
    syncTokenToSupabase(updatedToken).then(() => {
      pendingSyncTokens.current.delete(tokenId);
    });

    let eventName: SMSLog['trigger_event'] = 'QUEUE_ADVANCED';
    let msgEn = `[e-MANDI ALERT] Token ${updatedToken.token_number} status updated to ${finalStatus}.`;
    let msgHi = `[ई-मंडी सूचना] टोकन ${updatedToken.token_number} का स्टेटस ${finalStatus} हो गया है।`;

    if (isRejected) {
      eventName = 'QUALITY_CHECK_DONE';
      msgEn = `[e-MANDI REJECTION NOTICE] Token ${updatedToken.token_number} (${updatedToken.farmer_name}): Crop lot REJECTED during Quality Inspection. Lot Disqualified for procurement.`;
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
    const nowIso = new Date().toISOString();
    const targetToken = allTokens.find(t => t.token_id === tokenId) || centerQueue.find(t => t.token_id === tokenId) || activeToken;
    if (targetToken) {
      const updatedToken: Token = {
        ...targetToken,
        status: 'Payment Sent',
        payment_confirmed_at: nowIso,
        payment_reference: `UPI-DBT-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        payment_method: 'DBT Direct Bank Transfer / UPI',
        queue_position: 0,
        updated_at: nowIso
      };
      
      pendingSyncTokens.current.add(tokenId);
      setAllTokens(prev => prev.map(t => t.token_id === tokenId ? updatedToken : t));
      if (activeToken?.token_id === tokenId) setActiveToken(updatedToken);

      syncTokenToSupabase(updatedToken).then(() => {
        pendingSyncTokens.current.delete(tokenId);
      });

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

  // Reset Demo Action (Clean atomic delete + seed)
  const resetDemoData = async () => {
    try {
      localStorage.removeItem('mandi_all_tokens');
      localStorage.removeItem('mandi_sms_logs');
      localStorage.removeItem('mandi_current_farmer');
      if (supabaseClient) {
        await supabaseClient.from('tokens').delete().neq('token_id', '');
        await Promise.all(FALLBACK_TOKENS.map(t => syncTokenToSupabase(t)));
      }
    } catch (err) {
      console.warn('[Reset Demo Warning]', err);
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

  // Update Farmer Profile Action (L-4: Strict Aadhaar masking)
  const updateFarmerProfile = async (updates: Partial<Farmer>): Promise<Farmer> => {
    if (!currentFarmer) throw new Error('No active farmer');

    const updatedFarmer: Farmer = {
      ...currentFarmer,
      ...updates,
      aadhaar_last4: updates.aadhaar_last4 || currentFarmer.aadhaar_last4,
      bank_account_last4: updates.bank_account_last4 || currentFarmer.bank_account_last4,
      is_aadhaar_verified: updates.is_aadhaar_verified ?? currentFarmer.is_aadhaar_verified
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
