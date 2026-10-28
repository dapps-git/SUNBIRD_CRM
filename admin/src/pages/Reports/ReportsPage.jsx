import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import {
  BarChart3,
  Download,
  Users,
  Sun,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Award,
} from 'lucide-react';

const ReportsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const handleDownloadReport = async (endpoint, filename) => {
    try {
      const response = await api.get(`/reports/export/${endpoint}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type:
          response.headers['content-type'] ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download Excel report');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="text-center py-20 text-slate-400">
        <RefreshCw className="animate-spin inline-block mb-3 text-blue-600" size={32} />
        <p className="text-sm font-semibold">Generating live CRM reports...</p>
      </div>
    );
  }

  const leadsSummary = metrics?.leadsSummary || {};
  const financialSummary = metrics?.financialSummary || {};
  const projectSummary = metrics?.projectSummary || {};

  return (
    <div className="space-y-8">
      {/* Top Action */}
      <div className="flex justify-end items-center">
        <button onClick={fetchMetrics} className="btn-secondary text-xs sm:text-sm px-3.5 py-2">
          <RefreshCw size={15} />
          Refresh Live Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Conversion Efficiency"
          value={`${leadsSummary.conversionRate || 0}%`}
          subtitle={`${leadsSummary.convertedLeads || 0} of ${leadsSummary.totalLeads || 0} Leads`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Completed Solar Projects"
          value={projectSummary.completedProjects || 0}
          subtitle={`${projectSummary.ongoingProjects || 0} in active execution`}
          icon={Sun}
          color="info"
        />
        <StatCard
          title="Collections Received"
          value={formatCurrency(financialSummary.totalPaymentsReceived)}
          subtitle={`Advance: ${formatCurrency(financialSummary.totalAdvancePayments)}`}
          icon={Wallet}
          color="brand"
        />
        <StatCard
          title="Pending Receivables"
          value={formatCurrency(financialSummary.totalClientPendingBalance)}
          subtitle="Remaining customer dues"
          icon={FileSpreadsheet}
          color="warning"
        />
      </div>

      {/* Lead Conversion Funnel & Project Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="crm-card space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Lead Pipeline Funnel</h3>
            <span className="text-xs font-semibold text-slate-400">Total: {leadsSummary.totalLeads || 0}</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>1. New Incoming Enquiries</span>
                <span>{leadsSummary.newLeads || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${((leadsSummary.newLeads || 0) / (leadsSummary.totalLeads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>2. Follow-Up & Site Inspection</span>
                <span>{leadsSummary.followUpLeads || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{
                    width: `${((leadsSummary.followUpLeads || 0) / (leadsSummary.totalLeads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>3. Work Approved by Customer</span>
                <span>{leadsSummary.approvedLeads || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${((leadsSummary.approvedLeads || 0) / (leadsSummary.totalLeads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>4. Converted to Real Client File</span>
                <span>{leadsSummary.convertedLeads || 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{
                    width: `${((leadsSummary.convertedLeads || 0) / (leadsSummary.totalLeads || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Card */}
        <div className="crm-card space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Financial Health & Revenue</h3>
            <span className="text-xs font-semibold text-emerald-600">Active Ledger</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-medium">Total Quotation Value Quoted</span>
              <span className="font-bold text-slate-800">{formatCurrency(financialSummary.totalQuotationAmount)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-blue-50/60 border border-blue-100">
              <span className="text-blue-700 font-medium">Accepted Contract Values</span>
              <span className="font-bold text-blue-900">{formatCurrency(financialSummary.totalFinalProjectValues)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="text-emerald-700 font-medium">Total Collections Received</span>
              <span className="font-bold text-emerald-900">{formatCurrency(financialSummary.totalPaymentsReceived)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-rose-50/60 border border-rose-100">
              <span className="text-rose-700 font-medium">Outstanding Balances from Clients</span>
              <span className="font-bold text-rose-900">{formatCurrency(financialSummary.totalClientPendingBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* One-Click Excel Export Section */}
      <div className="crm-card space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Download Data Exports (Excel / CSV)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export structured records directly for audits, accounting, and government subsidy filings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleDownloadReport('leads', 'Sunbird_Leads_Report.xlsx')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition bg-white text-left flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-800 text-sm">All Leads Register</div>
              <div className="text-xs text-slate-400 mt-0.5">Inquiries, status, GPS links</div>
            </div>
            <Download size={18} className="text-blue-600 shrink-0" />
          </button>

          <button
            onClick={() => handleDownloadReport('clients', 'Sunbird_Clients_Report.xlsx')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition bg-white text-left flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-800 text-sm">Real Clients Register</div>
              <div className="text-xs text-slate-400 mt-0.5">Pricing, KYC, balances</div>
            </div>
            <Download size={18} className="text-blue-600 shrink-0" />
          </button>

          <button
            onClick={() => handleDownloadReport('payments', 'Sunbird_Payments_Report.xlsx')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition bg-white text-left flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-800 text-sm">Payment Receipts Ledger</div>
              <div className="text-xs text-slate-400 mt-0.5">Collections, UTRs, dates</div>
            </div>
            <Download size={18} className="text-blue-600 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
