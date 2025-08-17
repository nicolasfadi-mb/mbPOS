
import React, { useState, useRef } from 'react';
import type { Room, Reservation } from '../../types';
import ReservationsTimelineView from '../ReservationsTimelineView';
import ReservationModal from '../ReservationModal';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { HelpCircleIcon } from '../icons/HelpCircleIcon';
import HelpModal from '../shared/HelpModal';

interface AdminReservationsViewProps {
  rooms: Room[];
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  onCreateReservation: (details: Omit<Reservation, 'id' | 'status' | 'items' | 'actualStartTime' | 'actualEndTime'>) => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
  setActiveSessionId: (id: string) => void;
  isCompanyView: boolean;
}

const AdminReservationsView: React.FC<AdminReservationsViewProps> = (props) => {
    const [isNewReservationModalVisible, setNewReservationModalVisible] = useState(false);
    const [prefillData, setPrefillData] = useState<{date: Date, time: string, roomId: string} | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenNewReservation = (date: Date, time: string, roomId: string) => {
        setPrefillData({ date, time, roomId });
        setNewReservationModalVisible(true);
    };

    const handleCloseNewReservation = () => {
        setNewReservationModalVisible(false);
        setPrefillData(null);
    };

    const handleExportCSV = () => {
        const headers = ['id', 'roomId', 'customerName', 'guests', 'scheduledStartTime', 'scheduledEndTime', 'status'];
        const csvRows = [
            headers.join(','),
            ...props.reservations.map(r => 
                [
                    r.id,
                    r.roomId,
                    `"${r.customerName.replace(/"/g, '""')}"`,
                    r.guests,
                    r.scheduledStartTime,
                    r.scheduledEndTime,
                    r.status
                ].join(',')
            ),
            `,room_001,"Example Customer",2,${new Date().toISOString()},${new Date(Date.now() + 3600*1000).toISOString()},scheduled`
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'reservations_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
    
            const lines = text.split('\n').slice(1); // Skip header
            let updatedList = [...props.reservations];
            let addedCount = 0;
            let updatedCount = 0;
    
            lines.forEach((line, i) => {
                if (!line.trim()) return;
                const values = line.match(/(?:,"|^)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g)?.map(v => v.replace(/^,/, '').replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"')) || [];
                const [id, roomId, customerName, guests, scheduledStartTime, scheduledEndTime, status] = values;
                
                if (!roomId || !customerName || !scheduledStartTime || !scheduledEndTime || !status) {
                    console.warn(`Skipping row ${i + 1} due to missing required data.`);
                    return;
                }

                const reservationData = {
                    roomId: roomId.trim(),
                    customerName: customerName.trim(),
                    guests: parseInt(guests.trim(), 10) || 1,
                    scheduledStartTime: new Date(scheduledStartTime.trim()).toISOString(),
                    scheduledEndTime: new Date(scheduledEndTime.trim()).toISOString(),
                    status: status.trim() as Reservation['status'],
                };
    
                if (id && id.trim()) {
                    const index = updatedList.findIndex(r => r.id === id.trim());
                    if (index !== -1) {
                        if (updatedList[index].status === 'active') {
                            console.warn(`Skipping update for active reservation ${id.trim()}`);
                            return;
                        }
                        updatedList[index] = { ...updatedList[index], ...reservationData };
                        updatedCount++;
                    } else {
                        const newReservation: Reservation = {
                            ...reservationData,
                            id: `res_${Date.now()}_${i}`,
                            items: [],
                            actualStartTime: null,
                            actualEndTime: null,
                        };
                        updatedList.push(newReservation);
                        addedCount++;
                    }
                } else {
                    const newReservation: Reservation = {
                        ...reservationData,
                        id: `res_${Date.now()}_${i}`,
                        items: [],
                        actualStartTime: null,
                        actualEndTime: null,
                    };
                    updatedList.push(newReservation);
                    addedCount++;
                }
            });
            
            props.setReservations(updatedList);
            alert(`Import complete! ${addedCount} reservations added, ${updatedCount} reservations updated.`);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const CsvHelpContent = () => (
      <>
        <h3 className="text-lg font-semibold text-on-surface">How to Import Reservations via CSV</h3>
        <p className="text-base">Follow these steps to correctly format and import reservations.</p>
        <ol className="list-decimal list-inside space-y-3">
            <li><strong>Download the Template:</strong> Click "Export" to get a pre-formatted CSV file.</li>
            <li><strong>Open and Edit:</strong> Open the file in a spreadsheet program.</li>
            <li><strong>Fill in Data:</strong> Add reservations as new rows, following the guide below.
                <div className="mt-2 p-3 bg-surface-container rounded-lg text-sm">
                    <h4 className="font-semibold mb-2">Column Guide:</h4>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>id</strong> (Optional): To update a non-active reservation, use its ID. Leave blank for a new one.</li>
                        <li><strong>roomId</strong> (Required): The ID of an existing room.</li>
                        <li><strong>customerName</strong> (Required): Customer's name. Use quotes for names with commas (e.g., "Doe, John").</li>
                        <li><strong>guests</strong> (Required): Number of guests (e.g., 4).</li>
                        <li><strong>scheduledStartTime</strong> (Required): Start time in ISO 8601 format (e.g., <code>2024-08-15T10:00:00.000Z</code>).</li>
                        <li><strong>scheduledEndTime</strong> (Required): End time in ISO 8601 format (e.g., <code>2024-08-15T12:00:00.000Z</code>).</li>
                        <li><strong>status</strong> (Required): Must be one of: <code>scheduled</code>, <code>completed</code>, or <code>cancelled</code>.</li>
                    </ul>
                </div>
            </li>
            <li><strong>Save and Import:</strong> Save the file, then click "Import" to upload it.</li>
        </ol>
        <h4 className="font-semibold text-on-surface mt-2">Example Row (New Reservation):</h4>
        <code className="block bg-surface-container p-2 rounded-md text-sm font-mono">,room_123,"Tech Meeting, Inc.",8,2024-09-01T14:00:00.000Z,2024-09-01T16:00:00.000Z,scheduled</code>
      </>
    );

    return (
        <div>
            {!props.isCompanyView && (
              <div className="flex justify-end items-center mb-4">
                  <div className="flex items-center gap-2">
                      <button onClick={() => setIsHelpModalOpen(true)} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors" title="CSV Format Help">
                          <HelpCircleIcon className="w-5 h-5" />
                      </button>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImportCSV} 
                          className="hidden"
                          accept=".csv"
                      />
                      <button onClick={handleExportCSV} className="bg-surface-container text-on-surface-variant py-2 px-4 rounded-full font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm">
                          <DownloadIcon className="w-4 h-4"/>
                          Export
                      </button>
                      <button onClick={handleImportClick} className="bg-surface-container text-on-surface-variant py-2 px-4 rounded-full font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm">
                          <UploadIcon className="w-4 h-4"/>
                          Import
                      </button>
                      <button onClick={() => setNewReservationModalVisible(true)} className="bg-primary text-on-primary py-2 px-5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                          Create Reservation
                      </button>
                  </div>
              </div>
            )}
            <div className="h-[70vh] border border-outline/20 rounded-2xl overflow-hidden bg-surface-container-lowest">
                <ReservationsTimelineView 
                    rooms={props.rooms}
                    reservations={props.reservations}
                    onNewReservationClick={props.isCompanyView ? () => {} : handleOpenNewReservation}
                    onCheckInReservation={props.onCheckInReservation}
                    onCancelReservation={props.onCancelReservation}
                    setActiveSessionId={props.setActiveSessionId}
                    onClose={() => {}} // Dummy onClose as it's not in a modal here
                />
            </div>
            {isNewReservationModalVisible && !props.isCompanyView && (
                <ReservationModal 
                    rooms={props.rooms}
                    reservations={props.reservations}
                    onClose={handleCloseNewReservation}
                    onCreateReservation={(details) => {
                        props.onCreateReservation(details);
                        handleCloseNewReservation();
                    }}
                    prefillData={prefillData}
                />
            )}
            {isHelpModalOpen && <HelpModal title="Reservation Import/Export Help" onClose={() => setIsHelpModalOpen(false)}><CsvHelpContent /></HelpModal>}
        </div>
    );
};

export default AdminReservationsView;
