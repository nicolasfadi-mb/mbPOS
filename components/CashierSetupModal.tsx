import React, { useState } from 'react';
import type { User, CashierInventory, LbpDenomination, UsdDenomination } from '../types';
import { LBP_DENOMINATIONS, USD_DENOMINATIONS } from '../constants';

interface CashierSetupModalProps {
  user: User;
  onSessionStart: (inventory: CashierInventory) => void;
  onLogout: () => void;
}

const generateInitialInventory = (): CashierInventory => {
    const lbpInventory = LBP_DENOMINATIONS.reduce((acc, note) => {
        acc[note] = 0;
        return acc;
    }, {} as Record<LbpDenomination, number>);

    const usdInventory = USD_DENOMINATIONS.reduce((acc, note) => {
        acc[note] = 0;
        return acc;
    }, {} as Record<UsdDenomination, number>);

    return { LBP: lbpInventory, USD: usdInventory };
};


const CashierSetupModal: React.FC<CashierSetupModalProps> = ({ user, onSessionStart, onLogout }) => {
    const [inventory, setInventory] = useState<CashierInventory>(generateInitialInventory());

    const handleCountChange = (currency: 'LBP' | 'USD', note: LbpDenomination | UsdDenomination, count: string) => {
        const newCount = parseInt(count, 10) || 0;
        setInventory(prev => ({
            ...prev,
            [currency]: {
                ...prev[currency],
                [note]: newCount,
            }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSessionStart(inventory);
    };

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4 animate-fade-in">
             <div className="w-full max-w-2xl bg-surface-container-low rounded-4xl shadow-2xl p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-on-surface">Cashier Setup</h1>
                    <p className="text-on-surface-variant mt-1">Hello, {user.name}. Please enter the starting cash in your drawer.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-8 max-h-[50vh] overflow-y-auto pr-4">
                        {/* LBP Column */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold text-center text-on-surface">LBP Notes</h2>
                            {LBP_DENOMINATIONS.map(note => (
                                <div key={`lbp-${note}`} className="flex items-center gap-4">
                                    <label htmlFor={`lbp-${note}`} className="w-28 text-right font-medium text-on-surface-variant">{note.toLocaleString()} LBP</label>
                                    <input
                                        id={`lbp-${note}`}
                                        type="number"
                                        min="0"
                                        value={inventory.LBP[note]}
                                        onChange={(e) => handleCountChange('LBP', note, e.target.value)}
                                        className="input-field !mt-0 flex-grow"
                                    />
                                </div>
                            ))}
                        </div>

                         {/* USD Column */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold text-center text-on-surface">USD Notes</h2>
                             {USD_DENOMINATIONS.map(note => (
                                <div key={`usd-${note}`} className="flex items-center gap-4">
                                    <label htmlFor={`usd-${note}`} className="w-28 text-right font-medium text-on-surface-variant">${note.toLocaleString()}</label>
                                    <input
                                        id={`usd-${note}`}
                                        type="number"
                                        min="0"
                                        value={inventory.USD[note]}
                                        onChange={(e) => handleCountChange('USD', note, e.target.value)}
                                        className="input-field !mt-0 flex-grow"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-outline/20 flex justify-between items-center">
                        <button type="button" onClick={onLogout} className="font-medium text-sm text-primary hover:underline">
                            Logout
                        </button>
                         <button type="submit" className="bg-primary text-on-primary py-3 px-8 rounded-full font-bold text-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 transform-gpu">
                            Start Session
                        </button>
                    </div>
                </form>
             </div>
        </div>
    )
};

export default CashierSetupModal;
