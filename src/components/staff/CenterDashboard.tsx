import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QualityCheckModal } from './QualityCheckModal';
import { ManualTokenModal } from './ManualTokenModal';
import { DailyLogRegister } from './DailyLogRegister';
import { Token, QualityCheckResult } from '../../types';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Scale, 
  BadgeIndianRupee, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Filter, 
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const CenterDashboard: React.FC = () => {
  const { 
    centers, 
    selectedCenterId, 
    setSelectedCenterId, 
    selectedCenter, 
    centerQueue, 
    advanceTokenStatus, 
    simulatePaymentWebhook,
    refreshCenterQueue,
    t,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'queue' | 'register'>('queue');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedTokenForQC, setSelectedTokenForQC] = useState<Token | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [loadingTokenId, setLoadingTokenId] = useState<string | null>(null);

  // Filtered Queue
  const filteredQueue = centerQueue.filter(t => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  // Center Stats
  const activeInYard = centerQueue.filter(t => ['In Queue', 'Quality Check', 'Registered'].includes(t.status)).length;
  const atInspection = centerQueue.filter(t => t.status === 'Quality Check').length;
  const procuredTokens = centerQueue.filter(t => ['Procured', 'Payment Sent'].includes(t.status));
  const procuredVolume = procuredTokens.reduce((acc, t) => acc + t.quantity, 0);
  const totalDisbursed = centerQueue.filter(t => t.status === 'Payment Sent').reduce((acc, t) => acc + t.payment_amount, 0);

  // Handle Advance Status Action
  const handleAdvance = async (token: Token) => {
    setLoadingTokenId(token.token_id);
    try {
      if (token.status === 'Registered') {
        await advanceTokenStatus(token.token_id, 'In Queue', undefined, 'Gate Entry: Tractor entered inspection yard');
      } else if (token.status === 'In Queue') {
        // Open QC Modal
        setSelectedTokenForQC(token);
      } else if (token.status === 'Quality Check') {
        await advanceTokenStatus(token.token_id, 'Procured', token.quality_check_result, 'Electronic weighbridge confirmed gross weight');
      } else if (token.status === 'Procured') {
        await simulatePaymentWebhook(token.token_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTokenId(null);
    }
  };

  const handleQCSubmit = async (qcResult: QualityCheckResult) => {
    if (!selectedTokenForQC) return;
    await advanceTokenStatus(selectedTokenForQC.token_id, 'Quality Check', qcResult, `QC Passed: ${qcResult.grade}`);
    setSelectedTokenForQC(null);
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Center Switcher */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Staff Control Panel
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {selectedCenter?.name || 'Mandi Procurement Center'}
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedCenter?.location} • {selectedCenter?.district}, {selectedCenter?.state}
            </p>
          </div>

          {/* Center Selector & Walk-in Token Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                id="staff-center-select"
                value={selectedCenterId}
                onChange={e => setSelectedCenterId(e.target.value)}
                className="text-xs font-bold py-2 pl-3 pr-8 rounded-lg border border-stone-300 bg-white text-stone-800 focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                {centers.map(c => (
                  <option key={c.center_id} value={c.center_id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>

            <button
              id="manual-token-btn"
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Walk-in Token</span>
            </button>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-stone-500 text-[11px] font-medium block">
                {t.activeInYard}
              </span>
              <span className="text-2xl font-black text-stone-900 font-mono">
                {activeInYard}
              </span>
              <span className="text-[10px] text-emerald-700 block font-medium">In Yard / Queue</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              🚜
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-stone-500 text-[11px] font-medium block">
                {t.atInspection}
              </span>
              <span className="text-2xl font-black text-amber-700 font-mono">
                {atInspection}
              </span>
              <span className="text-[10px] text-amber-700 block font-medium">Sample Testing</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              🔬
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-stone-500 text-[11px] font-medium block">
                {t.procuredToday}
              </span>
              <span className="text-2xl font-black text-emerald-800 font-mono">
                {procuredVolume} Qtl
              </span>
              <span className="text-[10px] text-stone-500 block font-medium">
                {procuredTokens.length} Lots Weighed
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              ⚖️
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-stone-500 text-[11px] font-medium block">
                {t.totalDisbursed}
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                ₹{(totalDisbursed / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] text-emerald-700 block font-medium">Via Direct DBT</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Main View Tabs (Today's Live Queue vs Daily Digital Register) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'queue'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Today's Live Queue ({filteredQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.dailyLogTab}</span>
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['ALL', 'In Queue', 'Quality Check', 'Registered', 'Procured', 'Payment Sent'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'register' ? (
        <DailyLogRegister tokens={centerQueue} centerName={selectedCenter?.name || 'Mandi'} />
      ) : (
        /* Live Queue Card / Table View */
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6 space-y-2">
              <p className="text-sm font-bold text-stone-700">No tokens matching this filter</p>
              <p className="text-xs text-stone-400">Tokens will appear here as farmers register or arrive at the gate.</p>
            </div>
          ) : (
            filteredQueue.map(token => {
              const isLoading = loadingTokenId === token.token_id;

              return (
                <div
                  key={token.token_id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    token.status === 'In Queue'
                      ? 'border-purple-300 ring-1 ring-purple-200 bg-purple-50/20'
                      : token.status === 'Quality Check'
                      ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20'
                      : token.status === 'Payment Sent'
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Left Column: Token, Farmer & Crop Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black font-mono text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-300">
                        {token.token_number}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          token.status === 'Payment Sent'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : token.status === 'Procured'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : token.status === 'Quality Check'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : token.status === 'In Queue'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {token.status}
                      </span>
                      {token.queue_position > 0 && (
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Queue Pos #{token.queue_position}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Farmer</span>
                        <span className="font-bold text-stone-900">{token.farmer_name}</span>
                        <span className="text-stone-500 block font-mono text-[11px]">+91 {token.farmer_phone}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Crop & Quantity</span>
                        <span className="font-bold text-stone-900">{token.crop}</span>
                        <span className="text-emerald-700 block font-mono font-bold text-[11px]">
                          {token.quantity} Quintals (₹{token.payment_amount.toLocaleString('en-IN')})
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Slot & Arrival</span>
                        <span className="font-medium text-stone-800 font-mono">{token.preferred_slot}</span>
                        <span className="text-stone-500 block text-[11px]">{token.farmer_village}</span>
                      </div>
                    </div>

                    {/* QC details preview if available */}
                    {token.quality_check_result && (
                      <div className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs flex flex-wrap items-center gap-3">
                        <span className="font-bold text-emerald-800">
                          Grade: {token.quality_check_result.grade}
                        </span>
                        <span className="text-stone-600 font-mono">
                          Moisture: {token.quality_check_result.moisture}%
                        </span>
                        <span className="text-stone-600 font-mono">
                          Foreign Matter: {token.quality_check_result.impurities}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Dynamic Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                    {token.status === 'Registered' && (
                      <button
                        id={`advance-queue-${token.token_number}`}
                        onClick={() => handleAdvance(token)}
                        disabled={isLoading}
                        className="py-2 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <span>Gate Entry (In Queue)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {token.status === 'In Queue' && (
                      <button
                        id={`advance-qc-${token.token_number}`}
                        onClick={() => setSelectedTokenForQC(token)}
                        disabled={isLoading}
                        className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Perform Quality Check</span>
                      </button>
                    )}

                    {token.status === 'Quality Check' && (
                      <button
                        id={`advance-procure-${token.token_number}`}
                        onClick={() => handleAdvance(token)}
                        disabled={isLoading}
                        className="py-2 px-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Scale className="w-4 h-4" />
                        <span>Weigh & Procure</span>
                      </button>
                    )}

                    {token.status === 'Procured' && (
                      <button
                        id={`advance-pay-${token.token_number}`}
                        onClick={() => handleAdvance(token)}
                        disabled={isLoading}
                        className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors animate-pulse disabled:opacity-50"
                      >
                        <BadgeIndianRupee className="w-4 h-4" />
                        <span>Simulate DBT/UPI Payment</span>
                      </button>
                    )}

                    {token.status === 'Payment Sent' && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Payment Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* QC Modal */}
      {selectedTokenForQC && (
        <QualityCheckModal
          token={selectedTokenForQC}
          isOpen={!!selectedTokenForQC}
          onClose={() => setSelectedTokenForQC(null)}
          onSubmit={handleQCSubmit}
        />
      )}

      {/* Manual Walk-in Modal */}
      <ManualTokenModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
};
