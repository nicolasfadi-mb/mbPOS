import React, { useState } from 'react';
import type { CashBoxEntry } from '../../types';
import Modal from '../shared/Modal';

interface CashBoxCorrectionModalProps {
  onClose: () => void;
  onSave: (entry: Omit<CashBoxEntry, 'id' | 'date' | 'isManual'>) => void;
}

const CashBoxCorrectionModal: React.FC<CashBoxCorrectionModalProps> = ({ onClose, onSave }) => {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [amountLBP, setAmountLBP] = useState(0);
  const [amountUSD, setAmountUSD] = useState(0);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('A reason for the correction is required.');
      return;
    }
    if (amountLBP === 0 && amountUSD === 0) {
      alert('Please enter an amount to correct.');
      return;
    }

    onSave({
      type: adjustmentType === 'increase' ? 'income' : 'expense',
      category: 'Correction',
      description: reason,
      amountLBP,
      amountUSD,
    });
  };

  return (
    <Modal title="Make Cash Box Correction" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Use this to manually adjust the cash box balance. This will create a permanent, highlighted entry in the log.
        </p>

        <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Adjustment Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                className={`w-full py-3 rounded-lg font-semibold ${
                  adjustmentType === 'increase' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                Increase Balance (Income)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                className={`w-full py-3 rounded-lg font-semibold ${
                  adjustmentType === 'decrease' ? 'bg-error text-on-error' : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                Decrease Balance (Expense)
              </button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amountLBP" className="block text-sm font-medium text-on-surface-variant">Amount (LBP)</label>
            <input type="number" id="amountLBP" value={amountLBP} onChange={(e) => setAmountLBP(parseFloat(e.target.value) || 0)} min="0" step="any" className="input-field" />
          </div>
          <div>
            <label htmlFor="amountUSD" className="block text-sm font-medium text-on-surface-variant">Amount (USD)</label>
            <input type="number" id="amountUSD" value={amountUSD} onChange={(e) => setAmountUSD(parseFloat(e.target.value) || 0)} min="0" step="any" className="input-field" />
          </div>
        </div>
        
        <div>
            <label htmlFor="reason" className="block text-sm font-medium text-on-surface-variant">Reason for Correction</label>
            <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="e.g., Correcting yesterday's miscount"
                required
            />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">
            Cancel
          </button>
          <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">
            Save Correction
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CashBoxCorrectionModal;
