import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Room, Reservation } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { TagIcon } from './icons/TagIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BanIcon } from './icons/BanIcon';

interface ReservationsTimelineViewProps {
  rooms: Room[];
  reservations: Reservation[];
  onNewReservationClick: (date: Date, time: string, roomId: string) => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
  setActiveSessionId: (id: string) => void;
  onClose: () => void;
}

const START_HOUR = 8;
const END_HOUR = 22;
const TIME_SLOTS_PER_HOUR = 2; // 30-minute slots
const ROOM_HEADER_WIDTH = 150;
const SLOT_WIDTH = 50;
const ROW_HEIGHT = 64; // h-16
const HEADER_HEIGHT = 41;

const ReservationsTimelineView: React.FC<ReservationsTimelineViewProps> = ({ rooms, reservations, onNewReservationClick, onCheckInReservation, onCancelReservation, setActiveSessionId, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Scroll to current time on initial load for today
        const now = new Date();
        if (selectedDate.toDateString() === now.toDateString() && timelineContainerRef.current) {
            const currentHour = now.getHours();
            if(currentHour >= START_HOUR && currentHour <= END_HOUR) {
                const scrollPosition = (currentHour - START_HOUR) * SLOT_WIDTH * TIME_SLOTS_PER_HOUR;
                timelineContainerRef.current.scrollLeft = scrollPosition - (timelineContainerRef.current.offsetWidth / 2);
            }
        }
    }, [selectedDate]);

    const reservationsForSelectedDay = useMemo(() => {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        return reservations.filter(res => {
            const resStart = new Date(res.scheduledStartTime).getTime();
            const resEnd = new Date(res.scheduledEndTime).getTime();
            // Check for overlap
            return resStart < endOfDay.getTime() && resEnd > startOfDay.getTime();
        });
    }, [reservations, selectedDate]);

    const changeDate = (amount: number) => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + amount);
            return newDate;
        });
    };

    const handleDateChangeFromPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (dateString) {
            const [year, month, day] = dateString.split('-').map(Number);
            setSelectedDate(new Date(year, month - 1, day));
        }
    };
    
    const getStatusStyles = (status: Reservation['status']) => {
        switch(status) {
            case 'scheduled': return 'bg-secondary-container text-on-secondary-container border-secondary/50';
            case 'active': return 'bg-primary-container text-on-primary-container border-primary/50 animate-pulse';
            case 'completed': return 'bg-surface-container-high text-on-surface-variant border-outline/20 opacity-70';
            case 'cancelled': return 'bg-error-container text-on-error-container border-error/50 line-through opacity-60';
            default: return 'bg-surface-container text-on-surface-variant border-outline/20';
        }
    }

    const timeHeaders = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
    const totalSlots = timeHeaders.length * TIME_SLOTS_PER_HOUR;

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-surface-container"><ChevronLeftIcon className="w-6 h-6" /></button>
                <div>
                    <button
                        onClick={() => dateInputRef.current?.showPicker()}
                        className="text-xl font-medium text-on-surface hover:bg-surface-container px-3 py-1 rounded-lg transition-colors"
                        title="Change date"
                        aria-label="Select a date"
                    >
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </button>
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={handleDateChangeFromPicker}
                        className="hidden"
                        aria-hidden="true"
                    />
                </div>
                <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-surface-container"><ChevronRightIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex-grow overflow-auto" ref={timelineContainerRef}>
                <div className="relative" style={{ width: `${ROOM_HEADER_WIDTH + totalSlots * SLOT_WIDTH}px` }}>
                    {/* Headers */}
                    <div className="sticky top-0 z-10 bg-surface-container-lowest flex">
                        <div className="border-r border-b border-outline/20 p-2 font-semibold flex items-center justify-center" style={{width: `${ROOM_HEADER_WIDTH}px`, height: `${HEADER_HEIGHT}px`}}>Room</div>
                        {timeHeaders.map(hour => (
                            <div key={hour} className="text-center border-b border-outline/20 p-2 text-sm font-medium" style={{width: `${SLOT_WIDTH * TIME_SLOTS_PER_HOUR}px`}}>
                                {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}
                            </div>
                        ))}
                    </div>
                    
                    {/* Room Rows and Grid */}
                    <div className="relative">
                       {rooms.map((room, roomIndex) => (
                            <div key={room.id} className="flex" style={{ height: `${ROW_HEIGHT}px` }}>
                                <div className="sticky left-0 bg-surface-container-low p-2 font-semibold border-r border-b border-outline/20 flex items-center" style={{width: `${ROOM_HEADER_WIDTH}px`}}>
                                    {room.name}
                                </div>
                                {Array.from({length: totalSlots}).map((_, slotIndex) => {
                                    const hour = START_HOUR + Math.floor(slotIndex / TIME_SLOTS_PER_HOUR);
                                    const minute = (slotIndex % TIME_SLOTS_PER_HOUR) * (60 / TIME_SLOTS_PER_HOUR);
                                    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                                    
                                    return (
                                        <div 
                                            key={slotIndex} 
                                            className={`border-b ${slotIndex % 2 === 0 ? 'border-r-0' : 'border-r'} border-outline/10 cursor-pointer hover:bg-primary/10 transition-colors`}
                                            style={{width: `${SLOT_WIDTH}px`}}
                                            onClick={() => onNewReservationClick(selectedDate, timeString, room.id)}
                                        />
                                    );
                                })}
                            </div>
                       ))}
                       
                       {/* Reservations Overlay */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {reservationsForSelectedDay.map(res => {
                                const roomIndex = rooms.findIndex(r => r.id === res.roomId);
                                if (roomIndex === -1) return null;

                                const dayStart = new Date(selectedDate);
                                dayStart.setHours(START_HOUR, 0, 0, 0);
                                const dayEnd = new Date(selectedDate);
                                dayEnd.setHours(END_HOUR, 0, 0, 0);

                                const resStart = new Date(res.scheduledStartTime);
                                const resEnd = new Date(res.scheduledEndTime);

                                // Clamp reservation times to the visible day
                                const effectiveStart = resStart < dayStart ? dayStart : resStart;
                                const effectiveEnd = resEnd > dayEnd ? dayEnd : resEnd;

                                const startMinutes = (effectiveStart.getHours() - START_HOUR) * 60 + effectiveStart.getMinutes();
                                const endMinutes = (effectiveEnd.getHours() - START_HOUR) * 60 + effectiveEnd.getMinutes();
                                const durationMinutes = endMinutes - startMinutes;
                                
                                if (durationMinutes <= 0) return null;

                                const MINUTE_WIDTH = (SLOT_WIDTH * TIME_SLOTS_PER_HOUR) / 60;

                                const style: React.CSSProperties = {
                                    position: 'absolute',
                                    top: `${roomIndex * ROW_HEIGHT + 4}px`,
                                    left: `${ROOM_HEADER_WIDTH + startMinutes * MINUTE_WIDTH}px`,
                                    width: `${durationMinutes * MINUTE_WIDTH - 4}px`,
                                    height: `${ROW_HEIGHT - 8}px`,
                                    pointerEvents: 'auto',
                                };

                                return (
                                    <div
                                        key={res.id}
                                        className={`p-2 rounded-lg shadow-md overflow-hidden text-xs border flex flex-col justify-center ${getStatusStyles(res.status)}`}
                                        style={style}
                                    >
                                        <p className="font-bold truncate">{res.customerName}</p>
                                        <p className="truncate">{res.guests} guests</p>
                                        <div className="absolute bottom-1 right-1 flex gap-1">
                                            {res.status === 'scheduled' && (
                                                <>
                                                    <button onClick={() => onCheckInReservation(res.id)} title="Check-in" className="p-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30"><CheckCircleIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => onCancelReservation(res.id)} title="Cancel" className="p-1 rounded-full bg-error/20 text-error hover:bg-error/30"><BanIcon className="w-4 h-4"/></button>
                                                </>
                                            )}
                                            {res.status === 'active' && (
                                                <button onClick={() => { setActiveSessionId(res.id); onClose(); }} title="View Order" className="p-1 rounded-full bg-secondary/20 text-secondary hover:bg-secondary/30"><TagIcon className="w-4 h-4"/></button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationsTimelineView;