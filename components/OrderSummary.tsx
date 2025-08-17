import React, { useState, useEffect } from 'react';
import type { OrderItem, Room, Reservation, ShopInfoSettings } from '../types';
import { TAX_RATE, formatPrice } from '../constants';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { useInterval } from '../hooks/useInterval';

interface OrderSummaryProps {
  items: OrderItem[];
  rooms: Room[];
  activeReservation: Reservation | null;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onClearOrder: () => void;
  shopInfo: ShopInfoSettings;
}

const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const PriceDisplay: React.FC<{priceLBP: number, rate: number, classNames?: {usd: string, lbp: string}}> = ({priceLBP, rate, classNames}) => {
    const { usd, lbp } = formatPrice(priceLBP, rate);
    return (
        <div className="flex flex-col items-end leading-tight">
            <span className={classNames?.usd || ''}>{usd}</span>
            <span className={classNames?.lbp || 'text-xs text-on-surface-variant/80'}>{lbp}</span>
        </div>
    )
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, rooms, activeReservation, onUpdateQuantity, onRemoveItem, onCheckout, onClearOrder, shopInfo }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  const room = activeReservation ? rooms.find(r => r.id === activeReservation.roomId) : null;

  const calculateRentalCost = () => {
    if (!room || !activeReservation?.actualStartTime) return 0;
    
    const durationMillis = new Date().getTime() - new Date(activeReservation.actualStartTime).getTime();
    // Charge per half-hour block that has started.
    const halfHourBlocks = Math.ceil(durationMillis / (1000 * 60 * 30));
    return halfHourBlocks * (room.hourlyRate / 2);
  };
  
  const [rentalCost, setRentalCost] = useState(calculateRentalCost());
  
  useInterval(() => {
    if (activeReservation?.status === 'active' && activeReservation.actualStartTime) {
      const now = new Date().getTime();
      const start = new Date(activeReservation.actualStartTime!).getTime();
      setElapsedTime(now - start);
      setRentalCost(calculateRentalCost());
    }
  }, 1000);

  useEffect(() => {
      // Recalculate cost when reservation changes
      setRentalCost(calculateRentalCost());
      // Reset elapsed time if reservation is not active
      if (activeReservation?.status !== 'active' || !activeReservation.actualStartTime) {
        setElapsedTime(0);
      }
  }, [activeReservation, rooms]);


  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + rentalCost;


  const getRoomName = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.name || 'Room';
  };
  
  const title = activeReservation ? `${getRoomName(activeReservation.roomId)}` : 'Walk-in Order';
  const isCheckoutDisabled = items.length === 0 && (!activeReservation || activeReservation.status === 'scheduled');

  return (
    <div className="flex flex-col lg:h-full">
      <div className="flex justify-between items-center border-b border-outline/20 pb-4 mb-4 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-on-surface">{title}</h2>
        {(items.length > 0 || activeReservation) && (
            <button onClick={onClearOrder} className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5 text-sm font-medium bg-surface-container hover:bg-error-container/50 py-2 px-3 rounded-full">
                <XCircleIcon className="w-5 h-5" />
                Clear Items
            </button>
        )}
      </div>
      <div className="flex-grow">
        {items.length === 0 && !activeReservation ? (
          <div className="h-full flex flex-col justify-center items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-outline/20 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <p className="text-on-surface-variant text-lg font-medium">Add items from the menu</p>
            <p className="text-on-surface-variant/80">Your order will appear here.</p>
          </div>
        ) : (
          <>
            {activeReservation && (
                <div className="bg-surface-container p-4 rounded-2xl mb-4">
                    <p className="font-semibold text-on-surface">Customer: {activeReservation.customerName}</p>
                     {activeReservation.status === 'active' && activeReservation.actualStartTime && (
                         <div className="flex items-center gap-2 text-sm text-primary font-medium mt-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>Active for: {formatDuration(elapsedTime)}</span>
                         </div>
                     )}
                     {activeReservation.status === 'scheduled' && (
                         <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>Scheduled: {new Date(activeReservation.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                         </div>
                     )}
                </div>
            )}
            {items.length > 0 && 
              <ul className="divide-y divide-outline/10">
                {items.map(({ product, quantity }) => {
                    const formattedItemPrice = formatPrice(product.price, shopInfo.usdToLbpRate);
                    const formattedTotalPrice = formatPrice(product.price * quantity, shopInfo.usdToLbpRate);
                    return (
                      <li key={product.id} className="py-4 flex items-center gap-4">
                        <div className="flex-grow">
                          <p className="font-medium text-on-surface text-lg">{product.name}</p>
                          <p className="text-sm text-on-surface-variant/80">{formattedItemPrice.usd} ({formattedItemPrice.lbp})</p>
                        </div>
                         <div className="flex items-center flex-shrink-0">
                            <button onClick={() => onUpdateQuantity(product.id, quantity - 1)} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition active:scale-90"><MinusIcon className="w-5 h-5" /></button>
                            <span className="px-4 font-bold text-lg w-12 text-center">{quantity}</span>
                            <button onClick={() => onUpdateQuantity(product.id, quantity + 1)} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition active:scale-90"><PlusIcon className="w-5 h-5" /></button>
                          </div>
                        <div className="text-right w-32">
                          <p className="font-bold text-lg text-primary">{formattedTotalPrice.usd}</p>
                          <p className="text-xs text-on-surface-variant">{formattedTotalPrice.lbp}</p>
                        </div>
                      </li>
                    );
                })}
              </ul>
            }
          </>
        )}
      </div>
      <div className="border-t border-outline/20 mt-auto pt-4 flex-shrink-0 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <PriceDisplay priceLBP={subtotal} rate={shopInfo.usdToLbpRate} classNames={{usd: 'font-medium', lbp: 'text-xs'}}/>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>VAT ({TAX_RATE * 100}%)</span>
            <PriceDisplay priceLBP={tax} rate={shopInfo.usdToLbpRate} classNames={{usd: 'font-medium', lbp: 'text-xs'}}/>
          </div>
          {activeReservation && rentalCost > 0 && (
            <div className="flex justify-between text-on-surface-variant">
              <span>Room Rent</span>
              <PriceDisplay priceLBP={rentalCost} rate={shopInfo.usdToLbpRate} classNames={{usd: 'font-medium', lbp: 'text-xs'}}/>
            </div>
          )}
          <div className="flex justify-between font-semibold text-on-surface border-t-2 border-outline/20 pt-3 mt-3">
            <span className="text-xl sm:text-2xl">Total</span>
            <PriceDisplay priceLBP={total} rate={shopInfo.usdToLbpRate} classNames={{usd: 'text-xl sm:text-2xl', lbp: 'text-base font-medium text-on-surface-variant'}}/>
          </div>
        </div>
        <button
          onClick={onCheckout}
          disabled={isCheckoutDisabled}
          className="w-full bg-primary text-on-primary py-3 sm:py-4 rounded-2xl font-bold text-lg sm:text-xl hover:bg-primary/90 transition-all duration-300 disabled:bg-on-surface/20 disabled:text-on-surface/50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 transform-gpu"
        >
          { activeReservation && activeReservation.status === 'active' ? 'End & Checkout' : 'Checkout' }
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;