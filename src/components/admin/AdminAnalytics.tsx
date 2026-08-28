import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { MinistryOverview, CenterAnalytics } from '../../types';
import { getFallbackOverview } from '../../utils/clientFallback';
import { 
  BarChart3, 
  Building2, 
  TrendingUp, 
  Clock, 
  BadgeIndianRupee, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  PieChart
} from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const { t, allTokens, centers } = useApp();
  const [overview, setOverview] = useState<MinistryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCenterFilter, setSelectedCenterFilter] = useState('ALL');

  // H-4: Compute directly from live allTokens — no API fetch.
  // In production (Cloudflare Workers static site) there is no /api/analytics/overview
  // endpoint. The Express server is dev-only (H-1). getFallbackOverview is not a
  // fallback — it is the real computation.
  const fetchOverview = useCallback(() => {
    setLoading(true);
    setOverview(getFallbackOverview(allTokens, centers));
    setLoading(false);
  }, [allTokens, centers]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading || !overview) {
    return (
      <div className="py-12 text-center text-xs text-stone-500">
        Loading national mandi telemetry...
      </div>
    );
  }

  const centersToDisplay = selectedCenterFilter === 'ALL'
    ? overview.center_performance
    : overview.center_performance.filter(c => c.center_id === selectedCenterFilter);

  return (
    <div className="py-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
              National e-NAM Dashboard
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.adminTitle}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {t.adminSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCenterFilter}
            onChange={e => setSelectedCenterFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-lg border border-stone-300 bg-white text-stone-800 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Procurement Centers</option>
            {overview.center_performance.map(c => (
              <option key={c.center_id} value={c.center_id}>
                {c.center_name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchOverview}
            className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* National KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">{t.nationalProcurement}</span>
            <Scale className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            {overview.total_procurement_quintals.toLocaleString('en-IN')} <span className="text-xs font-sans font-bold text-stone-500">Qtl</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{overview.total_farmers_served_today} lots processed today</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">{t.totalDisbursedAmount}</span>
            <BadgeIndianRupee className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono">
            ₹{(overview.total_disbursed_inr / 100000).toFixed(2)} <span className="text-xs font-sans font-bold text-stone-500">Lakh</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {allTokens.filter(t => t.status === 'Payment Sent').length} of {allTokens.filter(t => ['Procured', 'Payment Sent'].includes(t.status)).length || 0} DBT Disbursed
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">{t.avgMandiWait}</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            {overview.overall_avg_wait_time_min} <span className="text-xs font-sans font-bold text-stone-500">min</span>
          </div>
          <div className="text-[11px] text-stone-500">
            Down from 4.5 hrs (Paper era)
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">{t.utilizationRate}</span>
            <BarChart3 className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
            {overview.system_efficiency_score}%
          </div>
          <div className="text-[11px] text-stone-500">
            {overview.total_farmers_served_today} Farmers Processed
          </div>
        </div>
      </div>

      {/* Center Comparison Table & Chart Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Center-Wise Breakdown */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-6 space-y-4">
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <span>Center-Wise Operations & Queue Performance</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Center Name</th>
                  <th className="py-2.5 px-3">Volume (Qtl)</th>
                  <th className="py-2.5 px-3">Disbursed (₹)</th>
                  <th className="py-2.5 px-3">Avg. Wait</th>
                  <th className="py-2.5 px-3">No-Show %</th>
                  <th className="py-2.5 px-3">Load %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {centersToDisplay.map(c => (
                  <tr key={c.center_id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-stone-900">
                      {c.center_name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-800">
                      {c.total_quantity_procured} Qtl
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      ₹{c.total_payout_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {Number(c.avg_wait_time_minutes).toFixed(2)} min
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      {c.no_show_rate}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${Math.min(100, c.capacity_utilization)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">{c.capacity_utilization}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Hourly Arrival Velocity Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>
              {selectedCenterFilter === 'ALL' ? "Today's Arrival Load by Hour (All Centers)" : "Today's Arrival Load by Hour"}
            </span>
          </h3>

          <div className="space-y-2 pt-2">
            {(() => {
              const standardHours = ['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'];
              const hourCounts: Record<string, number> = {};
              standardHours.forEach(h => { hourCounts[h] = 0; });
              centersToDisplay.forEach(c => {
                (c.hourly_arrivals || []).forEach(ha => {
                  hourCounts[ha.hour] = (hourCounts[ha.hour] || 0) + ha.count;
                });
              });
              const maxCount = Math.max(1, ...Object.values(hourCounts));
              return standardHours.map(hour => {
                const count = hourCounts[hour] || 0;
                return (
                  <div key={hour} className="space-y-1">
                    <div className="flex justify-between text-xs text-stone-600 font-mono">
                      <span>{hour}</span>
                      <span className="font-bold text-stone-900">{count} lots</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((count / maxCount) * 100))}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
            <span className="font-bold text-stone-800">Peak Window: </span>
            09:00 AM - 11:00 AM slot operates at highest throughput across all districts.
          </div>
        </div>
      </div>
    </div>
  );
};
