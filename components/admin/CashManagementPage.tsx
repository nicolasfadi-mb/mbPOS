
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { CashBoxEntry, Branch, ShopInfoSettings } from '../../types';
import { formatPrice } from '../../constants';
import CashBoxEntryModal from './CashBoxEntryModal';
import { PencilIcon } from '../icons/PencilIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UploadIcon } from '../icons/UploadIcon';
import CashBoxCorrectionModal from './CashBoxCorrectionModal';
import Modal from '../shared/Modal';
import { HelpCircleIcon } from '../icons/HelpCircleIcon';
import HelpModal from '../shared/HelpModal';

interface CashManagementPageProps {
  cashBoxByBranch: Record<string, CashBoxEntry[]>;
  mainCashBox: CashBoxEntry[];
  branches: Branch[];
  shopInfo: ShopInfoSettings;
  onSaveManualCashBoxEntry: (branchIdOrMain: string, entryData: Partial<CashBoxEntry> & { id?: string }) => void;
  onTransferToMainBox: (fromBranchId: string, amountLBP: number, amountUSD: number, description: string) => void;
  activeBranchId: string | null;
  cashBoxIncomeCategories: string[];
  cashBoxExpenseCategories: string[];
  isCompanyView: boolean;
  pettyCashByBranch: Record<string, { lbp: number, usd: number }>;
  onFundPettyCash: (branchId: string, amountLBP: number, amountUSD: number, memo: string) => void;
}

const FundPettyCashModal: React.FC<{
    onClose: () => void;
    onConfirm: (amountLBP: number, amountUSD: number, memo: string) => void;
    currentBalance: { lbp: number; usd: number };
    shopInfo: ShopInfoSettings;
}> = ({ onClose, onConfirm, currentBalance, shopInfo }) => {
    const [amountLBP, setAmountLBP] = useState(0);
    const [amountUSD, setAmountUSD] = useState(0);
    const [memo, setMemo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amountLBP <= 0 && amountUSD <= 0) {
            alert('Please enter a positive amount to fund.');
            return;
        }
        onConfirm(amountLBP, amountUSD, memo);
        onClose();
    };

    return (
        <Modal title="Transfer to Petty Cash" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-container text-center">
                    <p className="text-sm font-medium text-on-surface-variant">Current Petty Cash Balance</p>
                    <div className="flex items-baseline justify-center gap-4">
                        <p className="text-2xl font-bold text-primary">{formatPrice(currentBalance.lbp, shopInfo.usdToLbpRate).lbp}</p>
                        <p className="text-2xl font-bold text-primary/80">{formatPrice(currentBalance.usd * shopInfo.usdToLbpRate, shopInfo.usdToLbpRate).usd}</p>
                    </div>
                </div>
                <div>
                    <label htmlFor="fund-memo" className="block text-sm font-medium text-on-surface-variant">Memo (Optional)</label>
                    <input type="text" id="fund-memo" value={memo} onChange={e => setMemo(e.target.value)} className="input-field" placeholder="e.g., Start of week funding"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fund-amount-lbp" className="block text-sm font-medium text-on-surface-variant">Amount to Add (LBP)</label>
                        <input type="number" id="fund-amount-lbp" value={amountLBP} onChange={e => setAmountLBP(parseFloat(e.target.value) || 0)} className="input-field" autoFocus/>
                    </div>
                     <div>
                        <label htmlFor="fund-amount-usd" className="block text-sm font-medium text-on-surface-variant">Amount to Add (USD)</label>
                        <input type="number" id="fund-amount-usd" value={amountUSD} onChange={e => setAmountUSD(parseFloat(e.target.value) || 0)} className="input-field"/>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10">Cancel</button>
                    <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90">Confirm Transfer</button>
                </div>
            </form>
        </Modal>
    );
};


const BalanceCard: React.FC<{ title: string; lbp: number; usd: number; rate: number }> = ({ title, lbp, usd, rate }) => {
  const formattedLBP = formatPrice(lbp, rate).lbp;
  const formattedUSD = formatPrice(usd * rate, rate).usd;
  return (
    <div className="bg-surface-container p-4 rounded-xl">
      <h4 className="font-medium text-on-surface-variant">{title}</h4>
      <div className="flex flex-col items-start leading-tight mt-1">
        <span className="text-2xl font-bold text-on-surface">{formattedUSD}</span>
        <span className="text-sm text-on-surface-variant/80 font-medium">{formattedLBP}</span>
      </div>
    </div>
  );
};

