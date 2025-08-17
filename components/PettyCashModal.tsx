

import React, { useState, useMemo } from 'react';
import Modal from './shared/Modal';
import { formatPrice } from '../constants';
import { ShopInfoSettings } from '../types';

interface PettyCashModalProps {
  onClose: () => void;
  onConfirm: (category: string, description: string | undefined, amountLBP: number, amountUSD: number) => void;
  expenseCategories: string[];
  pettyCashBalance: { lbp: number; usd: number };
  shopInfo: ShopInfoSettings;
}

const PettyCashModal: React.FC<PettyCashModalProps> = ({ onClose, onConfirm, expenseCategories, pettyCashBalance, shopInfo }) => {
  const [category, setCategory] = useState(expenseCategories.find(c => c === 'Petty Cash Expense') || expenseCategories[0] || '');
  const [description, setDescription] = useState('');
  const [amountLBP, setAmountLBP] = useState(0);
  const [amountUSD, setAmountUSD] = useState(0);

  const isAmountValid = (amountLBP > 0 || amountUSD > 0) && amountLBP <= pettyCashBalance.lbp && amountUSD <= pettyCashBalance.usd;

  const handleSubmit = () => {
    if (!isAmountValid || !category) {
        alert("Please select a category and enter a valid amount that does not exceed the available petty cash.");
        return;
    }
    onConfirm(category, description.trim() || undefined, amountLBP, amountUSD);
  };
  
  return (
    <Modal title="Log Petty Cash Expense" onClose={onClose} containerClass="max-w-md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-surface-container text-center">
            <p className="text-sm font-medium text-on-surface-variant">Available Petty Cash</p>
            <div className="flex items-baseline justify-center gap-4">
              <p className="text-3xl font-bold text-primary">{formatPrice(pettyCashBalance.lbp, shopInfo.usdToLbpRate).lbp}</p>
              <p className="text-2xl font-bold text-primary/80">{formatPrice(pettyCashBalance.usd * shopInfo.usdToLbpRate, shopInfo.usdToLbpRate).usd}</p>
            </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-on-surface-variant">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="input-field">
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amountLBP" className="block text-sm font-medium text-on-surface-variant">Amount (LBP)</label>
            <input 
              type="number" 
              id="amountLBP" 
              value={amountLBP} 
              onChange={(e) => setAmountLBP(parseFloat(e.target.value) || 0)} 
              min="0" 
              step="any" 
              className="input-field"
              max={pettyCashBalance.lbp}
            />
          </div>
          <div>
            <label htmlFor="amountUSD" className="block text-sm font-medium text-on-surface-variant">Amount (USD)</label>
            <input 
              type="number" 
              id="amountUSD" 
              value={amountUSD} 
              onChange={(e) => setAmountUSD(parseFloat(e.target.value) || 0)} 
              min="0" 
              step="any" 
              className="input-field"
              max={pettyCashBalance.usd}
            />
          </div>
        </div>
        {amountLBP > pettyCashBalance.lbp && <p className="text-xs text-error -mt-2">LBP amount exceeds available petty cash.</p>}
        {amountUSD > pettyCashBalance.usd && <p className="text-xs text-error -mt-2">USD amount exceeds available petty cash.</p>}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-on-surface-variant">Description (Optional)</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} placeholder="e.g., Milk and sugar from the local store"/>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-outline/20 flex justify-end">
        <button
            type="button"
            onClick={handleSubmit}
            disabled={!isAmountValid}
            className="bg-primary text-on-primary py-3 px-8 rounded-full font-bold text-lg hover:bg-primary/90 transition-all duration-300 disabled:bg-on-surface/20 disabled:text-on-surface/50 shadow-lg hover:shadow-xl active:scale-95 transform-gpu"
        >
          Confirm Expense
        </button>
      </div>
    </Modal>
  );
};

export default PettyCashModal;
