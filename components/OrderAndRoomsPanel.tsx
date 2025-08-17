import React from 'react';
import OrderSummary from './OrderSummary';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { PlayCircleIcon } from './icons/PlayCircleIcon';
import type { OrderItem, Room, Reservation, ShopInfoSettings } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { ClockIcon } from './icons/ClockIcon';

interface OrderAndRoomsPanelProps {
  orderItems: OrderItem[];
  rooms: Room[];
  activeReservations: Reservation[];
  activeReservation: Reservation | null;
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onClearOrder: () => void;
  onManageSchedule: () => void;
  onStartRoomNow: () => void;
  shopInfo: ShopInfoSettings;
}

const OrderAndRoomsPanel: React.FC<OrderAndRoomsPanelProps> = (props) => {
  
  const getRoomName = (roomId: string) => {
    return props.rooms.find(r => r.id === roomId)?.name || 'Room';
  };

  const SessionButton = ({ sessionId, label, icon }: { sessionId: string, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => props.setActiveSessionId(sessionId)}
      className={`flex-shrink-0 flex items-center justify-center space-x-2 px-4 py-2 font-medium text-sm rounded-full transition-colors
        ${props.activeSessionId === sessionId ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-sm lg:h-full flex flex-col">
       <div className="p-4 grid grid-cols-2 gap-3 border-b border-outline/20">
         <button
          onClick={props.onStartRoomNow}
          className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-full font-semibold text-base hover:bg-secondary-container/80 transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <PlayCircleIcon className="w-5 h-5" />
          Start Room Now
        </button>
         <button
          onClick={props.onManageSchedule}
          className="w-full bg-tertiary-container text-on-tertiary-container py-3 rounded-full font-semibold text-base hover:bg-tertiary-container/80 transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <CalendarDaysIcon className="w-5 h-5" />
          Manage Schedule
        </button>
       </div>
       <div className="p-3 border-b border-outline/20 flex-shrink-0">
          <h3 className="text-sm font-medium text-on-surface-variant mb-2 px-2">Active Sessions</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <SessionButton sessionId="walk-in" label="Walk-in" icon={<HomeIcon className="w-5 h-5" />} />
              {props.activeReservations.map(res => (
                  <SessionButton key={res.id} sessionId={res.id} label={getRoomName(res.roomId)} icon={<ClockIcon className="w-5 h-5"/>} />
              ))}
          </div>
       </div>
      <div className="lg:flex-grow p-4 sm:p-6 lg:overflow-y-auto">
          <OrderSummary
            items={props.orderItems}
            rooms={props.rooms}
            activeReservation={props.activeReservation}
            onUpdateQuantity={props.onUpdateQuantity}
            onRemoveItem={props.onRemoveItem}
            onCheckout={props.onCheckout}
            onClearOrder={props.onClearOrder}
            shopInfo={props.shopInfo}
          />
      </div>
    </div>
  );
};

export default OrderAndRoomsPanel;