const CashManagementPage: React.FC<CashManagementPageProps> = (props) => {
  const [selectedBoxId, setSelectedBoxId] = useState<string>(props.isCompanyView ? 'main' : (props.activeBranchId || 'main'));
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [isCorrectionModalOpen, setCorrectionModalOpen] = useState(false);
  const [isFundingModalOpen, setFundingModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'manual' | 'transfer'>('manual');
  const [entryToEdit, setEntryToEdit] = useState<CashBoxEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.isCompanyView) {
      setSelectedBoxId('main');
    } else {
      setSelectedBoxId(props.activeBranchId || 'main');
    }
  }, [props.isCompanyView, props.activeBranchId]);


  const { entries, name } = useMemo(() => {
    if (selectedBoxId === 'main') {
      return { entries: props.mainCashBox, name: 'Main Company Cash Box' };
    }
    const branch = props.branches.find(b => b.id === selectedBoxId);
    return {
      entries: props.cashBoxByBranch[selectedBoxId] || [],
      name: branch ? `${branch.name} - Branch Cash Box` : 'Branch Cash Box',
    };
  }, [selectedBoxId, props.mainCashBox, props.cashBoxByBranch, props.branches]);

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [entries]);
  
  const balances = useMemo(() => {
    return sortedEntries.reduce(
      (acc, entry) => {
        const lbpChange = entry.type === 'income' ? entry.amountLBP : -entry.amountLBP;
        const usdChange = entry.type === 'income' ? entry.amountUSD : -entry.amountUSD;
        acc.lbp += lbpChange;
        acc.usd += usdChange;
        return acc;
      },
      { lbp: 0, usd: 0 }
    );
  }, [sortedEntries]);

  const handleOpenEntryModal = (mode: 'manual' | 'transfer', entry?: CashBoxEntry | null) => {
    setModalMode(mode);
    setEntryToEdit(entry || null);
    setEntryModalOpen(true);
  };
  
  const handleSaveEntry = (entry: Omit<CashBoxEntry, 'id' | 'date' | 'isManual'> & {id?: string}) => {
    props.onSaveManualCashBoxEntry(selectedBoxId, entry);
    setEntryModalOpen(false);
  };
  
  const handleSaveTransfer = (amountLBP: number, amountUSD: number, description: string) => {
    if (selectedBoxId !== 'main') {
      props.onTransferToMainBox(selectedBoxId, amountLBP, amountUSD, description);
    }
    setEntryModalOpen(false);
  };
  
  const handleSaveCorrection = (correction: Omit<CashBoxEntry, 'id' | 'date' | 'isManual'>) => {
    props.onSaveManualCashBoxEntry(selectedBoxId, correction);
    setCorrectionModalOpen(false);
  };
  
  const handleExportCSV = () => {
    const headers = ['date', 'type', 'category', 'description', 'amountLBP', 'amountUSD', 'invoiceNumber'];
    const csvRows = [
      headers.join(','),
      ...sortedEntries.map(e =>
        [
          e.date,
          e.type,
          `"${e.category.replace(/"/g, '""')}"`,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.amountLBP,
          e.amountUSD,
          e.invoiceNumber || ''
        ].join(',')
      )
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `cashbox_${selectedBoxId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        const lines = text.split('\n').slice(1);
        let addedCount = 0;

        lines.forEach((line, i) => {
          if (!line.trim()) return;
          const values = line.match(/(?:,"|^)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g)?.map(v => v.replace(/^,/, '').replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"')) || [];
          const [date, type, category, description, amountLBP, amountUSD] = values;
          
          if (!type || !category || (amountLBP === undefined && amountUSD === undefined)) {
            console.warn(`Skipping import row ${i+1}: Missing required data.`);
            return;
          }
          
          props.onSaveManualCashBoxEntry(selectedBoxId, {
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            type: type as 'income' | 'expense',
            category,
            description,
            amountLBP: parseFloat(amountLBP) || 0,
            amountUSD: parseFloat(amountUSD) || 0,
          });
          addedCount++;
        });

        alert(`Import Complete: ${addedCount} entries added.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const CsvHelpContent = () => (
      <>
        <h3 className="text-lg font-semibold text-on-surface">How to Import Manual Cash Box Entries via CSV</h3>
        <p className="text-base">Follow these steps to import manual income or expense entries.</p>
        <ol className="list-decimal list-inside space-y-3">
            <li><strong>Download the Template:</strong> Click "Export" to get a CSV of existing entries. You can clear it and use it as a template.</li>
            <li><strong>Open and Edit:</strong> Open the file in a spreadsheet program.</li>
            <li><strong>Fill in Data:</strong> Add entries as new rows, following the guide below.
                <div className="mt-2 p-3 bg-surface-container rounded-lg text-sm">
                    <h4 className="font-semibold mb-2">Column Guide:</h4>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>date</strong> (Optional): ISO 8601 format (e.g., <code>2024-08-15T10:30:00.000Z</code>). Uses current time if blank.</li>
                        <li><strong>type</strong> (Required): Must be either <code>income</code> or <code>expense</code>.</li>
                        <li><strong>category</strong> (Required): Must match a category from Settings.</li>
                        <li><strong>description</strong> (Optional): A note. Use quotes for text with commas.</li>
                        <li><strong>amountLBP</strong> (Required*): Amount in LBP.</li>
                        <li><strong>amountUSD</strong> (Required*): Amount in USD. (*At least one amount must be &gt; 0).</li>
                        <li><strong>invoiceNumber</strong> (Optional): Associated invoice number.</li>
                    </ul>
                </div>
            </li>
            <li><strong>Save and Import:</strong> Save the file, then click "Import" to upload it.</li>
        </ol>
        <h4 className="font-semibold text-on-surface mt-2">Example Row (Expense):</h4>
        <code className="block bg-surface-container p-2 rounded-md text-sm font-mono">,expense,Office Supplies,"Printer paper, new pens",500000,0,</code>
      </>
    );

  let runningBalanceLBP = 0;
  let runningBalanceUSD = 0;
  const entriesWithRunningBalance = [...sortedEntries].reverse().map(entry => {
      const lbpChange = entry.type === 'income' ? entry.amountLBP : -entry.amountLBP;
      const usdChange = entry.type === 'income' ? entry.amountUSD : -entry.amountUSD;
      runningBalanceLBP += lbpChange;
      runningBalanceUSD += usdChange;
      return {...entry, runningBalanceLBP, runningBalanceUSD };
  }).reverse();

  const currentPettyCash = props.pettyCashByBranch[selectedBoxId] || { lbp: 0, usd: 0 };

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          {!props.isCompanyView && (
            <div className="mb-4">
              <label htmlFor="box-selector" className="text-sm font-medium text-on-surface-variant">Viewing Cash Box For:</label>
              <select id="box-selector" value={selectedBoxId} onChange={(e) => setSelectedBoxId(e.target.value)} className="mt-1 input-field max-w-sm">
                <option value="main">Main Company Cash Box</option>
                {props.branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          )}
          <h2 className="text-xl font-medium text-on-surface">{name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
           <button onClick={() => setIsHelpModalOpen(true)} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors" title="CSV Format Help">
              <HelpCircleIcon className="w-5 h-5" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
           <button onClick={handleExportCSV} className="bg-surface-container text-on-surface-variant py-2 px-4 rounded-full font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm"><DownloadIcon className="w-4 h-4"/> Export</button>
           <button onClick={handleImportClick} className="bg-surface-container text-on-surface-variant py-2 px-4 rounded-full font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm"><UploadIcon className="w-4 h-4"/> Import</button>
           <button onClick={() => setCorrectionModalOpen(true)} className="bg-error-container text-on-error-container py-2 px-4 rounded-full font-medium hover:bg-error-container/80 transition-colors text-sm">Make Correction</button>
           <button onClick={() => handleOpenEntryModal('manual')} className="bg-tertiary-container text-on-tertiary-container py-2 px-4 rounded-full font-medium hover:bg-tertiary-container/80 transition-colors text-sm">Add Manual Entry</button>
           {selectedBoxId !== 'main' && (
             <button onClick={() => handleOpenEntryModal('transfer')} className="bg-secondary-container text-on-secondary-container py-2 px-4 rounded-full font-medium hover:bg-secondary-container/80 transition-colors text-sm">Transfer to Main</button>
           )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <BalanceCard title="Current LBP Balance" lbp={balances.lbp} usd={0} rate={props.shopInfo.usdToLbpRate}/>
        <BalanceCard title="Current USD Balance" lbp={0} usd={balances.usd} rate={props.shopInfo.usdToLbpRate}/>
        {selectedBoxId !== 'main' && (
          <div className="bg-surface-container p-4 rounded-xl">
            <h4 className="font-medium text-on-surface-variant">Petty Cash Balance</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-4">
                  <p className="text-2xl font-bold text-on-surface">{formatPrice(currentPettyCash.lbp, props.shopInfo.usdToLbpRate).lbp}</p>
                  <p className="text-xl font-bold text-on-surface/80">{formatPrice(currentPettyCash.usd * props.shopInfo.usdToLbpRate, props.shopInfo.usdToLbpRate).usd}</p>
              </div>
              <button onClick={() => setFundingModalOpen(true)} className="text-sm font-medium bg-secondary-container text-on-secondary-container py-1.5 px-3 rounded-full hover:bg-secondary-container/80">Transfer</button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-outline/20 bg-surface-container">
            <tr>
              <th className="p-3 text-left font-semibold text-on-surface-variant">Date</th>
              <th className="p-3 text-left font-semibold text-on-surface-variant">Category / Description</th>
              <th className="p-3 text-right font-semibold text-on-surface-variant">Income (USD/LBP)</th>
              <th className="p-3 text-right font-semibold text-on-surface-variant">Expense (USD/LBP)</th>
              <th className="p-3 text-right font-semibold text-on-surface-variant">Running Balance (USD/LBP)</th>
              <th className="p-3 text-center font-semibold text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {entriesWithRunningBalance.map((entry) => {
              const incomeLBP = entry.type === 'income' ? entry.amountLBP : 0;
              const incomeUSD = entry.type === 'income' ? entry.amountUSD : 0;
              const expenseLBP = entry.type === 'expense' ? entry.amountLBP : 0;
              const expenseUSD = entry.type === 'expense' ? entry.amountUSD : 0;

              const formattedIncome = formatPrice(incomeLBP + (incomeUSD * props.shopInfo.usdToLbpRate), props.shopInfo.usdToLbpRate);
              const formattedExpense = formatPrice(expenseLBP + (expenseUSD * props.shopInfo.usdToLbpRate), props.shopInfo.usdToLbpRate);
              const formattedBalance = formatPrice(entry.runningBalanceLBP + (entry.runningBalanceUSD * props.shopInfo.usdToLbpRate), props.shopInfo.usdToLbpRate);

              const isCorrection = entry.category === 'Correction';

              return (
              <tr key={entry.id} className={`hover:bg-surface-container-high transition-colors ${isCorrection ? 'text-error' : ''}`}>
                <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleString()}</td>
                <td className="p-3">
                    <p className="font-medium">{entry.category}</p>
                    {entry.description && <p className="text-xs text-on-surface-variant">{entry.description}</p>}
                </td>
                <td className={`p-3 text-right font-mono ${isCorrection ? '' : 'text-green-600'}`}>
                  {entry.type === 'income' && (incomeUSD > 0 || incomeLBP > 0) ? `${formattedIncome.usd} / ${formattedIncome.lbp}`: ''}
                </td>
                <td className="p-3 text-right font-mono">
                  {entry.type === 'expense' && (expenseUSD > 0 || expenseLBP > 0) ? `${formattedExpense.usd} / ${formattedExpense.lbp}` : ''}
                </td>
                <td className="p-3 text-right font-mono font-semibold">{formattedBalance.usd} / {formattedBalance.lbp}</td>
                <td className="p-3 text-center">
                  {entry.isManual && (
                    <button onClick={() => handleOpenEntryModal('manual', entry)} className="text-primary hover:text-primary/80"><PencilIcon className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            )})}
            {entries.length === 0 && (
                <tr><td colSpan={6} className="text-center p-8 text-on-surface-variant">No entries in this cash box yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isEntryModalOpen && (
        <CashBoxEntryModal 
          mode={modalMode}
          entryToEdit={entryToEdit}
          onClose={() => { setEntryModalOpen(false); setEntryToEdit(null); }}
          onSaveManual={handleSaveEntry}
          onSaveTransfer={handleSaveTransfer}
          incomeCategories={props.cashBoxIncomeCategories}
          expenseCategories={props.cashBoxExpenseCategories}
        />
      )}
      {isCorrectionModalOpen && (
        <CashBoxCorrectionModal
          onClose={() => setCorrectionModalOpen(false)}
          onSave={handleSaveCorrection}
        />
      )}
      {isFundingModalOpen && selectedBoxId !== 'main' && (
        <FundPettyCashModal
            onClose={() => setFundingModalOpen(false)}
            onConfirm={(amountLBP, amountUSD, memo) => props.onFundPettyCash(selectedBoxId, amountLBP, amountUSD, memo)}
            currentBalance={currentPettyCash}
            shopInfo={props.shopInfo}
        />
      )}
      {isHelpModalOpen && <HelpModal title="Cash Box Import/Export Help" onClose={() => setIsHelpModalOpen(false)}><CsvHelpContent /></HelpModal>}
    </div>
  );
};

export default CashManagementPage;
