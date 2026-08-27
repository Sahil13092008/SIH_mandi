import { SMSLog, Token } from '../src/types';

export class SimulatedSMSService {
  private logs: SMSLog[] = [];
  private listeners: ((log: SMSLog) => void)[] = [];

  constructor() {
    this.logs = [];
  }

  public subscribe(listener: (log: SMSLog) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getLogs(): SMSLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }

  public sendTokenSMS(token: Token, triggerEvent: SMSLog['trigger_event'], extra?: any): SMSLog {
    let msgEn = '';
    let msgHi = '';

    const formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    switch (triggerEvent) {
      case 'TOKEN_CONFIRMED':
        msgEn = `[e-MANDI GOV] Namaste ${token.farmer_name}, your token ${token.token_number} for ${token.quantity} Quintal ${token.crop} at ${token.center_name} (${token.preferred_slot}) is CONFIRMED. Queue pos: #${token.queue_position}. Est. wait: ${token.estimated_time}.`;
        msgHi = `[ई-मंडी उपार्जन] नमस्ते ${token.farmer_name}, ${token.center_name} पर ${token.preferred_slot} के लिए आपका टोकन ${token.token_number} (${token.quantity} क्विंटल ${token.crop}) सुरक्षित हो गया है। कतार संख्या: #${token.queue_position}, अनुमानित समय: ${token.estimated_time}।`;
        break;

      case 'QUEUE_ADVANCED':
      case 'TURN_APPROACHING':
        msgEn = `[e-MANDI ALERT] Token ${token.token_number} (${token.farmer_name}): Your turn is approaching at ${token.center_name}! Position #${token.queue_position}, Est. time: ${token.estimated_time}. Please bring tractor to Gate No. 2.`;
        msgHi = `[ई-मंडी सूचना] टोकन ${token.token_number} (${token.farmer_name}): आपकी बारी आ रही है! कतार स्थान: #${token.queue_position}, शेष समय: ${token.estimated_time}। कृपया अपनी ट्रॉली गेट नं. 2 पर लाएं।`;
        break;

      case 'QUALITY_CHECK_DONE':
        const grade = token.quality_check_result?.grade || 'Grade A (FAQ)';
        const moisture = token.quality_check_result?.moisture || 11.8;
        msgEn = `[e-MANDI LAB] Quality check complete for Token ${token.token_number}. Result: ${grade}, Moisture: ${moisture}%. Lot passed standard FAQ specs. Proceeding to weighbridge.`;
        msgHi = `[ई-मंडी लैब] टोकन ${token.token_number} की गुणवत्ता जांच पूर्ण। ग्रेड: ${grade}, नमी: ${moisture}%। मानक पास! इलेक्ट्रॉनिक धर्मकांटा तौल के लिए आगे बढ़ें।`;
        break;

      case 'PROCURED':
        msgEn = `[e-MANDI WEIGHBRIDGE] Token ${token.token_number}: ${token.quantity} Qtl ${token.crop} successfully weighed & procured at MSP ₹${token.msp_rate}/Qtl. Gross amount: ₹${token.payment_amount.toLocaleString('en-IN')}. DBT initiated.`;
        msgHi = `[ई-मंडी तौल] टोकन ${token.token_number}: ${token.quantity} क्विंटल ${token.crop} का उपार्जन ₹${token.msp_rate}/क्विंटल पर दर्ज हुआ। कुल देय राशि: ₹${token.payment_amount.toLocaleString('en-IN')}। डीबीटी बैंक भुगतान शुरू।`;
        break;

      case 'PAYMENT_SENT':
        const ref = token.payment_reference || `UPI-DBT-${Date.now().toString().slice(-8)}`;
        msgEn = `[GOV-PFMS / DBT] Payment of ₹${token.payment_amount.toLocaleString('en-IN')} successfully SENT to bank account of ${token.farmer_name} for Token ${token.token_number} (Ref: ${ref}). e-NAM / Dept of Agri.`;
        msgHi = `[डीबीटी भुगतान सफल] टोकन ${token.token_number} के एवज में ₹${token.payment_amount.toLocaleString('en-IN')} की राशि किसान ${token.farmer_name} के बैंक खाते में भेज दी गई है। (संदर्भ: ${ref})। कृषि विभाग।`;
        break;
    }

    const newLog: SMSLog = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      token_id: token.token_id,
      phone: token.farmer_phone,
      farmer_name: token.farmer_name,
      message: msgEn,
      message_hi: msgHi,
      trigger_event: triggerEvent,
      sent_at: new Date().toISOString(),
      status: 'Delivered'
    };

    this.logs.unshift(newLog);

    // Keep last 200 logs
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    this.listeners.forEach(fn => {
      try {
        fn(newLog);
      } catch (err) {
        console.error('Error broadcasting SMS log:', err);
      }
    });

    return newLog;
  }
}

export const smsService = new SimulatedSMSService();
