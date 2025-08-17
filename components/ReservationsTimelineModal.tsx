import React from 'react';
import type { Room, Reservation } from '../types';
import ReservationsTimelineView from './ReservationsTimelineView';
import ReservationModal from './ReservationModal';
import Modal from './shared/Modal';

interface ReservationsTimelineModalProps {
  rooms: Room[];
  reservations: Reservation[];
  onClose: () => void;
  onCreateReservation: (details: Omit<Reservation, 'id' | 'status' | 'items' | 'actualStartTime' | 'actualEndTime'>) => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
  setActiveSessionId: (id: string) => void;
}

const ReservationsTimelineModal: React.FC<ReservationsTimelineModalProps> = (props) => {
    const [isNewReservationModalVisible, setNewReservationModalVisible] = React.useState(false);
    const [prefillData, setPrefillData] = React.useState<{date: Date, time: string, roomId: string} | null>(null);

    const handleOpenNewReservation = (date: Date, time: string, roomId: string) => {
        setPrefillData({ date, time, roomId });
        setNewReservationModalVisible(true);
    };

    const handleCloseNewReservation = () => {
        setNewReservationModalVisible(false);
        setPrefillData(null);
    };
    
    const handleCreateAndClose = (details: Omit<Reservation, 'id' | 'status' | 'items' | 'actualStartTime' | 'actualEndTime'>) => {
        props.onCreateReservation(details);
        handleCloseNewReservation();
    };

    return (
        <>
            <Modal
                title="Reservations Timeline"
                onClose={props.onClose}
                containerClass="w-11/12 max-w-7xl h-[95vh] flex flex-col"
            >
                <div className="flex-grow overflow-hidden -mx-6 -mb-6 md:-mx-8 md:-mb-8">
                     <ReservationsTimelineView 
                        {...props} 
                        onNewReservationClick={handleOpenNewReservation}
                     />
                </div>
            </Modal>
            
            {isNewReservationModalVisible && (
                <ReservationModal 
                    rooms={props.rooms}
                    reservations={props.reservations}
                    onClose={handleCloseNewReservation}
                    onCreateReservation={handleCreateAndClose}
                    prefillData={prefillData}
                />
            )}
        </>
    );
};

export default ReservationsTimelineModal;