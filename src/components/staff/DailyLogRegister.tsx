import React, { useState } from 'react';
import { Token } from '../../types';
import { Download, Search, FileSpreadsheet, CheckCircle2, Clock } from 'lucide-react';

interface DailyLogProps {
  tokens: Token[];
  centerName: string;
}

export const DailyLogRegister: React.FC<DailyLogProps> = ({ tokens, centerName }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = 
      t.token_number.toLowerCase().includes(search.toLowerCase()) ||
      t.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.farmer_phone.includes(search) ||
      t.crop.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = [
      'Token Number',
      'Farmer Name',
      'Phone',
      'Village',
      'Center Name',
      'Crop',
      'Quantity (Quintals)',
      'MSP Rate (INR/Qtl)',
      'Gross Amount (INR)',
      'Status',
      'Quality Grade',
      'Moisture %',
      'Payment Reference',
      'Payment Date',
      'Registered At'
    ];

    const rows = filteredTokens.map(t => [
      t.token_number,
      `"${t.farmer_name}"`,
      t.farmer_phone,
      `"${t.farmer_village}"`,
      `"${t.center_name}"`,
      `"${t.crop}"`,
      t.quantity,
      t.msp_rate,
      t.payment_amount,
      t.status,
      t.quality_check_result?.grade || 'N/A',
      t.quality_check_result?.moisture || 'N/A',
      t.payment_reference || 'Pending',
      t.payment_confirmed_at ? new Date(t.payment_confirmed_at).toLocaleString() : 'N/A',
      new Date(t.created_at).toLocaleString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mandi_Digital_Register_${centerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalQuantity = filteredTokens.reduce((acc, t) => acc + (t.status !== 'Cancelled' ? t.quantity : 0), 0);
  const totalAmount = filteredTokens.reduce((acc, t) => acc + (['Procured', 'Payment Sent'].includes(t.status) ? t.payment_amount : 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-base">
              Daily Digital Procurement Register & Audit Log
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time APMC electronic ledger for {centerName} • Total Lots: {filteredTokens.length}
          </p>
        </div>

        <button
          id="export-csv-btn"
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export APMC Report (CSV)</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-stone-500 block text-[11px]">Filtered Lots</span>
          <span className="text-base font-extrabold text-stone-900 font-mono">{filteredTokens.length}</span>
        </div>
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-stone-500 block text-[11px]">Total Volume</span>
          <span className="text-base font-extrabold text-stone-900 font-mono">{totalQuantity} Quintals</span>
        </div>
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-stone-500 block text-[11px]">Procured Payout</span>
          <span className="text-base font-extrabold text-emerald-800 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span className="text-stone-500 block text-[11px]">DBT Success</span>
          <span className="text-base font-extrabold text-emerald-800 font-mono">
            {filteredTokens.filter(t => t.status === 'Payment Sent').length} Paid
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by token #, farmer name, mobile, crop..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-medium text-stone-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="Registered">Registered</option>
          <option value="In Queue">In Queue</option>
          <option value="Quality Check">Quality Check</option>
          <option value="Procured">Procured</option>
          <option value="Payment Sent">Payment Sent</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Token #</th>
              <th className="py-2.5 px-3">Farmer Details</th>
              <th className="py-2.5 px-3">Crop & Qty</th>
              <th className="py-2.5 px-3">Gross ₹</th>
              <th className="py-2.5 px-3">QC Grade</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Payment Ref</th>
              <th className="py-2.5 px-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/80">
            {filteredTokens.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-stone-500 text-xs">
                  No procurement records matching criteria.
                </td>
              </tr>
            ) : (
              filteredTokens.map(tok => (
                <tr key={tok.token_id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                    {tok.token_number}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-stone-900">{tok.farmer_name}</div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      +91 {tok.farmer_phone} • {tok.farmer_village}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-stone-800">{tok.crop}</div>
                    <div className="text-[11px] font-mono text-stone-500">
                      {tok.quantity} Qtl @ ₹{tok.msp_rate}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                    ₹{tok.payment_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3">
                    {tok.quality_check_result ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {tok.quality_check_result.grade.split(' ')[0]} ({tok.quality_check_result.moisture}%)
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">Pending</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tok.status === 'Payment Sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tok.status === 'Procured'
                          ? 'bg-blue-100 text-blue-800'
                          : tok.status === 'Quality Check'
                          ? 'bg-amber-100 text-amber-800'
                          : tok.status === 'In Queue'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {tok.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                    {tok.payment_reference || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-stone-500 whitespace-nowrap">
                    {new Date(tok.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
