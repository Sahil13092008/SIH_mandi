import { Center, Farmer, Token, QualityCheckResult } from '../src/types';
import { smsService } from './smsService';
import { supabase, isSupabaseConfigured } from './supabase';

class HybridDatabaseService {
  public farmers: Map<string, Farmer> = new Map();
  public centers: Map<string, Center> = new Map();
  public tokens: Map<string, Token> = new Map();

  constructor() {
    this.seed();
    this.initSupabaseSync();
  }

  private async initSupabaseSync() {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      console.log('[Supabase DB] Loading initial data from Supabase PostgreSQL...');
      
      // Fetch Centers
      const { data: dbCenters, error: cErr } = await supabase.from('centers').select('*');
      if (!cErr && dbCenters && dbCenters.length > 0) {
        this.centers.clear();
        dbCenters.forEach(c => {
          this.centers.set(c.center_id, {
            ...c,
            slots: typeof c.slots === 'string' ? JSON.parse(c.slots) : c.slots
          });
        });
      }

      // Fetch Farmers
      const { data: dbFarmers, error: fErr } = await supabase.from('farmers').select('*');
      if (!fErr && dbFarmers && dbFarmers.length > 0) {
        this.farmers.clear();
        dbFarmers.forEach(f => this.farmers.set(f.farmer_id, f));
      }

      // Fetch Tokens
      const { data: dbTokens, error: tErr } = await supabase.from('tokens').select('*');
      if (!tErr && dbTokens && dbTokens.length > 0) {
        this.tokens.clear();
        dbTokens.forEach(t => {
          this.tokens.set(t.token_id, {
            ...t,
            quality_check_result: typeof t.quality_check_result === 'string' ? JSON.parse(t.quality_check_result) : t.quality_check_result,
            status_history: typeof t.status_history === 'string' ? JSON.parse(t.status_history) : (t.status_history || [])
          });
        });
      }
      console.log(`[Supabase DB] Successfully synced: ${this.centers.size} centers, ${this.farmers.size} farmers, ${this.tokens.size} tokens.`);
    } catch (err) {
      console.error('[Supabase DB] Initial sync error:', err);
    }
  }

  public seed() {
    this.farmers.clear();
    this.centers.clear();
    this.tokens.clear();
    smsService.clearLogs();

    // 1. Centers
    const centersList: Center[] = [
      {
        center_id: 'c-rau',
        name: 'Rau Mandi Procurement Center',
        location: 'Rau Bypass, AB Road, Indore',
        district: 'Indore',
        state: 'Madhya Pradesh',
        slots: [
          '07:00 AM - 09:00 AM',
          '09:00 AM - 11:00 AM',
          '11:00 AM - 01:00 PM',
          '02:00 PM - 04:00 PM',
          '04:00 PM - 06:00 PM'
        ],
        daily_capacity: 500,
        current_load_quintals: 215,
        active_tokens_count: 6,
        avg_service_time_min: 10,
        operational_status: 'Active'
      },
      {
        center_id: 'c-indore',
        name: 'Indore Main APMC Mandi (Chhawani)',
        location: 'APMC Yard, Chhawani, Indore',
        district: 'Indore',
        state: 'Madhya Pradesh',
        slots: [
          '07:00 AM - 09:00 AM',
          '09:00 AM - 11:00 AM',
          '11:00 AM - 01:00 PM',
          '02:00 PM - 04:00 PM',
          '04:00 PM - 06:00 PM'
        ],
        daily_capacity: 1200,
        current_load_quintals: 680,
        active_tokens_count: 14,
        avg_service_time_min: 8,
        operational_status: 'High Traffic'
      },
      {
        center_id: 'c-ujjain',
        name: 'Ujjain Krishi Upaj Mandi',
        location: 'Agar Road, Industrial Area, Ujjain',
        district: 'Ujjain',
        state: 'Madhya Pradesh',
        slots: [
          '07:00 AM - 09:00 AM',
          '09:00 AM - 11:00 AM',
          '11:00 AM - 01:00 PM',
          '02:00 PM - 04:00 PM'
        ],
        daily_capacity: 750,
        current_load_quintals: 340,
        active_tokens_count: 8,
        avg_service_time_min: 12,
        operational_status: 'Active'
      }
    ];

    centersList.forEach(c => this.centers.set(c.center_id, c));

    // 2. Farmers
    const sampleFarmers: Farmer[] = [
      {
        farmer_id: 'f-ramesh',
        name: 'Ramesh Kumar',
        phone: '9876543210',
        village: 'Rau Village',
        district: 'Indore',
        aadhaar_last4: '7821',
        bank_account_last4: '4509',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        farmer_id: 'f-suresh',
        name: 'Suresh Patel',
        phone: '9826012345',
        village: 'Rangwasa',
        district: 'Indore',
        aadhaar_last4: '9912',
        bank_account_last4: '6612',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        farmer_id: 'f-rajesh',
        name: 'Rajesh Verma',
        phone: '9425098765',
        village: 'Sanwer',
        district: 'Indore',
        aadhaar_last4: '3487',
        bank_account_last4: '1190',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        farmer_id: 'f-sunita',
        name: 'Sunita Bai',
        phone: '9893011223',
        village: 'Depalpur',
        district: 'Indore',
        aadhaar_last4: '6541',
        bank_account_last4: '8823',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        farmer_id: 'f-mohan',
        name: 'Mohan Lal Yadav',
        phone: '9755566778',
        village: 'Pithampur',
        district: 'Dhar',
        aadhaar_last4: '1234',
        bank_account_last4: '5432',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        farmer_id: 'f-vikram',
        name: 'Vikram Singh',
        phone: '9111223344',
        village: 'Betma',
        district: 'Indore',
        aadhaar_last4: '8765',
        bank_account_last4: '9081',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString()
      }
    ];

    sampleFarmers.forEach(f => this.farmers.set(f.farmer_id, f));

    // 3. Tokens
    const now = Date.now();
    const iso = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

    const sampleTokens: Token[] = [
      {
        token_id: 't-101',
        farmer_id: 'f-mohan',
        farmer_name: 'Mohan Lal Yadav',
        farmer_phone: '9755566778',
        farmer_village: 'Pithampur',
        center_id: 'c-rau',
        center_name: 'Rau Mandi Procurement Center',
        crop: 'Wheat (गेहूं)',
        quantity: 25,
        msp_rate: 2275,
        preferred_slot: '07:00 AM - 09:00 AM',
        token_number: 'A-101',
        queue_position: 0,
        estimated_time: 'Completed',
        estimated_minutes: 0,
        status: 'Payment Sent',
        quality_check_result: {
          grade: 'Grade A (FAQ)',
          moisture: 10.9,
          impurities: 0.8,
          notes: 'Golden grain, high test weight, no weevil damage.',
          inspector_name: 'Dr. A. K. Sharma (Mandi QC)',
          inspected_at: iso(95)
        },
        payment_amount: 25 * 2275,
        payment_method: 'DBT Direct Bank Transfer / UPI',
        payment_reference: 'UPI-DBT-9982412891',
        payment_confirmed_at: iso(60),
        status_history: [
          { status: 'Registered', timestamp: iso(130), note: 'Slot booked via Farmer App' },
          { status: 'In Queue', timestamp: iso(110), note: 'Gate entry verified' },
          { status: 'Quality Check', timestamp: iso(95), note: 'Lab sample passed Grade A' },
          { status: 'Procured', timestamp: iso(80), note: 'Weighed on electronic bridge: 25.00 Qtl' },
          { status: 'Payment Sent', timestamp: iso(60), note: 'Bank transfer credited' }
        ],
        created_at: iso(130),
        updated_at: iso(60)
      },
      {
        token_id: 't-102',
        farmer_id: 'f-sunita',
        farmer_name: 'Sunita Bai',
        farmer_phone: '9893011223',
        farmer_village: 'Depalpur',
        center_id: 'c-rau',
        center_name: 'Rau Mandi Procurement Center',
        crop: 'Gram (चना)',
        quantity: 15,
        msp_rate: 5440,
        preferred_slot: '07:00 AM - 09:00 AM',
        token_number: 'A-102',
        queue_position: 0,
        estimated_time: 'Procured',
        estimated_minutes: 0,
        status: 'Procured',
        quality_check_result: {
          grade: 'Grade A (FAQ)',
          moisture: 11.2,
          impurities: 1.1,
          notes: 'Standard FAQ grade gram. Clean lot.',
          inspector_name: 'Dr. A. K. Sharma (Mandi QC)',
          inspected_at: iso(45)
        },
        payment_amount: 15 * 5440,
        status_history: [
          { status: 'Registered', timestamp: iso(115), note: 'Slot booked' },
          { status: 'In Queue', timestamp: iso(70), note: 'Gate entry' },
          { status: 'Quality Check', timestamp: iso(45), note: 'QC Passed' },
          { status: 'Procured', timestamp: iso(20), note: 'Electronic weight verified' }
        ],
        created_at: iso(115),
        updated_at: iso(20)
      },
      {
        token_id: 't-103',
        farmer_id: 'f-suresh',
        farmer_name: 'Suresh Patel',
        farmer_phone: '9826012345',
        farmer_village: 'Rangwasa',
        center_id: 'c-rau',
        center_name: 'Rau Mandi Procurement Center',
        crop: 'Soybean (सोयाबीन)',
        quantity: 20,
        msp_rate: 4892,
        preferred_slot: '07:00 AM - 09:00 AM',
        token_number: 'A-103',
        queue_position: 1,
        estimated_time: 'Now at Lab',
        estimated_minutes: 5,
        status: 'Quality Check',
        quality_check_result: {
          grade: 'Grade A (FAQ)',
          moisture: 11.4,
          impurities: 1.3,
          notes: 'Testing sample under standard moisture meter.',
          inspector_name: 'Dr. A. K. Sharma (Mandi QC)',
          inspected_at: iso(8)
        },
        payment_amount: 20 * 4892,
        status_history: [
          { status: 'Registered', timestamp: iso(90), note: 'Slot booked' },
          { status: 'In Queue', timestamp: iso(35), note: 'Arrived at gate' },
          { status: 'Quality Check', timestamp: iso(8), note: 'Sample testing in progress' }
        ],
        created_at: iso(90),
        updated_at: iso(8)
      },
      {
        token_id: 't-104',
        farmer_id: 'f-ramesh',
        farmer_name: 'Ramesh Kumar',
        farmer_phone: '9876543210',
        farmer_village: 'Rau Village',
        center_id: 'c-rau',
        center_name: 'Rau Mandi Procurement Center',
        crop: 'Wheat (गेहूं)',
        quantity: 10,
        msp_rate: 2275,
        preferred_slot: '07:00 AM - 09:00 AM',
        token_number: 'A-104',
        queue_position: 2,
        estimated_time: '~15 mins',
        estimated_minutes: 15,
        status: 'In Queue',
        payment_amount: 10 * 2275,
        status_history: [
          { status: 'Registered', timestamp: iso(40), note: 'Token generated via Mobile App' },
          { status: 'In Queue', timestamp: iso(10), note: 'Tractor entered Yard Gate No. 2' }
        ],
        created_at: iso(40),
        updated_at: iso(10)
      },
      {
        token_id: 't-105',
        farmer_id: 'f-rajesh',
        farmer_name: 'Rajesh Verma',
        farmer_phone: '9425098765',
        farmer_village: 'Sanwer',
        center_id: 'c-rau',
        center_name: 'Rau Mandi Procurement Center',
        crop: 'Mustard (सरसों)',
        quantity: 12,
        msp_rate: 5650,
        preferred_slot: '09:00 AM - 11:00 AM',
        token_number: 'A-105',
        queue_position: 3,
        estimated_time: '~25 mins',
        estimated_minutes: 25,
        status: 'Registered',
        payment_amount: 12 * 5650,
        status_history: [
          { status: 'Registered', timestamp: iso(25), note: 'Advance booking for 9 AM slot' }
        ],
        created_at: iso(25),
        updated_at: iso(25)
      },
      {
        token_id: 't-106',
        farmer_id: 'f-vikram',
        farmer_name: 'Vikram Singh',
        farmer_phone: '9111223344',
        farmer_village: 'Betma',
        center_id: 'c-rau',
        center_name: 'Rau Mandi Procurement Center',
        crop: 'Wheat (गेहूं)',
        quantity: 18,
        msp_rate: 2275,
        preferred_slot: '09:00 AM - 11:00 AM',
        token_number: 'A-106',
        queue_position: 4,
        estimated_time: '~35 mins',
        estimated_minutes: 35,
        status: 'Registered',
        payment_amount: 18 * 2275,
        status_history: [
          { status: 'Registered', timestamp: iso(15), note: 'Slot booked' }
        ],
        created_at: iso(15),
        updated_at: iso(15)
      }
    ];

    sampleTokens.forEach(t => {
      this.tokens.set(t.token_id, t);
      if (t.status === 'Payment Sent') {
        smsService.sendTokenSMS(t, 'PAYMENT_SENT');
      } else if (t.status === 'Procured') {
        smsService.sendTokenSMS(t, 'PROCURED');
      } else if (t.status === 'Quality Check') {
        smsService.sendTokenSMS(t, 'QUALITY_CHECK_DONE');
      } else if (t.status === 'In Queue') {
        smsService.sendTokenSMS(t, 'QUEUE_ADVANCED');
      } else {
        smsService.sendTokenSMS(t, 'TOKEN_CONFIRMED');
      }
    });

    this.recalculateCenter('c-rau');

    // Sync seed data to Supabase if connected
    if (isSupabaseConfigured() && supabase) {
      this.syncSeedToSupabase();
    }
  }

  private async syncSeedToSupabase() {
    if (!supabase) return;
    try {
      await supabase.from('centers').upsert(Array.from(this.centers.values()));
      await supabase.from('farmers').upsert(Array.from(this.farmers.values()));
      await supabase.from('tokens').upsert(Array.from(this.tokens.values()));
    } catch (err) {
      console.error('[Supabase DB] Error syncing seed data:', err);
    }
  }

  public recalculateCenter(centerId: string) {
    const center = this.centers.get(centerId);
    if (!center) return;

    const centerTokens = Array.from(this.tokens.values()).filter(t => t.center_id === centerId);
    const activeStatuses = ['In Queue', 'Quality Check', 'Registered'];
    const activeTokens = centerTokens.filter(t => activeStatuses.includes(t.status));

    activeTokens.sort((a, b) => {
      const order: Record<string, number> = { 'Quality Check': 1, 'In Queue': 2, 'Registered': 3 };
      const rankA = order[a.status] || 9;
      const rankB = order[b.status] || 9;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const avgMinutes = center.avg_service_time_min || 10;

    activeTokens.forEach((token, index) => {
      const pos = index + 1;
      token.queue_position = pos;
      const mins = pos === 1 ? (token.status === 'Quality Check' ? 5 : avgMinutes) : (pos - 1) * avgMinutes;
      token.estimated_minutes = mins;
      token.estimated_time = mins <= 5 ? (token.status === 'Quality Check' ? 'Under Inspection' : 'Next in line (~5m)') : `~${mins} mins`;
      token.updated_at = new Date().toISOString();

      if (isSupabaseConfigured() && supabase) {
        supabase.from('tokens').update({
          queue_position: token.queue_position,
          estimated_minutes: token.estimated_minutes,
          estimated_time: token.estimated_time,
          updated_at: token.updated_at
        }).eq('token_id', token.token_id).then();
      }
    });

    centerTokens.filter(t => !activeStatuses.includes(t.status)).forEach(token => {
      token.queue_position = 0;
      if (token.status === 'Payment Sent') {
        token.estimated_time = 'Completed';
        token.estimated_minutes = 0;
      } else if (token.status === 'Procured') {
        token.estimated_time = 'Awaiting DBT';
        token.estimated_minutes = 0;
      }
    });

    center.active_tokens_count = activeTokens.length;
    center.current_load_quintals = centerTokens.reduce((acc, curr) => acc + (curr.status !== 'Cancelled' ? curr.quantity : 0), 0);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('centers').update({
        active_tokens_count: center.active_tokens_count,
        current_load_quintals: center.current_load_quintals
      }).eq('center_id', center.center_id).then();
    }
  }

  public getCenterQueue(centerId: string): Token[] {
    this.recalculateCenter(centerId);
    return Array.from(this.tokens.values())
      .filter(t => t.center_id === centerId)
      .sort((a, b) => {
        const activeA = ['Quality Check', 'In Queue', 'Registered'].includes(a.status) ? 1 : 0;
        const activeB = ['Quality Check', 'In Queue', 'Registered'].includes(b.status) ? 1 : 0;
        if (activeA !== activeB) return activeB - activeA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }

  public updateFarmer(farmer_id: string, updates: Partial<Farmer>): Farmer | null {
    let farmer = this.farmers.get(farmer_id);
    if (!farmer) return null;

    const updatedFarmer: Farmer = {
      ...farmer,
      ...updates
    };

    if (updates.aadhaar_last4 !== undefined) {
      updatedFarmer.aadhaar_last4 = updates.aadhaar_last4;
    }

    if (updates.bank_account_last4 !== undefined) {
      updatedFarmer.bank_account_last4 = updates.bank_account_last4;
    }

    if (updates.is_aadhaar_verified !== undefined) {
      updatedFarmer.is_aadhaar_verified = updates.is_aadhaar_verified;
    }

    this.farmers.set(farmer_id, updatedFarmer);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('farmers').update(updatedFarmer).eq('farmer_id', farmer_id).then(({ error }) => {
        if (error) console.error('[Supabase DB] Error updating farmer:', error);
      });
    }

    return updatedFarmer;
  }

  public createToken(data: {
    farmer_id: string;
    farmer_name: string;
    farmer_phone: string;
    farmer_village: string;
    center_id: string;
    crop: string;
    quantity: number;
    msp_rate: number;
    preferred_slot: string;
  }): Token {
    const center = this.centers.get(data.center_id) || Array.from(this.centers.values())[0];
    
    const existingTokens = Array.from(this.tokens.values()).filter(t => t.center_id === data.center_id);
    const existingSeqs = existingTokens
      .map(t => {
        const m = (t.token_number || '').match(/A-(\d+)/);
        return m ? parseInt(m[1], 10) : 100;
      })
      .filter(n => !isNaN(n));
    const nextSeq = (existingSeqs.length > 0 ? Math.max(...existingSeqs) : 106) + 1;
    const tokenNumber = `A-${nextSeq}`;
    const tokenId = `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const paymentAmount = data.quantity * data.msp_rate;

    const token: Token = {
      token_id: tokenId,
      farmer_id: data.farmer_id,
      farmer_name: data.farmer_name,
      farmer_phone: data.farmer_phone,
      farmer_village: data.farmer_village,
      center_id: data.center_id,
      center_name: center.name,
      crop: data.crop,
      quantity: data.quantity,
      msp_rate: data.msp_rate,
      preferred_slot: data.preferred_slot,
      token_number: tokenNumber,
      queue_position: 1,
      estimated_time: '~20 mins',
      estimated_minutes: 20,
      status: 'Registered',
      payment_amount: paymentAmount,
      status_history: [
        { status: 'Registered', timestamp: nowIso, note: 'Digital token generated via Mandi Queue' }
      ],
      created_at: nowIso,
      updated_at: nowIso
    };

    this.tokens.set(tokenId, token);
    this.recalculateCenter(data.center_id);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('tokens').insert(token).then(({ error }) => {
        if (error) console.error('[Supabase DB] Error creating token:', error);
      });
    }

    smsService.sendTokenSMS(token, 'TOKEN_CONFIRMED');
    return token;
  }

  public updateTokenStatus(tokenId: string, newStatus: Token['status'], qualityResult?: QualityCheckResult, note?: string): Token | null {
    const token = this.tokens.get(tokenId);
    if (!token) return null;

    token.status = newStatus;
    token.updated_at = new Date().toISOString();

    if (qualityResult) {
      token.quality_check_result = qualityResult;
    }

    token.status_history.push({
      status: newStatus,
      timestamp: token.updated_at,
      note: note || `Status updated to ${newStatus} by Mandi Staff`
    });

    this.recalculateCenter(token.center_id);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('tokens').update({
        status: token.status,
        quality_check_result: token.quality_check_result,
        status_history: token.status_history,
        updated_at: token.updated_at
      }).eq('token_id', tokenId).then(({ error }) => {
        if (error) console.error('[Supabase DB] Error updating token status:', error);
      });
    }

    if (newStatus === 'In Queue') {
      smsService.sendTokenSMS(token, 'QUEUE_ADVANCED');
    } else if (newStatus === 'Quality Check') {
      smsService.sendTokenSMS(token, 'QUALITY_CHECK_DONE');
    } else if (newStatus === 'Procured') {
      smsService.sendTokenSMS(token, 'PROCURED');
    } else if (newStatus === 'Payment Sent') {
      smsService.sendTokenSMS(token, 'PAYMENT_SENT');
    }

    return token;
  }

  public processPaymentWebhook(tokenId: string, customRef?: string): Token | null {
    const token = this.tokens.get(tokenId);
    if (!token) return null;

    const nowIso = new Date().toISOString();
    token.status = 'Payment Sent';
    token.payment_confirmed_at = nowIso;
    token.payment_reference = customRef || `UPI-DBT-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    token.payment_method = 'DBT Direct Bank Transfer / UPI';
    token.updated_at = nowIso;

    token.status_history.push({
      status: 'Payment Sent',
      timestamp: nowIso,
      note: `UPI/DBT Webhook confirmed. Ref: ${token.payment_reference}`
    });

    this.recalculateCenter(token.center_id);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('tokens').update({
        status: token.status,
        payment_confirmed_at: token.payment_confirmed_at,
        payment_reference: token.payment_reference,
        payment_method: token.payment_method,
        status_history: token.status_history,
        updated_at: token.updated_at
      }).eq('token_id', tokenId).then(({ error }) => {
        if (error) console.error('[Supabase DB] Error processing payment webhook:', error);
      });
    }

    smsService.sendTokenSMS(token, 'PAYMENT_SENT');
    return token;
  }

  public getCenterAnalytics(centerId: string) {
    const center = this.centers.get(centerId);
    if (!center) return null;

    const centerTokens = Array.from(this.tokens.values()).filter(t => t.center_id === centerId);
    const procuredTokens = centerTokens.filter(t => ['Procured', 'Payment Sent'].includes(t.status));
    const totalProcuredQty = procuredTokens.reduce((acc, t) => acc + t.quantity, 0);
    const totalPayout = procuredTokens.reduce((acc, t) => acc + t.payment_amount, 0);

    const cropMap: Record<string, { quantity: number; amount: number }> = {};
    procuredTokens.forEach(t => {
      if (!cropMap[t.crop]) cropMap[t.crop] = { quantity: 0, amount: 0 };
      cropMap[t.crop].quantity += t.quantity;
      cropMap[t.crop].amount += t.payment_amount;
    });

    const crop_breakdown = Object.keys(cropMap).map(k => ({
      crop: k,
      quantity: cropMap[k].quantity,
      amount: cropMap[k].amount
    }));

    return {
      center_id: center.center_id,
      center_name: center.name,
      total_tokens_today: centerTokens.length,
      procured_tokens_today: procuredTokens.length,
      total_quantity_procured: totalProcuredQty,
      total_payout_inr: totalPayout,
      avg_wait_time_minutes: center.avg_service_time_min * 2.2,
      no_show_rate: 3.5,
      capacity_utilization: Math.min(100, Math.round((totalProcuredQty / center.daily_capacity) * 100)),
      crop_breakdown,
      hourly_arrivals: [
        { hour: '07:00 AM', count: 4 },
        { hour: '08:00 AM', count: 7 },
        { hour: '09:00 AM', count: 12 },
        { hour: '10:00 AM', count: 15 },
        { hour: '11:00 AM', count: 9 },
        { hour: '12:00 PM', count: 6 },
        { hour: '02:00 PM', count: 8 },
        { hour: '03:00 PM', count: 5 }
      ]
    };
  }

  public getMinistryOverview() {
    const allCenters = Array.from(this.centers.values());
    const allTokens = Array.from(this.tokens.values());
    const procuredTokens = allTokens.filter(t => ['Procured', 'Payment Sent'].includes(t.status));

    const totalQty = procuredTokens.reduce((acc, t) => acc + t.quantity, 0);
    const totalPayout = procuredTokens.reduce((acc, t) => acc + t.payment_amount, 0);
    const centerAnalytics = allCenters.map(c => this.getCenterAnalytics(c.center_id)!);
    const avgWait = centerAnalytics.length > 0
      ? Number((centerAnalytics.reduce((acc, c) => acc + (c.avg_wait_time_minutes || 0), 0) / centerAnalytics.length).toFixed(1))
      : 15;

    return {
      total_centers: allCenters.length,
      active_centers: allCenters.filter(c => c.operational_status !== 'Full').length,
      total_farmers_served_today: procuredTokens.length,
      total_procurement_quintals: totalQty,
      total_disbursed_inr: totalPayout,
      overall_avg_wait_time_min: avgWait,
      system_efficiency_score: Number(Math.min(100, Math.max(60, 100 - (avgWait > 20 ? (avgWait - 20) : 0))).toFixed(1)),
      center_performance: centerAnalytics
    };
  }
}

export const db = new HybridDatabaseService();
