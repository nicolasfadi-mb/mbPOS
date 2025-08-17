import React, { useState, useEffect, useMemo } from 'react';
import { CoffeeIcon } from './icons/CoffeeIcon';
import type { OrderItem, PaymentMethod, Transaction, Reservation, ShopInfoSettings, CashierInventory, LbpDenomination, UsdDenomination, OverageEntry, BreakdownItem, SessionTransaction } from '../types';
import { TAX_RATE, formatPrice, LBP_DENOMINATIONS, USD_DENOMINATIONS } from '../constants';
import Invoice from './Invoice';
import { PrinterIcon } from './icons/PrinterIcon';
import Modal from './shared/Modal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { RefreshCcw } from 'lucide-react';

interface CheckoutModalProps {
  items: OrderItem[];
  lastTransaction: Transaction | null;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: PaymentMethod, cashDetails?: { amount: number, currency: 'USD' | 'LBP', changeGiven: number }) => void;
  activeReservation: Reservation | null;
  rentalCharge: number;
  shopInfo: ShopInfoSettings;
  cashierInventory: CashierInventory;
  onInventoryUpdate: (inventory: CashierInventory) => void;
  onOverage: (overageEntry: OverageEntry) => void;
  onCashTransactionComplete: (details: SessionTransaction) => void;
}

type View = 'payment' | 'cashTendered' | 'processing' | 'change' | 'success';

