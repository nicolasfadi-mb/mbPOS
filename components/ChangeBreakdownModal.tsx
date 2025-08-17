import React, { useState, useMemo } from 'react';
import type { CashierInventory, ShopInfoSettings, BreakdownItem, LbpDenomination, UsdDenomination } from '../types';
import { LBP_DENOMINATIONS, USD_DENOMINATIONS, formatPrice } from '../constants';
import Modal from './shared/Modal';

interface ChangeBreakdownModalProps {
  onClose: () => void;
  onConfirm: (noteToRemove: BreakdownItem, notesToAdd: BreakdownItem[]) => void;
  inventory: CashierInventory;
  shopInfo: ShopInfoSettings;
}

const getValueLBP = (item: BreakdownItem, rate: number): number => {
    return (item.currency === 'USD' ? item.note * rate : item.note) * item.count;
};

const ChangeBreakdownModal: React.FC<ChangeBreakdownModalProps> = ({ onClose, onConfirm, inventory, shopInfo }) => {
  const [noteToChange, setNoteToChange] = useState<BreakdownItem | null>(null);
  const [notesReceived, setNotesReceived] = useState<BreakdownItem[]>([]);

  const valueToMatchLBP = useMemo(() => {
    if (!noteToChange) return 0;
    return getValueLBP(noteToChange, shopInfo.usdToLbpRate);
  }, [noteToChange, shopInfo.usdToLbpRate]);

  const receivedValueLBP = useMemo(() => {
    return notesReceived.reduce((sum, item) => sum + getValueLBP(item, shopInfo.usdToLbpRate), 0);
  }, [notesReceived, shopInfo.usdToLbpRate]);

  const difference = valueToMatchLBP - receivedValueLBP;
  const isComplete = difference === 0 && valueToMatchLBP > 0;

  const handleNoteSelect = (note: UsdDenomination | LbpDenomination, currency: 'USD' | 'LBP') => {
    setNoteToChange({ note, currency, count: 1 });
    setNotesReceived([]);
  };

  const handleReceivedChange = (note: UsdDenomination | LbpDenomination, currency: 'USD' | 'LBP', change: number) => {
    setNotesReceived(prev => {
      const existing = prev.find(item => item.note === note && item.currency === currency);
      let newItems = [...prev];
      if (existing) {
        existing.count += change;
        if (existing.count <= 0) {
          newItems = newItems.filter(item => !(item.note === note && item.currency === currency));
        }
      } else if (change > 0) {
        newItems.push({ note, currency, count: 1 });
      }
      return newItems.sort((a,b) => (b.currency === 'USD' ? b.note * shopInfo.usdToLbpRate : b.note) - (a.currency === 'USD' ? a.note * shopInfo.usdToLbpRate : a.note));
    });
  };
  
  const handleReset = () => {
      setNoteToChange(null);
      setNotesReceived([]);
  };

  const handleSubmit = () => {
    if (isComplete && noteToChange) {
      onConfirm(noteToChange, notesReceived);
    }
  };
  
  const NoteButton: React.FC<{note: number, currency: 'LBP'|'USD', disabled?: boolean, selected?: boolean, onClick: () => void}> = ({note, currency, disabled, selected, onClick}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-3 w-full rounded-xl transition font-semibold text-lg
            ${selected ? 'bg-primary text-on-primary ring-2 ring-primary-container' : 'bg-surface-container text-on-surface-variant'}
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-surface-container-high active:scale-95'}
        `}
    >
        {currency === 'USD' ? `$${note}` : note.toLocaleString()}
    </button>
  );

  const filterAvailableDenominations = (denominations: (UsdDenomination | LbpDenomination)[], currency: 'USD' | 'LBP') => {
      if (!noteToChange) return [];
      const noteValueLBP = noteToChange.currency === 'USD' ? noteToChange.note * shopInfo.usdToLbpRate : noteToChange.note;
      return denominations.filter(d => (currency === 'USD' ? d * shopInfo.usdToLbpRate : d) < noteValueLBP);
  };
  
  return (
    <Modal title="Break Change" onClose={onClose} containerClass="max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Select Note to Break */}
        <div className="bg-surface-container-low p-4 rounded-2xl">
            <h3 className="text-xl font-semibold text-on-surface text-center mb-4">1. Select Note to Break</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="font-bold text-center mb-2">USD</h4>
                    <div className="space-y-2">
                        {USD_DENOMINATIONS.map(note => (
                            <NoteButton 
                                key={`usd-select-${note}`} note={note} currency="USD"
                                onClick={() => handleNoteSelect(note, 'USD')}
                                disabled={inventory.USD[note] <= 0}
                                selected={noteToChange?.currency === 'USD' && noteToChange?.note === note}
                            />
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-center mb-2">LBP</h4>
                    <div className="space-y-2">
                         {LBP_DENOMINATIONS.map(note => (
                            <NoteButton 
                                key={`lbp-select-${note}`} note={note} currency="LBP"
                                onClick={() => handleNoteSelect(note, 'LBP')}
                                disabled={inventory.LBP[note] <= 0}
                                selected={noteToChange?.currency === 'LBP' && noteToChange?.note === note}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
        {/* Right Column: Received Notes */}
        <div className="bg-surface-container-low p-4 rounded-2xl">
            <h3 className={`text-xl font-semibold text-on-surface text-center mb-4 transition-opacity ${noteToChange ? 'opacity-100' : 'opacity-30'}`}>2. Enter Notes Received</h3>
             {noteToChange && (
                 <div className="animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <h4 className="font-bold text-center mb-2">USD</h4>
                             {filterAvailableDenominations(USD_DENOMINATIONS, 'USD').map(note => {
                                const count = notesReceived.find(i => i.currency === 'USD' && i.note === note)?.count || 0;
                                return (
                                    <div key={`usd-receive-${note}`} className="flex items-center gap-2 mb-2">
                                        <span className="w-16 text-right font-medium text-on-surface-variant">${note}</span>
                                        <button onClick={() => handleReceivedChange(note, 'USD', -1)} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition active:scale-90">-</button>
                                        <span className="w-10 text-center font-bold text-lg">{count}</span>
                                        <button onClick={() => handleReceivedChange(note, 'USD', 1)} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition active:scale-90">+</button>
                                    </div>
                                )
                             })}
                        </div>
                         <div>
                             <h4 className="font-bold text-center mb-2">LBP</h4>
                              {filterAvailableDenominations(LBP_DENOMINATIONS, 'LBP').map(note => {
                                const count = notesReceived.find(i => i.currency === 'LBP' && i.note === note)?.count || 0;
                                return (
                                    <div key={`lbp-receive-${note}`} className="flex items-center gap-2 mb-2">
                                        <span className="w-16 text-right font-medium text-on-surface-variant">{note.toLocaleString()}</span>
                                        <button onClick={() => handleReceivedChange(note, 'LBP', -1)} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition active:scale-90">-</button>
                                        <span className="w-10 text-center font-bold text-lg">{count}</span>
                                        <button onClick={() => handleReceivedChange(note, 'LBP', 1)} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition active:scale-90">+</button>
                                    </div>
                                )
                             })}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      {/* Footer / Summary */}
      <div className="mt-6 pt-6 border-t border-outline/20">
            {noteToChange && (
                 <div className="grid grid-cols-3 gap-4 text-center animate-fade-in">
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant">Value to Match</p>
                        <p className="text-2xl font-bold text-primary">{formatPrice(valueToMatchLBP, shopInfo.usdToLbpRate).lbp}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-on-surface-variant">Received Total</p>
                        <p className={`text-2xl font-bold transition-colors ${difference !== 0 ? 'text-error' : 'text-green-600'}`}>
                            {formatPrice(receivedValueLBP, shopInfo.usdToLbpRate).lbp}
                        </p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-on-surface-variant">Difference</p>
                        <p className={`text-2xl font-bold transition-colors ${difference !== 0 ? 'text-error' : 'text-green-600'}`}>
                            {formatPrice(difference, shopInfo.usdToLbpRate).lbp}
                        </p>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mt-6">
                <button type="button" onClick={handleReset} className="py-2 px-4 rounded-full font-medium text-error hover:bg-error/10 transition-colors">Reset</button>
                <button type="button" onClick={handleSubmit} disabled={!isComplete} className="bg-primary text-on-primary py-3 px-8 rounded-full font-bold text-lg hover:bg-primary/90 transition-all duration-300 disabled:bg-on-surface/20 disabled:text-on-surface/50 shadow-lg hover:shadow-xl active:scale-95 transform-gpu">Confirm Breakdown</button>
            </div>
      </div>
    </Modal>
  );
};

export default ChangeBreakdownModal;
