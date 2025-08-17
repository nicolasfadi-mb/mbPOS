import React, { useState, useMemo, useEffect } from 'react';
import type { Room, Reservation } from '../types';
import Modal from './shared/Modal';
import { HomeIcon } from './icons/HomeIcon';
import { UsersIcon } from './icons/UsersIcon';

interface ReservationModalProps {
  rooms: Room[];
  reservations: Reservation[];
  onClose: () => void;
  onCreateReservation: (details: Omit<Reservation, 'id' | 'status' | 'items' | 'actualStartTime' | 'actualEndTime'>) => void;
  prefillData?: { date: Date, time: string, roomId: string } | null;
}

const toISODateString = (date: Date) => date.toISOString().split('T')[0];

const ReservationModal: React.FC<ReservationModalProps> = ({ rooms, reservations, onClose, onCreateReservation, prefillData }) => {
    const [date, setDate] = useState(toISODateString(prefillData?.date || new Date()));
    const [time, setTime] = useState(prefillData?.time || '12:00');
    const [duration, setDuration] = useState(1); // in hours
    const [guests, setGuests] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(prefillData?.roomId || null);

    useEffect(() => {
        if(prefillData){
            setDate(toISODateString(prefillData.date));
            setTime(prefillData.time);
            setSelectedRoomId(prefillData.roomId)
        }
    }, [prefillData])

    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hour = String(h).padStart(2, '0');
                const minute = String(m).padStart(2, '0');
                options.push(`${hour}:${minute}`);
            }
        }
        return options;
    }, []);

    const availableRooms = useMemo(() => {
        if (!date || !time) return [];

        const scheduledStartTime = new Date(`${date}T${time}`).getTime();
        const scheduledEndTime = scheduledStartTime + duration * 60 * 60 * 1000;

        const busyRoomIds = reservations
            .filter(res => res.status === 'scheduled' || res.status === 'active')
            .filter(res => {
                const existingStart = new Date(res.scheduledStartTime).getTime();
                const existingEnd = new Date(res.scheduledEndTime).getTime();
                // Check for overlap
                return scheduledStartTime < existingEnd && scheduledEndTime > existingStart;
            })
            .map(res => res.roomId);

        return rooms.filter(room => 
            !busyRoomIds.includes(room.id) && room.capacity >= guests
        );
    }, [date, time, duration, guests, rooms, reservations]);

     // If the pre-selected room becomes unavailable due to other changes, deselect it
    useEffect(() => {
        if (selectedRoomId && !availableRooms.some(r => r.id === selectedRoomId)) {
            setSelectedRoomId(null);
        }
    }, [availableRooms, selectedRoomId]);

    const handleCreate = () => {
        if (selectedRoomId && customerName && date && time) {
            const scheduledStartTime = new Date(`${date}T${time}`);
            const scheduledEndTime = new Date(scheduledStartTime.getTime() + duration * 60 * 60 * 1000);

            onCreateReservation({
                roomId: selectedRoomId,
                customerName,
                guests,
                scheduledStartTime: scheduledStartTime.toISOString(),
                scheduledEndTime: scheduledEndTime.toISOString(),
            });
        }
    };

    return (
        <Modal title="Create New Reservation" onClose={onClose}>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-on-surface-variant mb-1">Customer Name</label>
                        <input
                            type="text"
                            id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g., Jane Doe"
                            className="input-field"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="guests" className="block text-sm font-medium text-on-surface-variant mb-1">Number of Guests</label>
                        <input
                            type="number"
                            id="guests"
                            value={guests}
                            onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            min="1"
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-on-surface-variant mb-1">Date</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} min={toISODateString(new Date())} className="input-field"/>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-on-surface-variant mb-1">Start Time</label>
                        <select id="time" value={time} onChange={e => setTime(e.target.value)} className="input-field">
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-on-surface-variant mb-1">Duration</label>
                        <select id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="input-field">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} hour{h>1 && 's'}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-on-surface mb-2">Available Rooms for Selected Time</h3>
                    <div className="max-h-[30vh] overflow-y-auto space-y-2 p-2 bg-surface-container rounded-xl">
                        {availableRooms.length > 0 ? availableRooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => setSelectedRoomId(room.id)}
                                className={`w-full flex items-center justify-between text-left p-3 rounded-lg border-2 transition-colors ${
                                    selectedRoomId === room.id ? 'bg-secondary-container border-secondary' : 'bg-surface-container-lowest border-transparent hover:border-outline/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <HomeIcon className="w-6 h-6 text-secondary"/>
                                    <span className="font-bold text-on-surface">{room.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-on-surface-variant">
                                    <UsersIcon className="w-4 h-4"/>
                                    <span>Fits {room.capacity}</span>
                                </div>
                            </button>
                        )) : (
                            <p className="text-center text-on-surface-variant py-8">No available rooms for the selected criteria.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-outline/20">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
                    <button
                        onClick={handleCreate}
                        disabled={!selectedRoomId || !customerName}
                        className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:bg-on-surface/20 disabled:text-on-surface/50 disabled:cursor-not-allowed"
                    >
                        Schedule Reservation
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReservationModal;