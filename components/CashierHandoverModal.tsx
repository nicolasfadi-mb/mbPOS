import React from 'react';
import type { CashierSession, User, ShopInfoSettings, CashierInventory } from '../types';
import { LBP_DENOMINATIONS, USD_DENOMINATIONS, formatPrice } from '../constants';
import { ArrowRightArrowLeftIcon } from './icons/ArrowRightArrowLeftIcon';

interface CashierHandoverModalProps {
  onConfirm: () => void;
  onDecline: () => void;
  previousSession: CashierSession;
  newUser: User;
  shopInfo: ShopInfoSettings;
}

const calculateTotalInventoryValue = (inventory: CashierInventory, rate: number): number => {
    const totalLBP = LBP_DENOMINATIONS.reduce((sum, note) => sum + note * (inventory.LBP[note] || 0), 0);
    const totalUSD = USD_DENOMINATIONS.reduce((sum, note) => sum + note * (inventory.USD[note] || 0), 0);
    return totalLBP + (totalUSD * rate);
};


const CashierHandoverModal: React.FC<CashierHandoverModalProps> = ({
  onConfirm,
  onDecline,
  previousSession,
  newUser,
  shopInfo,
}) => {
    const totalCashInDrawer = calculateTotalInventoryValue(previousSession.currentInventory, shopInfo.usdToLbpRate);
    const { usd, lbp } = formatPrice(totalCashInDrawer, shopInfo.usdToLbpRate);

    return (
        <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-surface-container-lowest rounded-4xl shadow-2xl p-8 w-full max-w-xl text-center animate-slide-in-up">
                <ArrowRightArrowLeftIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                <h1 className="text-3xl font-bold text-on-surface">Shift Handover</h1>
                <p className="text-lg text-on-surface-variant mt-2 mb-6">
                    Welcome, {newUser.name}!
                </p>
                <div className="bg-surface-container p-6 rounded-2xl text-base">
                    <p className="text-on-surface-variant">
                        The previous cashier, <span className="font-bold text-on-surface">{previousSession.userName}</span>, ended their session with the following amount in the drawer:
                    </p>
                    <div className="my-4">
                        <p className="text-5xl font-bold text-primary tracking-tight">{usd}</p>
                        <p className="text-xl font-semibold text-on-surface-variant">{lbp}</p>
                    </div>
                    <p className="font-semibold text-on-surface text-lg">
                        Do you want to take over this cash drawer and continue with this balance?
                    </p>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <button
                        onClick={onDecline}
                        className="py-3 px-8 rounded-full font-bold text-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-all duration-300"
                    >
                        No, Start a Fresh Count
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-primary text-on-primary py-3 px-8 rounded-full font-bold text-lg hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 transform-gpu"
                    >
                        Yes, Continue Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashierHandoverModal;