const calculateChangeBreakdown = (
  changeToMakeLBP: number,
  inventory: CashierInventory,
  usdToLbpRate: number
): BreakdownItem[] => {
  let remaining = changeToMakeLBP;
  const breakdown: BreakdownItem[] = [];
  const availableInventory = JSON.parse(JSON.stringify(inventory)); // Deep copy

  const allNotes = [
    ...USD_DENOMINATIONS.map(n => ({ note: n as UsdDenomination, currency: 'USD' as 'USD', valueLBP: n * usdToLbpRate })),
    ...LBP_DENOMINATIONS.map(n => ({ note: n as LbpDenomination, currency: 'LBP' as 'LBP', valueLBP: n }))
  ].sort((a, b) => b.valueLBP - a.valueLBP);

  for (const { note, currency, valueLBP } of allNotes) {
    if (remaining < valueLBP - 500) continue; // Allow for small rounding errors

    const availableCount = availableInventory[currency][note as any];
    if (availableCount === 0) continue;
    
    const countNeeded = Math.floor(remaining / valueLBP);
    const countToGive = Math.min(countNeeded, availableCount);
    
    if (countToGive > 0) {
      breakdown.push({ note, currency, count: countToGive });
      remaining -= countToGive * valueLBP;
      availableInventory[currency][note as any] -= countToGive;
    }
  }
  return breakdown;
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ items, lastTransaction, onClose, onPaymentSuccess, activeReservation, rentalCharge, shopInfo, cashierInventory, onInventoryUpdate, onOverage, onCashTransactionComplete }) => {
  const [view, setView] = useState<View>('payment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tenderedNotes, setTenderedNotes] = useState<BreakdownItem[]>([]);
  const [changeNotes, setChangeNotes] = useState<BreakdownItem[]>([]);
  
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const totalLBP = Math.round(subtotal + tax + rentalCharge);
  
  const { usd: totalUSDStr, lbp: totalLBPStr } = formatPrice(totalLBP, shopInfo.usdToLbpRate);
  
  const handlePayment = (method: PaymentMethod, localTenderedNotes?: BreakdownItem[]) => {
    setPaymentMethod(method);

    if (method === 'card') {
      onPaymentSuccess('card');
      setView('processing');
      return;
    }

    if (method === 'cash' && localTenderedNotes) {
      setTenderedNotes(localTenderedNotes);
      const newInventory = JSON.parse(JSON.stringify(cashierInventory));
      let amountPaidLBP = 0;
      
      localTenderedNotes.forEach(item => {
        newInventory[item.currency][item.note as any] += item.count;
        amountPaidLBP += (item.currency === 'USD' ? item.note * shopInfo.usdToLbpRate : item.note) * item.count;
      });

      onInventoryUpdate(newInventory);
      
      const changeGiven = amountPaidLBP - totalLBP;

      onPaymentSuccess('cash', {
        amount: amountPaidLBP, // This is not ideal, but API expects a single currency.
        currency: 'LBP',
        changeGiven,
      });
      setView('processing');
    }
  };

  useEffect(() => {
    if (view === 'processing' && lastTransaction) {
      if (paymentMethod === 'cash') {
        if (lastTransaction.changeGiven > 500) { // Give a small tolerance
            setView('change');
        } else {
            onCashTransactionComplete({
                invoiceNumber: lastTransaction.invoiceNumber,
                total: lastTransaction.total,
                tenderedNotes: tenderedNotes,
                changeNotes: [],
            });
            handleGoToSuccess();
        }
      } else { // Card payment
        handleGoToSuccess();
      }
    }
  }, [view, lastTransaction, paymentMethod, tenderedNotes, onCashTransactionComplete]);
  
  const handleFinish = () => {
    onClose();
  };

  const handleGoToSuccess = () => {
    setView('success');
  };

  const handleOverage = (amount: number) => {
    if (!lastTransaction) return;
    const newOverageEntry: OverageEntry = {
        id: `ovr_${Date.now()}`,
        date: new Date().toISOString(),
        amount: amount,
        invoiceNumber: lastTransaction.invoiceNumber,
    };
    onOverage(newOverageEntry);
  };
  
  const handlePrint = () => {
      window.print();
  }

  const onCompleteChange = (givenChangeNotes: BreakdownItem[]) => {
    setChangeNotes(givenChangeNotes);
    if (lastTransaction && paymentMethod === 'cash') {
      onCashTransactionComplete({
        invoiceNumber: lastTransaction.invoiceNumber,
        total: lastTransaction.total,
        tenderedNotes: tenderedNotes,
        changeNotes: givenChangeNotes,
      });
    }
    handleGoToSuccess();
  };
  
  const PaymentView = () => (
    <>
      <div className="text-center mb-6">
        <p className="text-on-surface-variant font-medium">Total Amount Due</p>
        <div className="flex flex-col items-center leading-tight">
            <span className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">{totalUSDStr}</span>
            <span className="text-lg sm:text-xl font-semibold text-on-surface-variant">{totalLBPStr}</span>
        </div>
      </div>

      <div className="bg-surface-container/50 p-4 rounded-2xl mb-6 text-base">
        <div className="flex justify-between py-1.5 border-b border-outline/20">
            <span className="text-on-surface-variant">Subtotal</span>
            <span>{formatPrice(subtotal, shopInfo.usdToLbpRate).usd} / {formatPrice(subtotal, shopInfo.usdToLbpRate).lbp}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-outline/20">
            <span className="text-on-surface-variant">VAT ({TAX_RATE * 100}%)</span>
            <span>{formatPrice(tax, shopInfo.usdToLbpRate).usd} / {formatPrice(tax, shopInfo.usdToLbpRate).lbp}</span>
        </div>
        {activeReservation && rentalCharge > 0 && (
             <div className="flex justify-between py-1.5">
                <span className="text-on-surface-variant">Room Rent</span>
                <span>{formatPrice(rentalCharge, shopInfo.usdToLbpRate).usd} / {formatPrice(rentalCharge, shopInfo.usdToLbpRate).lbp}</span>
            </div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-center text-on-surface mb-4">Payment Method</h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handlePayment('card')}
            className={`w-full py-4 rounded-2xl font-semibold border-2 transition-all bg-surface-container text-on-surface border-outline hover:bg-surface-container-high`}
          >
            Card
          </button>
          <button
            onClick={() => setView('cashTendered')}
            className={`w-full py-4 rounded-2xl font-semibold border-2 transition-all bg-surface-container text-on-surface border-outline hover:bg-surface-container-high`}
          >
            Cash
          </button>
        </div>
      </div>
    </>
  );

  const CashTenderedView = () => {
      const [localTenderedNotes, setLocalTenderedNotes] = useState<BreakdownItem[]>([]);
      
      const handleNoteClick = (note: number, currency: 'LBP' | 'USD') => {
          setLocalTenderedNotes(prev => {
              const newItems = [...prev];
              const existing = newItems.find(item => item.note === note && item.currency === currency);
              if (existing) {
                  existing.count++;
              } else {
                  newItems.push({ note, currency, count: 1 });
              }
              return newItems.sort((a,b) => (b.currency === 'USD' ? b.note * shopInfo.usdToLbpRate : b.note) - (a.currency === 'USD' ? a.note * shopInfo.usdToLbpRate : a.note));
          });
      };

      const totalTenderedLBP = useMemo(() => {
          return localTenderedNotes.reduce((sum, item) => {
              const valueInLBP = item.currency === 'USD' ? item.note * shopInfo.usdToLbpRate : item.note;
              return sum + (valueInLBP * item.count);
          }, 0);
      }, [localTenderedNotes, shopInfo.usdToLbpRate]);

      const changeDueLBP = totalTenderedLBP - totalLBP;

      const NoteButton: React.FC<{note: number, currency: 'LBP'|'USD'}> = ({note, currency}) => (
        <button
            onClick={() => handleNoteClick(note, currency)}
            className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition font-semibold text-on-surface-variant text-lg"
        >
            {currency === 'USD' ? `$${note}` : note.toLocaleString()}
        </button>
      );
      
      return (
          <div className="text-left animate-fade-in">
              <h2 className="text-2xl font-semibold text-on-surface mb-4">Cash Tendered</h2>
              <p className="text-on-surface-variant mb-4 text-center">Select the notes received from the customer.</p>
              
              <div className="space-y-4 mb-4">
                  <h4 className="text-sm font-medium text-on-surface-variant">LBP Notes</h4>
                  <div className="grid grid-cols-3 gap-3">
                      {LBP_DENOMINATIONS.map(note => <NoteButton key={`lbp-${note}`} note={note} currency="LBP" />)}
                  </div>
              </div>
              <div className="space-y-4 mb-4">
                  <h4 className="text-sm font-medium text-on-surface-variant">USD Notes</h4>
                  <div className="grid grid-cols-3 gap-3">
                      {USD_DENOMINATIONS.map(note => <NoteButton key={`usd-${note}`} note={note} currency="USD" />)}
                  </div>
              </div>

              <div className="mt-4 pt-4 border-t border-outline/20 min-h-[120px]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-on-surface-variant">Notes Received:</h4>
                    <button onClick={() => setLocalTenderedNotes([])} className="text-xs font-medium text-error hover:underline">Clear</button>
                  </div>
                  {localTenderedNotes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-sm">
                          {localTenderedNotes.map((item, index) => (
                              <span key={index} className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1.5 font-medium animate-fade-in">
                                  {item.count} &times; {item.currency === 'USD' ? `$${item.note}` : item.note.toLocaleString()}
                              </span>
                          ))}
                      </div>
                  ) : <p className="text-center text-on-surface-variant/70">No notes selected.</p>}
                  
                  <div className="mt-4 flex justify-between text-lg font-medium p-3 bg-surface-container rounded-2xl">
                    <span>Amount Tendered:</span>
                    <span className="font-bold">{formatPrice(totalTenderedLBP, shopInfo.usdToLbpRate).lbp}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-lg font-medium p-3 bg-primary-container text-primary rounded-2xl">
                    <span>Change Due:</span>
                    <span className="font-bold">{changeDueLBP >=0 ? formatPrice(changeDueLBP, shopInfo.usdToLbpRate).lbp : '---'}</span>
                  </div>
              </div>
              
              <button
                  onClick={() => handlePayment('cash', localTenderedNotes)}
                  disabled={changeDueLBP < 0}
                  className="w-full bg-primary text-on-primary py-4 mt-4 rounded-2xl font-bold text-xl hover:bg-primary/90 transition-all duration-300 disabled:bg-on-surface/20 disabled:text-on-surface/50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 transform-gpu">
                  Confirm & Process
              </button>
          </div>
      );
  }

  const ProcessingView = () => (
    <div className="flex flex-col items-center justify-center h-80">
      <div className="relative w-20 h-20">
        <svg className="animate-spin h-20 w-20 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <CoffeeIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary"/>
      </div>
      <p className="mt-6 text-xl font-medium text-primary">Processing Payment...</p>
    </div>
  );

  const ChangeView = ({ onComplete }: { onComplete: (changeNotes: BreakdownItem[]) => void }) => {
    const initialChangeDue = lastTransaction?.changeGiven || 0;
    const [remainingChange, setRemainingChange] = useState(initialChangeDue);
    const [localInventory, setLocalInventory] = useState(() => JSON.parse(JSON.stringify(cashierInventory)));
    const [notesGiven, setNotesGiven] = useState<BreakdownItem[]>([]);

    const suggestions = useMemo(() => {
        if (remainingChange < 500) return [];
        return calculateChangeBreakdown(remainingChange, localInventory, shopInfo.usdToLbpRate);
    }, [remainingChange, localInventory, shopInfo.usdToLbpRate]);

    const handleContinue = () => {
        onInventoryUpdate(localInventory);
        onComplete(notesGiven);
    };

    useEffect(() => {
        if (remainingChange > 0 && remainingChange < 50000 && suggestions.length === 0) {
            handleOverage(remainingChange);
            onInventoryUpdate(localInventory);
            onComplete(notesGiven);
        }
    }, [remainingChange, suggestions]);

    const handleSuggestionClick = (suggestion: BreakdownItem) => {
        const valueInLBP = (suggestion.currency === 'USD' ? suggestion.note * shopInfo.usdToLbpRate : suggestion.note) * suggestion.count;
        
        setRemainingChange(prev => prev - valueInLBP);

        setNotesGiven(prev => {
            const newGiven = [...prev];
            const existing = newGiven.find(item => item.note === suggestion.note && item.currency === suggestion.currency);
            if (existing) {
                existing.count += suggestion.count;
            } else {
                newGiven.push({ ...suggestion });
            }
            return newGiven.sort((a,b) => (b.currency === 'USD' ? b.note * shopInfo.usdToLbpRate : b.note) - (a.currency === 'USD' ? a.note * shopInfo.usdToLbpRate : a.note));
        });

        setLocalInventory((prev: CashierInventory) => {
            const newInventory = JSON.parse(JSON.stringify(prev));
            newInventory[suggestion.currency][suggestion.note as any] -= suggestion.count;
            return newInventory;
        });
    };

    const handleReset = () => {
        setRemainingChange(initialChangeDue);
        setNotesGiven([]);
        setLocalInventory(JSON.parse(JSON.stringify(cashierInventory)));
    };

    const isComplete = remainingChange < 500; // Smallest note is 1000, allow tolerance

    return (
        <div className="text-left animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-on-surface">Give Change</h2>
                <button 
                  onClick={handleReset} 
                  className="py-2.5 px-5 rounded-full font-semibold bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors text-base flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
                    Reset
                </button>
            </div>
            
             <div className="my-4 flex justify-between text-xl font-medium p-3 bg-primary-container text-primary rounded-2xl">
                <span>Remaining Change:</span>
                <span className="font-bold">{formatPrice(remainingChange, shopInfo.usdToLbpRate).lbp}</span>
             </div>

            <div className="space-y-4 mb-4 min-h-[100px]">
                <h4 className="text-sm font-medium text-on-surface-variant">Suggested Notes to Give:</h4>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((item, index) => (
                        <button key={index} onClick={() => handleSuggestionClick(item)} className="bg-tertiary-container text-on-tertiary-container rounded-full px-4 py-2 font-semibold hover:bg-tertiary-container/80 transition animate-fade-in">
                            {item.count} &times; {item.currency === 'USD' ? `$${item.note}` : item.note.toLocaleString()}
                        </button>
                    ))}
                    {suggestions.length === 0 && !isComplete && <p className="text-sm text-error">Not enough change in drawer to complete transaction.</p>}
                </div>
            </div>


            {notesGiven.length > 0 && (
                <div className="mt-4 pt-4 border-t border-outline/20 min-h-[60px]">
                    <h4 className="text-sm font-medium text-on-surface-variant mb-2">Notes Given:</h4>
                    <div className="flex flex-wrap gap-2 text-sm">
                        {notesGiven.map((item, index) => (
                            <span key={index} className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1.5 font-medium animate-fade-in">
                                {item.count} &times; {item.currency === 'USD' ? `$${item.note}` : item.note.toLocaleString()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleContinue}
                disabled={!isComplete}
                className="w-full bg-primary text-on-primary py-4 mt-8 rounded-2xl font-bold text-xl hover:bg-primary/90 transition-all duration-300 disabled:bg-on-surface/20 disabled:text-on-surface/50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 transform-gpu">
                Continue
            </button>
        </div>
    );
  }

  const SuccessView = () => {
    return (
        <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in" style={{minHeight: '450px'}}>
            <div className="relative mb-4">
                 <CheckCircleIcon className="w-24 h-24 text-green-500"/>
            </div>
            <h2 className="text-3xl font-semibold text-green-600 mb-1">Transaction Complete</h2>
            
            {lastTransaction && (
                <p className="text-on-surface-variant mb-2 font-medium">Invoice: {lastTransaction.invoiceNumber}</p>
            )}

            <div className="w-full space-y-3 mt-auto">
                <button
                    onClick={handlePrint}
                    className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-2xl font-semibold text-lg hover:bg-secondary-container/80 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                    <PrinterIcon className="w-5 h-5"/> Print Invoice
                </button>
                <button
                    onClick={handleFinish}
                    className="w-full bg-primary text-on-primary py-3 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors duration-300"
                >
                    Finish
                </button>
            </div>
        </div>
    );
  };

  const getModalTitle = () => {
    switch (view) {
        case 'payment':
            return activeReservation ? `Checkout: ${activeReservation.customerName}` : "Checkout";
        case 'cashTendered':
            return "Cash Payment";
        case 'change':
            return "Give Change";
        case 'success':
            return "Success";
        default:
            return "";
    }
  }

  return (
    <Modal 
      title={getModalTitle()} 
      onClose={onClose} 
      containerClass="max-w-lg"
    >
      <div id="invoice-to-print-container" className="hidden print:block">
          {lastTransaction && <Invoice transaction={lastTransaction} shopInfo={shopInfo}/>}
      </div>
      <div className="print:hidden">
        {view === 'payment' && <PaymentView />}
        {view === 'cashTendered' && <CashTenderedView />}
        {view === 'processing' && <ProcessingView />}
        {view === 'change' && <ChangeView onComplete={onCompleteChange} />}
        {view === 'success' && <SuccessView />}
      </div>
    </Modal>
  );
};

export default CheckoutModal;