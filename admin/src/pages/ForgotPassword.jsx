import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');
    setResetToken('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgotpassword', { email });
      setStatusMsg(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="crm-card bg-white p-8 sm:p-10 border border-slate-200 rounded-2xl shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src="/logo.webp"
                alt="Sunbird Solar Logo"
                className="h-12 w-auto object-contain max-w-[200px]"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Forgot Password</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Enter your registered admin or staff email address to receive password reset instructions.
            </p>
          </div>

          {statusMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Instructions Dispatched
              </div>
              <p>{statusMsg}</p>
              {resetToken && (
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <p className="font-semibold text-emerald-900 mb-1">Development Notice:</p>
                  <p className="text-[11px] text-emerald-700 break-all mb-2">
                    SMTP is in local simulation mode. Click below to reset directly:
                  </p>
                  <Link
                    to={`/reset-password/${resetToken}`}
                    className="inline-block px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-xs"
                  >
                    Open Reset Password Form →
                  </Link>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {!statusMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="crm-label">Registered Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="admin@sunbirdsolar.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="crm-input crm-input-has-icon-left"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-brand w-full py-2.5 font-bold shadow-md shadow-blue-500/20"
              >
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
