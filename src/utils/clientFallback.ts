import { Center, Farmer, Token, SMSLog, MinistryOverview } from '../types';

export const FALLBACK_CENTERS: Center[] = [
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

const now = Date.now();
const iso = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

export const FALLBACK_TOKENS: Token[] = [
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

export const FALLBACK_SMS_LOGS: SMSLog[] = [
  {
    id: 'sms-init-1',
    token_id: 't-101',
    phone: '9755566778',
    farmer_name: 'Mohan Lal Yadav',
    message: '[GOV-PFMS / DBT] Payment of ₹56,875 successfully SENT to bank account of Mohan Lal Yadav for Token A-101.',
    message_hi: '[डीबीटी भुगतान सफल] टोकन A-101 के एवज में ₹56,875 की राशि किसान Mohan Lal Yadav के बैंक खाते में भेज दी गई है।',
    trigger_event: 'PAYMENT_SENT',
    sent_at: iso(60),
    status: 'Delivered'
  },
  {
    id: 'sms-init-2',
    token_id: 't-102',
    phone: '9893011223',
    farmer_name: 'Sunita Bai',
    message: '[e-MANDI WEIGHBRIDGE] Token A-102: 15 Qtl Gram successfully weighed & procured at MSP ₹5440/Qtl. Gross amount: ₹81,600.',
    message_hi: '[ई-मंडी तौल] टोकन A-102: 15 क्विंटल Gram का उपार्जन ₹5440/क्विंटल पर दर्ज हुआ। देय राशि: ₹81,600।',
    trigger_event: 'PROCURED',
    sent_at: iso(20),
    status: 'Delivered'
  },
  {
    id: 'sms-init-3',
    token_id: 't-104',
    phone: '9876543210',
    farmer_name: 'Ramesh Kumar',
    message: '[e-MANDI ALERT] Token A-104 (Ramesh Kumar): Your turn is approaching at Rau Mandi Procurement Center! Position #2, Est. time: ~15 mins.',
    message_hi: '[ई-मंडी सूचना] टोकन A-104 (Ramesh Kumar): आपकी बारी आ रही है! कतार स्थान: #2, शेष समय: ~15 mins।',
    trigger_event: 'QUEUE_ADVANCED',
    sent_at: iso(10),
    status: 'Delivered'
  }
];

export const getFallbackOverview = (): MinistryOverview => {
  const procuredTokens = FALLBACK_TOKENS.filter(t => ['Procured', 'Payment Sent'].includes(t.status));
  const totalQty = procuredTokens.reduce((acc, t) => acc + t.quantity, 0);
  const totalPayout = procuredTokens.reduce((acc, t) => acc + t.payment_amount, 0);

  const centerAnalytics = FALLBACK_CENTERS.map(c => {
    const centerTokens = FALLBACK_TOKENS.filter(t => t.center_id === c.center_id);
    const centerProcured = centerTokens.filter(t => ['Procured', 'Payment Sent'].includes(t.status));
    const centerQty = centerProcured.reduce((acc, t) => acc + t.quantity, 0);
    const centerPayout = centerProcured.reduce((acc, t) => acc + t.payment_amount, 0);

    return {
      center_id: c.center_id,
      center_name: c.name,
      total_tokens_today: centerTokens.length,
      procured_tokens_today: centerProcured.length,
      total_quantity_procured: centerQty,
      total_payout_inr: centerPayout,
      avg_wait_time_minutes: c.avg_service_time_min * 2.2,
      no_show_rate: 3.5,
      capacity_utilization: Math.min(100, Math.round((centerQty / c.daily_capacity) * 100)),
      crop_breakdown: [
        { crop: 'Wheat (गेहूं)', quantity: 25, amount: 56875 },
        { crop: 'Gram (चना)', quantity: 15, amount: 81600 }
      ],
      hourly_arrivals: [
        { hour: '07:00 AM', count: 4 },
        { hour: '08:00 AM', count: 7 },
        { hour: '09:00 AM', count: 12 },
        { hour: '10:00 AM', count: 15 },
        { hour: '11:00 AM', count: 9 },
        { hour: '12:00 PM', count: 6 },
        { hour: '02:00 PM', count: 8 }
      ]
    };
  });

  return {
    total_centers: FALLBACK_CENTERS.length,
    active_centers: FALLBACK_CENTERS.filter(c => c.operational_status !== 'Full').length,
    total_farmers_served_today: procuredTokens.length + 18,
    total_procurement_quintals: totalQty + 420,
    total_disbursed_inr: totalPayout + 950000,
    overall_avg_wait_time_min: 24,
    system_efficiency_score: 96.4,
    center_performance: centerAnalytics
  };
};
