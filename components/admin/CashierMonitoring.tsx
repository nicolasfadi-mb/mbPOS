

import React, { useState, useMemo } from 'react';
import type { CashierSession, User, ShopInfoSettings, CashierInventory, OverageEntry, SessionTransaction, BreakdownItem } from '../../types';
import { formatPrice, LBP_DENOMINATIONS, USD_DENOMINATIONS } from '../../constants';
import Modal from '../shared/Modal';

interface CashierMonitoringProps {
    cashierSessions: CashierSession[];
    users: User[];
    shopInfo: ShopInfoSettings;
    pettyCashByBranch: Record<string, { lbp: number; usd: number }>;
}

const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
};


const LiveCashierBalance: React.FC<{ inventory: CashierInventory, rate: number }> = ({ inventory, rate }) => {
    const totalLBP = LBP_DENOMINATIONS.reduce((sum, note) => sum + note * inventory.LBP[note], 0);
    const totalUSD = USD_DENOMINATIONS.reduce((sum, note) => sum + note * inventory.USD[note], 0);
    const totalLBPinUSD = totalLBP / rate;
    const grandTotalUSD = totalUSD + totalLBPinUSD;

    const formattedTotalLBP = formatPrice(totalLBP, rate);
    const formattedTotalUSD = formatPrice(totalUSD * rate, rate);
    const formattedGrandTotal = formatPrice(grandTotalUSD * rate, rate);

    return (
        <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-medium text-on-surface mb-4">Current Cashier Drawer</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-tertiary-container text-on-tertiary-container p-4 rounded-xl">
                    <h4 className="font-semibold">Total LBP</h4>
                    <p className="text-2xl font-bold">{formattedTotalLBP.lbp}</p>
                </div>
                 <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl">
                    <h4 className="font-semibold">Total USD</h4>
                    <p className="text-2xl font-bold">{formattedTotalUSD.usd}</p>
                </div>
                 <div className="bg-primary-container text-on-primary-container p-4 rounded-xl">
                    <h4 className="font-semibold">Grand Total (USD Equiv.)</h4>
                    <p className="text-2xl font-bold">{formattedGrandTotal.usd}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-lg font-medium text-on-surface mb-3 text-center">LBP Notes</h4>
                    <ul className="space-y-2">
                        {LBP_DENOMINATIONS.map(note => (
                            <li key={`lbp-${note}`} className="flex justify-between items-center bg-surface-container p-2 rounded-lg">
                                <span className="font-medium text-on-surface-variant w-28">{note.toLocaleString()} LBP</span>
                                <span className="font-bold text-on-surface text-lg">{inventory.LBP[note]}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-lg font-medium text-on-surface mb-3 text-center">USD Notes</h4>
                    <ul className="space-y-2">
                        {USD_DENOMINATIONS.map(note => (
                            <li key={`usd-${note}`} className="flex justify-between items-center bg-surface-container p-2 rounded-lg">
                                <span className="font-medium text-on-surface-variant w-28">${note}</span>
                                <span className="font-bold text-on-surface text-lg">{inventory.USD[note]}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const OverageLogDisplay: React.FC<{ overageLog: OverageEntry[], rate: number }> = ({ overageLog, rate }) => {
    const totalOverage = overageLog.reduce((sum, entry) => sum + entry.amount, 0);

    return (
        <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-medium text-on-surface mb-4">Session Overage Log</h3>
            <div className="flex justify-between items-center bg-tertiary-container text-on-tertiary-container p-4 rounded-xl mb-4">
                <span className="font-semibold text-lg">Total Overage</span>
                <span className="font-bold text-xl">{formatPrice(totalOverage, rate).lbp}</span>
            </div>
            {overageLog.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {overageLog.map(entry => (
                        <li key={entry.id} className="flex justify-between items-center text-on-surface p-2 bg-surface-container rounded-lg">
                            <div>
                                <span className="font-medium">Invoice: {entry.invoiceNumber}</span>
                                <span className="text-xs text-on-surface-variant ml-2">({new Date(entry.date).toLocaleTimeString()})</span>
                            </div>
                            <span className="font-medium text-primary">{formatPrice(entry.amount, rate).lbp}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-on-surface-variant text-center py-4">No overages logged for this session.</p>
            )}
        </div>
    );
};

const BreakdownDisplay: React.FC<{ title: string, items: BreakdownItem[] }> = ({ title, items }) => (
    <div>
        <h4 className="font-semibold text-lg text-on-surface mb-2">{title}</h4>
        {items.length > 0 ? (
            <ul className="space-y-1">
                {items.map((item, index) => (
                    <li key={index} className="flex justify-between bg-surface-container p-2 rounded-md">
                        <span>{item.count} &times; {item.currency === 'USD' ? `$${item.note}` : `${item.note.toLocaleString()} LBP`}</span>
                    </li>
                ))}
            </ul>
        ) : <p className="text-sm text-on-surface-variant">None</p>}
    </div>
);

const BreakdownModal: React.FC<{transaction: SessionTransaction, onClose: () => void}> = ({ transaction, onClose }) => (
    <Modal title={`Breakdown for ${transaction.invoiceNumber}`} onClose={onClose}>
        <div className="grid grid-cols-2 gap-6">
            <BreakdownDisplay title="Notes Tendered" items={transaction.tenderedNotes} />
            <BreakdownDisplay title="Change Given" items={transaction.changeNotes} />
        </div>
    </Modal>
);

const SessionTransactionLog: React.FC<{ transactions: SessionTransaction[], rate: number }> = ({ transactions, rate }) => {
    const [selectedTransaction, setSelectedTransaction] = useState<SessionTransaction | null>(null);
    return (
        <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-medium text-on-surface mb-4">Session Transaction Log</h3>
            {transactions.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-surface-container-low">
                            <tr>
                                <th className="p-2 text-left font-medium text-on-surface-variant">Invoice #</th>
                                <th className="p-2 text-right font-medium text-on-surface-variant">Total</th>
                                <th className="p-2 text-center font-medium text-on-surface-variant">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline/10">
                            {[...transactions].reverse().map((tx) => (
                                <tr key={tx.invoiceNumber}>
                                    <td className="p-2 font-medium">{tx.invoiceNumber}</td>
                                    <td className="p-2 text-right">{formatPrice(tx.total, rate).lbp}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => setSelectedTransaction(tx)} className="text-primary hover:underline text-xs font-bold">
                                            View Breakdown
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-on-surface-variant text-center py-4">No cash transactions logged for this session.</p>
            )}
            {selectedTransaction && (
                <BreakdownModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
            )}
        </div>
    );
};


const CashierMonitoring: React.FC<CashierMonitoringProps> = ({ cashierSessions, users, shopInfo, pettyCashByBranch }) => {
    const baristas = users.filter(u => u.role === 'barista');
    const [selectedUserId, setSelectedUserId] = useState<string>(baristas[0]?.id || '');

    const selectedSession = useMemo(() => {
        if (!selectedUserId) return null;

        const todaySessions = cashierSessions.filter(s => s.userId === selectedUserId && isToday(s.startTime));
        if (todaySessions.length === 0) return null;
        
        const activeSession = todaySessions.find(s => s.isActive);
        if (activeSession) return activeSession;

        // If no active session, return the most recent one from today
        return todaySessions.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

    }, [selectedUserId, cashierSessions]);

    const pettyCashBalance = selectedSession ? (pettyCashByBranch[selectedSession.branchId] || { lbp: 0, usd: 0 }) : { lbp: 0, usd: 0 };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-on-surface">Live Session Monitor</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="cashier-select" className="text-sm font-medium text-on-surface-variant">Select Cashier:</label>
                    <select
                        id="cashier-select"
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="p-2 border border-outline bg-surface-container-low rounded-lg min-w-[150px]"
                    >
                         <option value="" disabled>Select a barista...</option>
                        {baristas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>
            
            {selectedSession ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8">
                         <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm">
                            <h3 className="text-xl font-medium text-on-surface mb-2">Branch Petty Cash Balance</h3>
                            <div className="flex items-baseline gap-4">
                                <p className="text-3xl font-bold text-secondary">
                                    {formatPrice(pettyCashBalance.lbp, shopInfo.usdToLbpRate).lbp}
                                </p>
                                <p className="text-2xl font-bold text-secondary/80">
                                    {formatPrice(pettyCashBalance.usd * shopInfo.usdToLbpRate, shopInfo.usdToLbpRate).usd}
                                </p>
                            </div>
                        </div>
                        <LiveCashierBalance inventory={selectedSession.currentInventory} rate={shopInfo.usdToLbpRate} />
                        <OverageLogDisplay overageLog={selectedSession.overageLog} rate={shopInfo.usdToLbpRate} />
                    </div>
                     <SessionTransactionLog transactions={selectedSession.transactions} rate={shopInfo.usdToLbpRate} />
                </div>
            ) : (
                <div className="text-center py-16 bg-surface-container-low rounded-2xl">
                    <p className="text-on-surface-variant text-lg">No session data available for the selected barista today.</p>
                </div>
            )}
        </div>
    );
};

        export default CashierMonitoring;
