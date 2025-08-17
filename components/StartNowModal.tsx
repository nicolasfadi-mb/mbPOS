import React, { useMemo } from 'react';
import type { Room, Reservation } from '../types';
import Modal from './shared/Modal';
import { HomeIcon } from './icons/HomeIcon';

interface StartNowModalProps {
  rooms: Room[];
  reservations: Reservation[];
  onClose: () => void;
  onStartRoom: (roomId: string) => void;
}

const StartNowModal: React.FC<StartNowModalProps> = ({ rooms, reservations, onClose, onStartRoom }) => {
  const availableRooms = useMemo(() => {
    const activeRoomIds = new Set(
      reservations.filter(r => r.status === 'active').map(r => r.roomId)
    );
    return rooms.filter(room => !activeRoomIds.has(room.id));
  }, [rooms, reservations]);

  return (
    <Modal title="Start Room Session Now" onClose={onClose} containerClass="w-11/12 max-w-xl">
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <p className="text-on-surface-variant mb-4">Select an available room to start a rental session immediately.</p>
        {availableRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableRooms.map(room => (
              <li key={room.id} className="list-none">
                <button
                  onClick={() => onStartRoom(room.id)}
                  className="w-full flex items-center space-x-3 text-left p-4 rounded-xl bg-surface-container hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                  <HomeIcon className="w-8 h-8 text-primary" />
                  <div>
                    <span className="text-lg font-semibold text-on-surface">{room.name}</span>
                    <p className="text-sm text-on-surface-variant">{room.capacity} person capacity</p>
                  </div>
                </button>
              </li>
            ))}
          </div>
        ) : (
          <p className="text-center text-on-surface-variant py-8">All rooms are currently occupied.</p>
        )}
      </div>
    </Modal>
  );
};

export default StartNowModal;