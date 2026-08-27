import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquareText, 
  Smartphone, 
  Search, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Send,
  Phone,
  Radio
} from 'lucide-react';
import { SMSLog } from '../../types';

export const SMSPanel: React.FC = () => {
  const { smsLogs, refreshSmsLogs, t, language } = useApp();
  const [phoneFilter, setPhoneFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<SMSLog | null>(null);

  const filteredLogs = smsLogs.filter(l => {
    if (!phoneFilter) return true;
    return l.phone.includes(phoneFilter) || l.farmer_name.toLowerCase().includes(phoneFilter.toLowerCase());
  });

  const handleClearLogs = async () => {
    await fetch('/api/sms-log', { method: 'DELETE' });
    await refreshSmsLogs();
  };

  const getEventBadge = (event: SMSLog['trigger_event']) => {
    switch (event) {
      case 'TOKEN_CONFIRMED':
        return { label: 'Token Confirmed', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'QUEUE_ADVANCED':
      case 'TURN_APPROACHING':
        return { label: 'Queue Advancing', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'QUALITY_CHECK_DONE':
        return { label: 'Quality Check Done', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'PROCURED':
        return { label: 'Lot Procured & Weighed', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'PAYMENT_SENT':
        return { label: 'DBT Payment Sent', bg: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold' };
      default:
        return { label: event, bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Mock Twilio / MSG91 Service
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.smsTitle}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {t.smsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-mono font-bold border border-stone-200">
            <MessageSquareText className="w-4 h-4 text-emerald-600" />
            <span>{smsLogs.length} Dispatches</span>
          </div>

          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearLogs}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Simulated Feature Phone + Live Dispatch Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Simulated Smartphone / Feature Phone Inbox */}
        <div className="lg:col-span-5 bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-4 border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-300 tracking-wider uppercase">
                Farmer SMS Inbox • +91 {phoneFilter || '9876543210'}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">
              SIM 1 • JIO / AIRTEL
            </span>
          </div>

          {/* Messages Stream inside the phone */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-xs">
                No SMS received for this number yet.
              </div>
            ) : (
              filteredLogs.slice(0, 10).map(log => {
                const badge = getEventBadge(log.trigger_event);

                return (
                  <div
                    key={log.id}
                    className="bg-stone-800/90 rounded-2xl p-3.5 border border-stone-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-400">
                        {log.farmer_name} (+91 {log.phone})
                      </span>
                      <span className="text-stone-400 font-mono">
                        {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs text-stone-100 font-mono leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800">
                      {language === 'hi' && log.message_hi ? log.message_hi : log.message}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ✓✓ Delivered
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Full Auditable SMS Log Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-stone-900 text-base">
              Gateway Dispatch Telemetry & Audit Log
            </h3>

            {/* Filter by phone */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={phoneFilter}
                onChange={e => setPhoneFilter(e.target.value)}
                placeholder={t.filterByPhone}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Trigger Event</th>
                  <th className="py-2.5 px-3">Message Preview</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80">
                {filteredLogs.map(log => {
                  const badge = getEventBadge(log.trigger_event);

                  return (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-stone-900">{log.farmer_name}</div>
                        <div className="text-[11px] font-mono text-stone-500">+91 {log.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate font-mono text-[11px] text-stone-700">
                        {log.message}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Delivered
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
