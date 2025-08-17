import React, { useState, useEffect } from 'react';
import type { CashBoxEntry } from '../../types';
import Modal from '../shared/Modal';

interface CashBoxEntryModalProps {
  mode: 'manual' | 'transfer';
  onClose: () => void;
  onSaveManual: (entry: Partial<CashBoxEntry> & { id?: string }) => void;
  onSaveTransfer: (amountLBP: number, amountUSD: number, description: string) => void;
  incomeCategories: string[];
  expenseCategories: string[];
  entryToEdit?: CashBoxEntry | null;
}

const CashBoxEntryModal: React.FC<CashBoxEntryModalProps> = ({ mode, onClose, onSaveManual, onSaveTransfer, incomeCategories, expenseCategories, entryToEdit }) => {
  const [type, setType] = useState<'income' | 'expense'>(entryToEdit?.type || 'expense');
  const [category, setCategory] = useState(entryToEdit?.category || '');
  const [description, setDescription] = useState(entryToEdit?.description || '');
  const [amountLBP, setAmountLBP] = useState(entryToEdit?.amountLBP || 0);
  const [amountUSD, setAmountUSD] = useState(entryToEdit?.amountUSD || 0);

  useEffect(() => {
    if (entryToEdit) {
      setType(entryToEdit.type);
      setCategory(entryToEdit.category);
      setDescription(entryToEdit.description || '');
      setAmountLBP(entryToEdit.amountLBP);
      setAmountUSD(entryToEdit.amountUSD);
    } else if (mode === 'manual') {
      const defaultCategory = type === 'expense' ? (expenseCategories[0] || '') : (incomeCategories[0] || '');
      setCategory(defaultCategory);
    }
  }, [type, mode, incomeCategories, expenseCategories, entryToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ( (mode === 'manual' && category.trim() === '') || (amountLBP === 0 && amountUSD === 0)) {
        alert("Please select a category and provide at least one amount.");
        return;
    }
     if (mode === 'transfer' && description.trim() === '') {
        alert("Please provide a memo for the transfer.");
        return;
    }

    if (mode === 'manual') {
      onSaveManual({
        id: entryToEdit?.id,
        type,
        category,
        description: description.trim() || undefined,
        amountLBP,
        amountUSD,
      });
    } else { // transfer mode
      onSaveTransfer(amountLBP, amountUSD, description);
    }
  };
  
  const title = entryToEdit ? `Edit Entry` : (mode === 'transfer' ? 'Transfer Cash to Main' : 'Add Manual Entry');

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'manual' && (
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Entry Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`w-full py-3 rounded-lg font-semibold ${
                  type === 'income' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`w-full py-3 rounded-lg font-semibold ${
                  type === 'expense' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                Expense
              </button>
            </div>
          </div>
        )}

        <div>
            <label htmlFor="category" className="block text-sm font-medium text-on-surface-variant">
              {mode === 'transfer' ? 'Memo / Description' : 'Category'}
            </label>
            {mode === 'manual' ? (
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="input-field"
                disabled={entryToEdit?.category === 'Correction'}
              >
                {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                 {entryToEdit?.category === 'Correction' && <option value="Correction">Correction</option>}
              </select>
            ) : (
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="input-field"
                placeholder={'e.g., End of day deposit'}
              />
            )}
        </div>

        {mode === 'manual' && (
           <div>
            <label htmlFor="description" className="block text-sm font-medium text-on-surface-variant">Description (Optional)</label>
            <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Add any extra notes here..."
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amountLBP" className="block text-sm font-medium text-on-surface-variant">
              Amount (LBP)
            </label>
            <input
              type="number"
              id="amountLBP"
              value={amountLBP}
              onChange={(e) => setAmountLBP(parseFloat(e.target.value) || 0)}
              min="0"
              step="any"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="amountUSD" className="block text-sm font-medium text-on-surface-variant">
              Amount (USD)
            </label>
            <input
              type="number"
              id="amountUSD"
              value={amountUSD}
              onChange={(e) => setAmountUSD(parseFloat(e.target.value) || 0)}
              min="0"
              step="any"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">
            Cancel
          </button>
          <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">
            {mode === 'transfer' ? 'Confirm Transfer' : 'Save Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CashBoxEntryModal;