import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import {
  Users,
  UserPlus,
  Sun,
  CheckCircle2,
  Clock,
  ThumbsUp,
  FileSpreadsheet,
  Wallet,
  AlertTriangle,
  Award,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live metrics from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (num) => {
    return `₹${Number(num || 0).toLocaleString('en-IN')}`;
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="animate-spin text-blue-600 mb-3" size={32} />
        <p className="text-sm font-semibold">Aggregating live CRM metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={fetchMetrics}
          className="btn-secondary text-xs py-2 px-3.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
        <Link
          to="/leads"
          className="btn-brand text-xs py-2 px-4"
        >
          <UserPlus size={14} /> + New Enquiry
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 1. Lead Pipeline & Conversion Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <UserPlus size={16} className="text-blue-600" /> Lead Pipeline (Initial Enquiries)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Conversion Rate:{' '}
            <strong className="text-blue-600">{data?.leads?.conversionRate || 0}%</strong>
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={data?.leads?.total || 0}
            icon={UserPlus}
            color="blue"
            changeText="All registered enquiries"
          />
          <StatCard
            title="New Leads"
            value={data?.leads?.new || 0}
            icon={Clock}
            color="blue"
            changeText="Awaiting initial contact"
          />
          <StatCard
            title="Follow-Up Leads"
            value={data?.leads?.followUp || 0}
            icon={TrendingUp}
            color="amber"
            changeText="Negotiations in progress"
          />
          <StatCard
            title="Approved Leads"
            value={data?.leads?.approved || 0}
            icon={ThumbsUp}
            color="green"
            changeText="Ready for client conversion"
          />
        </div>
      </div>

      {/* 2. Operations & Project Highlights */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Sun size={16} className="text-amber-500" /> Real Clients & Active Installations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Real Clients"
            value={data?.clients?.total || 0}
            icon={Users}
            color="purple"
            changeText={`Total order book: ${formatCurrency(data?.clients?.totalOrderValue)}`}
          />
          <StatCard
            title="Ongoing Projects"
            value={data?.projects?.ongoing || 0}
            icon={Sun}
            color="amber"
            changeText="Approved / Planning / Installing"
          />
          <StatCard
            title="Completed Projects"
            value={data?.projects?.completed || 0}
            icon={CheckCircle2}
            color="green"
            changeText="Successfully commissioned"
          />
        </div>
      </div>

      {/* 3. Financials, Collections & Commissions */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Wallet size={16} className="text-emerald-600" /> Financial & Payment Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Quotations"
            value={formatCurrency(data?.financials?.totalQuotationAmount)}
            icon={FileSpreadsheet}
            color="blue"
            changeText="Total quote value created"
          />
          <StatCard
            title="Total Advance Received"
            value={formatCurrency(data?.financials?.totalAdvancePayments)}
            icon={Wallet}
            color="green"
            changeText="Initial booking deposits"
          />
          <StatCard
            title="Pending Payment Balance"
            value={formatCurrency(data?.financials?.pendingPaymentBalance)}
            icon={AlertTriangle}
            color="red"
            changeText="Outstanding client dues"
          />
          <StatCard
            title="Commission Summary"
            value={formatCurrency(data?.commissions?.total)}
            icon={Award}
            color="purple"
            changeText={`Paid: ${formatCurrency(data?.commissions?.paid)} | Due: ${formatCurrency(
              data?.commissions?.pending
            )}`}
          />
        </div>
      </div>

      {/* 4. Recent Activity Split Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="crm-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <UserPlus size={16} className="text-blue-600" /> Recent Leads
            </h4>
            <Link
              to="/leads"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>
          {data?.recentActivity?.leads?.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.leads.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{lead.fullName}</p>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {lead.leadNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {lead.place} • {lead.phoneNumber}
                    </p>
                  </div>
                  <Badge status={lead.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No recent leads found.</p>
          )}
        </div>

        {/* Recent Projects */}
        <div className="crm-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sun size={16} className="text-amber-500" /> Active Projects
            </h4>
            <Link
              to="/projects"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>
          {data?.recentActivity?.projects?.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.projects.map((prj) => (
                <div
                  key={prj._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{prj.projectName}</p>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {prj.projectNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {prj.client?.fullName || 'Client'} • {prj.client?.place || 'Site'}
                    </p>
                  </div>
                  <Badge status={prj.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No projects registered yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
