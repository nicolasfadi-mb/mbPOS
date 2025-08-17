import React, { useState, useMemo } from 'react';
import type { Transaction, ShopInfoSettings } from '../../types';
import { formatPrice } from '../../constants';
import { PrinterIcon } from '../icons/PrinterIcon';

interface AccountingPageProps {
  transactions: Transaction[];
  shopInfo: ShopInfoSettings;
}

type AccountingView = 'journal' | 'ledger' | 'vat' | 'trial_balance';
type Account = 'Cash' | 'Card/Bank' | 'Sales Revenue' | 'Rental Revenue' | 'VAT Payable' | 'COGS';

interface JournalEntry {
    date: string;
    invoiceNumber: string;
    account: Account;
    description: string;
    debit: number;
    credit: number;
}

const getMonthDateRange = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0]
    };
};

const AccountingPage: React.FC<AccountingPageProps> = ({ transactions, shopInfo }) => {
    const [view, setView] = useState<AccountingView>('journal');
    const [dateRange, setDateRange] = useState(getMonthDateRange());
    const [selectedAccount, setSelectedAccount] = useState<Account>('Sales Revenue');

    const filteredTransactions = useMemo(() => {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });
    }, [transactions, dateRange]);
    
    const journalEntries = useMemo((): JournalEntry[] => {
        const entries: JournalEntry[] = [];
        filteredTransactions.forEach(t => {
            const paymentAccount = t.paymentMethod === 'cash' ? 'Cash' : 'Card/Bank';
            const salesRevenue = t.subtotal;
            const rentalRevenue = t.rentalCharge || 0;
            const cogs = t.costOfGoodsSold || 0;
            const vat = t.tax;
            const total = t.total;

            // Record sale
            entries.push({ date: t.date, invoiceNumber: t.invoiceNumber, account: paymentAccount, description: `Sale - Inv ${t.invoiceNumber}`, debit: total, credit: 0 });
            entries.push({ date: t.date, invoiceNumber: t.invoiceNumber, account: 'Sales Revenue', description: `Product Sales - Inv ${t.invoiceNumber}`, debit: 0, credit: salesRevenue });
            if (rentalRevenue > 0) {
                 entries.push({ date: t.date, invoiceNumber: t.invoiceNumber, account: 'Rental Revenue', description: `Room Rent - Inv ${t.invoiceNumber}`, debit: 0, credit: rentalRevenue });
            }
            entries.push({ date: t.date, invoiceNumber: t.invoiceNumber, account: 'VAT Payable', description: `VAT on Sale - Inv ${t.invoiceNumber}`, debit: 0, credit: vat });
            
            // Record cost of sale
            if (cogs > 0) {
                entries.push({ date: t.date, invoiceNumber: t.invoiceNumber, account: 'COGS', description: `Cost for Inv ${t.invoiceNumber}`, debit: cogs, credit: 0 });
            }
        });
        return entries;
    }, [filteredTransactions]);

    const accountBalances = useMemo(() => {
        const balances: Record<Account, { debit: number, credit: number }> = {
            'Cash': { debit: 0, credit: 0 },
            'Card/Bank': { debit: 0, credit: 0 },
            'Sales Revenue': { debit: 0, credit: 0 },
            'Rental Revenue': { debit: 0, credit: 0 },
            'VAT Payable': { debit: 0, credit: 0 },
            'COGS': { debit: 0, credit: 0 },
        };
        journalEntries.forEach(entry => {
            balances[entry.account].debit += entry.debit;
            balances[entry.account].credit += entry.credit;
        });
        return balances;
    }, [journalEntries]);

    const handlePrint = () => {
        window.print();
    }
    
    const renderView = () => {
        switch (view) {
            case 'journal': return <JournalView entries={journalEntries} rate={shopInfo.usdToLbpRate} />;
            case 'ledger': return <LedgerView allEntries={journalEntries} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} rate={shopInfo.usdToLbpRate}/>;
            case 'vat': return <VatView balances={accountBalances} rate={shopInfo.usdToLbpRate}/>;
            case 'trial_balance': return <TrialBalanceView balances={accountBalances} rate={shopInfo.usdToLbpRate}/>;
            default: return null;
        }
    };

    const ViewButton = ({ v, label }: { v: AccountingView, label: string }) => (
        <button
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${view === v ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high'}`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div id="accounting-report">
                <div className="flex justify-between items-center mb-4 no-print">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">From:</label>
                      <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="p-2 border border-outline bg-surface-container-low rounded-lg text-sm"/>
                      <label className="text-sm font-medium">To:</label>
                      <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="p-2 border border-outline bg-surface-container-low rounded-lg text-sm"/>
                    </div>
                    <button onClick={handlePrint} className="bg-secondary-container text-on-secondary-container py-2 px-4 rounded-full font-medium hover:bg-secondary-container/80 transition-colors flex items-center gap-2 shadow-sm text-sm">
                        <PrinterIcon className="w-4 h-4" />
                        Print
                    </button>
                </div>

                <div className="text-center mb-4 print:block hidden">
                    <h1 className="text-2xl font-bold">{shopInfo.shopName}</h1>
                    <h2 className="text-xl font-semibold">Accounting Report: {view.replace('_', ' ').toUpperCase()}</h2>
                    <p className="text-lg">For Period: {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2 mb-4 no-print p-2 bg-surface-container rounded-full">
                    <ViewButton v="journal" label="Journal" />
                    <ViewButton v="ledger" label="Ledger" />
                    <ViewButton v="vat" label="VAT" />
                    <ViewButton v="trial_balance" label="Trial Balance" />
                </div>

                {renderView()}
            </div>
        </div>
    );
};

const JournalView: React.FC<{entries: JournalEntry[], rate: number}> = ({ entries, rate }) => (
    <div className="overflow-x-auto bg-surface-container-low rounded-xl">
        <table className="min-w-full text-sm">
            <thead className="border-b border-outline/20">
                <tr>
                    <th className="p-3 text-left font-medium text-on-surface-variant">Date</th>
                    <th className="p-3 text-left font-medium text-on-surface-variant">Account</th>
                    <th className="p-3 text-left font-medium text-on-surface-variant">Description</th>
                    <th className="p-3 text-right font-medium text-on-surface-variant">Debit (USD/LBP)</th>
                    <th className="p-3 text-right font-medium text-on-surface-variant">Credit (USD/LBP)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
                {entries.map((entry, i) => {
                    const debit = formatPrice(entry.debit, rate);
                    const credit = formatPrice(entry.credit, rate);
                    return (
                        <tr key={i}>
                            <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="p-3 font-medium">{entry.account}</td>
                            <td className="p-3 text-on-surface-variant">{entry.description}</td>
                            <td className="p-3 text-right font-mono">{entry.debit > 0 ? `${debit.usd} / ${debit.lbp}` : ''}</td>
                            <td className="p-3 text-right font-mono">{entry.credit > 0 ? `${credit.usd} / ${credit.lbp}` : ''}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
);

const LedgerView: React.FC<{allEntries: JournalEntry[], selectedAccount: Account, setSelectedAccount: (a: Account) => void, rate:number}> = ({allEntries, selectedAccount, setSelectedAccount, rate}) => {
    const accounts: Account[] = ['Cash', 'Card/Bank', 'Sales Revenue', 'Rental Revenue', 'VAT Payable', 'COGS'];
    
    const entries = allEntries.filter(e => e.account === selectedAccount);
    let balance = 0;

    return (
        <div>
            <div className="mb-4 no-print">
                <label htmlFor="account-select" className="text-sm font-medium text-on-surface-variant mr-2">Select Account:</label>
                <select id="account-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value as Account)} className="p-2 border border-outline bg-surface-container-low rounded-lg">
                    {accounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                </select>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-center">{selectedAccount} - General Ledger</h3>
            <div className="overflow-x-auto bg-surface-container-low rounded-xl">
                 <table className="min-w-full text-sm">
                    <thead className="border-b border-outline/20">
                        <tr>
                            <th className="p-3 text-left font-medium text-on-surface-variant">Date</th>
                            <th className="p-3 text-left font-medium text-on-surface-variant">Description</th>
                            <th className="p-3 text-right font-medium text-on-surface-variant">Debit (USD/LBP)</th>
                            <th className="p-3 text-right font-medium text-on-surface-variant">Credit (USD/LBP)</th>
                            <th className="p-3 text-right font-medium text-on-surface-variant">Balance (USD/LBP)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                        {entries.map((entry, i) => {
                            const change = entry.debit - entry.credit;
                            balance += change;
                            const debit = formatPrice(entry.debit, rate);
                            const credit = formatPrice(entry.credit, rate);
                            const currentBalance = formatPrice(balance, rate);
                            return (
                                <tr key={i}>
                                    <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-on-surface-variant">{entry.description}</td>
                                    <td className="p-3 text-right font-mono">{entry.debit > 0 ? `${debit.usd} / ${debit.lbp}` : ''}</td>
                                    <td className="p-3 text-right font-mono">{entry.credit > 0 ? `${credit.usd} / ${credit.lbp}` : ''}</td>
                                    <td className="p-3 text-right font-mono font-semibold">{`${currentBalance.usd} / ${currentBalance.lbp}`}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                 </table>
            </div>
        </div>
    )
};

const VatView: React.FC<{balances: Record<Account, {debit: number, credit: number}>, rate: number}> = ({ balances, rate }) => {
    const totalSales = balances['Sales Revenue'].credit + balances['Rental Revenue'].credit;
    const totalVat = balances['VAT Payable'].credit;
    const formattedSales = formatPrice(totalSales, rate);
    const formattedVat = formatPrice(totalVat, rate);
    return (
        <div className="bg-surface-container-low rounded-xl p-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">VAT Declaration Summary</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-on-surface-variant">Total Taxable Sales (Excl. VAT):</span>
                    <span className="font-semibold text-on-surface">{formattedSales.usd} / {formattedSales.lbp}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-on-surface-variant">VAT Rate:</span>
                    <span className="font-semibold text-on-surface">11%</span>
                </div>
                 <div className="flex justify-between items-center border-t border-outline pt-3 mt-3">
                    <span className="font-bold text-lg text-primary">Total VAT Payable:</span>
                    <span className="font-bold text-lg text-primary">{formattedVat.usd} / {formattedVat.lbp}</span>
                </div>
            </div>
        </div>
    )
}

const TrialBalanceView: React.FC<{balances: Record<Account, {debit: number, credit: number}>, rate: number}> = ({ balances, rate }) => {
    let totalDebit = 0;
    let totalCredit = 0;
    return (
        <div className="overflow-x-auto bg-surface-container-low rounded-xl">
             <table className="min-w-full text-sm">
                <thead className="border-b border-outline/20">
                    <tr>
                        <th className="p-3 text-left font-medium text-on-surface-variant">Account</th>
                        <th className="p-3 text-right font-medium text-on-surface-variant">Debit (USD/LBP)</th>
                        <th className="p-3 text-right font-medium text-on-surface-variant">Credit (USD/LBP)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                    {Object.entries(balances).map(([account, balance]) => {
                        const finalBalance = balance.debit - balance.credit;
                        const debit = finalBalance > 0 ? finalBalance : 0;
                        const credit = finalBalance < 0 ? -finalBalance : 0;
                        totalDebit += debit;
                        totalCredit += credit;
                        const formattedDebit = formatPrice(debit, rate);
                        const formattedCredit = formatPrice(credit, rate);
                        return (
                            <tr key={account}>
                                <td className="p-3 font-medium">{account}</td>
                                <td className="p-3 text-right font-mono">{debit > 0 ? `${formattedDebit.usd} / ${formattedDebit.lbp}` : ''}</td>
                                <td className="p-3 text-right font-mono">{credit > 0 ? `${formattedCredit.usd} / ${formattedCredit.lbp}` : ''}</td>
                            </tr>
                        )
                    })}
                </tbody>
                <tfoot className="border-t-2 border-outline">
                    <tr className="font-bold">
                        <td className="p-3">Totals</td>
                        <td className="p-3 text-right font-mono">{formatPrice(totalDebit, rate).usd} / {formatPrice(totalDebit, rate).lbp}</td>
                        <td className="p-3 text-right font-mono">{formatPrice(totalCredit, rate).usd} / {formatPrice(totalCredit, rate).lbp}</td>
                    </tr>
                </tfoot>
             </table>
        </div>
    )
}


export default AccountingPage;