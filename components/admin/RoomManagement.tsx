
import React, { useState, useRef } from 'react';
import type { Room, ShopInfoSettings } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { formatPrice } from '../../constants';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { HelpCircleIcon } from '../icons/HelpCircleIcon';
import HelpModal from '../shared/HelpModal';

interface RoomManagementProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  shopInfo: ShopInfoSettings;
  isCompanyView: boolean;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ rooms, setRooms, shopInfo, isCompanyView }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModalForNew = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleSave = (roomData: Omit<Room, 'id'> & { id?: string }) => {
    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? { ...r, ...roomData } : r));
    } else {
      const newRoom: Room = { ...roomData, id: `room_${Date.now()}`, capacity: roomData.capacity || 1, hourlyRate: roomData.hourlyRate || 0 };
      setRooms([...rooms, newRoom]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (roomId: string) => {
    if(window.confirm('Are you sure you want to delete this room? This cannot be undone.')) {
        setRooms(rooms.filter(r => r.id !== roomId));
    }
  };

  const handleExportCSV = () => {
    const headers = ['id', 'name', 'capacity', 'hourlyRate'];
    const csvRows = [
        headers.join(','),
        ...rooms.map(r => 
            [r.id, r.name, r.capacity, r.hourlyRate].join(',')
        ),
        `,Example Room,4,1000000`
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'rooms_template.csv');
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
        let updatedRoomsList = [...rooms];
        let addedCount = 0;
        let updatedCount = 0;

        lines.forEach((line, i) => {
            if (!line.trim()) return;
            const [id, name, capacity, hourlyRate] = line.split(',');
            if (!name || !capacity || !hourlyRate) {
                console.warn(`Skipping row ${i+1} due to missing data.`);
                return;
            }

            const roomData = {
                name: name.trim(),
                capacity: parseInt(capacity.trim(), 10) || 1,
                hourlyRate: parseFloat(hourlyRate.trim()) || 0,
            };

            if (id && id.trim()) {
                const index = updatedRoomsList.findIndex(r => r.id === id.trim());
                if (index !== -1) {
                    updatedRoomsList[index] = { ...updatedRoomsList[index], ...roomData };
                    updatedCount++;
                } else {
                    updatedRoomsList.push({ ...roomData, id: `room_${Date.now()}_${i}` });
                    addedCount++;
                }
            } else {
                updatedRoomsList.push({ ...roomData, id: `room_${Date.now()}_${i}` });
                addedCount++;
            }
        });
        
        setRooms(updatedRoomsList);
        alert(`Import complete! ${addedCount} rooms added, ${updatedCount} rooms updated.`);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const CsvHelpContent = () => (
    <>
      <h3 className="text-lg font-semibold text-on-surface">How to Import Rooms via CSV</h3>
      <p className="text-base">Follow these steps to correctly format and import your room data.</p>
      <ol className="list-decimal list-inside space-y-3">
        <li><strong>Download the Template:</strong> Click "Export" to get a CSV file with the correct headers and an example.</li>
        <li><strong>Open and Edit:</strong> Open the file in a spreadsheet program.</li>
        <li><strong>Fill in Data:</strong> Add your rooms as new rows. Refer to the column guide below.
            <div className="mt-2 p-3 bg-surface-container rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Column Guide:</h4>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>id</strong> (Optional): To update an existing room, use its ID. Leave blank to create a new room.</li>
                    <li><strong>name</strong> (Required): The name of the room (e.g., "Meeting Room A").</li>
                    <li><strong>capacity</strong> (Required): Maximum number of people (e.g., 8).</li>
                    <li><strong>hourlyRate</strong> (Required): Rental price per hour in LBP, without commas (e.g., 900000).</li>
                </ul>
            </div>
        </li>
        <li><strong>Save and Import:</strong> Save the file, then click "Import" to upload it.</li>
      </ol>
      <h4 className="font-semibold text-on-surface mt-2">Example Row (New Room):</h4>
      <code className="block bg-surface-container p-2 rounded-md text-sm font-mono">,Conference Room,12,1200000</code>
    </>
  );

  return (
    <div>
      {!isCompanyView && (
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
                <button onClick={openModalForNew} className="bg-primary text-on-primary py-2 px-5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                  Add Room
                </button>
            </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-outline/20 bg-surface-container">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Name</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Capacity</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Hourly Rate</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {rooms.map(room => {
              const formattedRate = formatPrice(room.hourlyRate, shopInfo.usdToLbpRate);
              return (
              <tr key={room.id} className="hover:bg-surface-container-high transition-colors">
                <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">{room.name}</td>
                <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">{room.capacity} people</td>
                <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">{formattedRate.usd} / hr ({formattedRate.lbp})</td>
                <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                  {!isCompanyView && (
                    <>
                      <button onClick={() => openModalForEdit(room)} className="text-primary hover:text-primary/80 mr-4"><EditIcon className="w-5 h-5"/></button>
                      <button onClick={() => handleDelete(room.id)} className="text-error hover:text-error/80"><TrashIcon className="w-5 h-5"/></button>
                    </>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      {isModalOpen && !isCompanyView && (
        <RoomFormModal 
            room={editingRoom} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave} 
            shopInfo={shopInfo}
        />
      )}
      {isHelpModalOpen && <HelpModal title="Room Import/Export Help" onClose={() => setIsHelpModalOpen(false)}><CsvHelpContent /></HelpModal>}
    </div>
  );
};

const RoomFormModal: React.FC<{
  room: Room | null;
  onClose: () => void;
  onSave: (data: Omit<Room, 'id'>) => void;
  shopInfo: ShopInfoSettings;
}> = ({ room, onClose, onSave, shopInfo }) => {
  const [formData, setFormData] = useState({
    name: room?.name || '',
    capacity: room?.capacity || 1,
  });
  const [rateLBP, setRateLBP] = useState<string>((room?.hourlyRate || 0).toString());
  const [rateUSD, setRateUSD] = useState<string>(
    room ? (room.hourlyRate / shopInfo.usdToLbpRate).toFixed(2) : '0.00'
  );

  const handleLBPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lbpValueStr = e.target.value;
    setRateLBP(lbpValueStr);
    const lbpNumber = parseFloat(lbpValueStr) || 0;
    setRateUSD((lbpNumber / shopInfo.usdToLbpRate).toFixed(2));
  };
  
  const handleUSDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usdValueStr = e.target.value;
    setRateUSD(usdValueStr);
    const usdNumber = parseFloat(usdValueStr) || 0;
    setRateLBP(Math.round(usdNumber * shopInfo.usdToLbpRate).toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      hourlyRate: parseFloat(rateLBP) || 0,
    });
  };
  
  return (
    <Modal title={room ? 'Edit Room' : 'Add Room'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">Room Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-field"/>
            </div>
            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-on-surface-variant">Capacity</label>
                <input type="number" name="capacity" id="capacity" value={formData.capacity} onChange={handleChange} min="1" required className="input-field"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="hourlyRateLBP" className="block text-sm font-medium text-on-surface-variant">Hourly Rate (LBP)</label>
                    <input type="number" name="hourlyRateLBP" id="hourlyRateLBP" value={rateLBP} onChange={handleLBPChange} min="0" step="any" required className="input-field"/>
                </div>
                <div>
                    <label htmlFor="hourlyRateUSD" className="block text-sm font-medium text-on-surface-variant">Hourly Rate (USD)</label>
                    <input type="number" name="hourlyRateUSD" id="hourlyRateUSD" value={rateUSD} onChange={handleUSDChange} min="0" step="any" required className="input-field"/>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">Save</button>
            </div>
        </form>
    </Modal>
  )
}

export default RoomManagement;
