import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Hash,
  ShieldCheck,
  Send
} from 'lucide-react';
import { updatePayrollStatus, bulkDisbursePayroll } from '../../services/hrService';

export const HRDisburseModal = ({
  isOpen,
  onClose,
  payroll,
  isBulk = false,
  selectedCount = 0,
  totalAmount = 0,
  month,
  year,
  onSuccess
}) => {
  const [paymentMode, setPaymentMode] = useState('neft');
  const [transactionReference, setTransactionReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const emp = payroll?.user || {};
  const amountToDisburse = isBulk
    ? totalAmount
    : Number(payroll?.netSalary || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isBulk) {
        await bulkDisbursePayroll({
          month,
          year,
          paymentMode,
          transactionReference: transactionReference.trim() || undefined,
          paidAt: paidAt ? new Date(paidAt) : new Date()
        });
        setSuccessMessage(`Bulk disbursement completed for all processed records!`);
      } else {
        await updatePayrollStatus(payroll.id, {
          status: 'paid',
          paymentMode,
          transactionReference: transactionReference.trim() || undefined,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          remarks: remarks.trim() || undefined
        });
        setSuccessMessage(`Payment confirmed and marked as Paid!`);
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Disbursement confirmation failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to confirm disbursement.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => !loading && onClose()} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isBulk ? 'Bulk Disburse Monthly Salaries' : 'Disburse & Mark as Paid'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Record bank transfer transaction reference and timestamp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-[#8B1D2C] text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount Overview Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                {isBulk ? `Total Payout (${selectedCount || 'All'} Staff)` : 'Net Payable to Employee'}
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-0.5 block">
                ₹{Math.round(amountToDisburse).toLocaleString()}
              </span>
            </div>

            {!isBulk && emp.firstName && (
              <div className="text-right text-xs">
                <span className="font-bold text-slate-800 block">
                  {emp.firstName} {emp.lastName}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {emp.bankName || 'Bank'} &bull; {emp.bankAccountNumber || '••••4819'}
                </span>
              </div>
            )}
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
              >
                <option value="neft">NEFT / RTGS (Bank Transfer)</option>
                <option value="imps">IMPS Instant Transfer</option>
                <option value="upi">Company UPI / Gateway</option>
                <option value="cheque">Bank Cheque</option>
                <option value="cash">Direct Cash</option>
              </select>
            </div>

            {/* Paid Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Payment Date
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
              />
            </div>
          </div>

          {/* Transaction / UTR Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Bank UTR / Transaction Reference Number
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. HDFC-NEFT-8839201934"
              className="w-full px-3 py-2 text-xs font-mono font-medium bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Disbursement Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. October monthly salary cleared via corporate netbanking"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Payout...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Confirm Payment & Mark Paid</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRDisburseModal;
