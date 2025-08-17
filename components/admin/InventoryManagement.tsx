
import React, { useState, useMemo, useRef } from 'react';
import type { StockItem, ShopInfoSettings } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { HelpCircleIcon } from '../icons/HelpCircleIcon';
import HelpModal from '../shared/HelpModal';

interface InventoryManagementProps {
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  inventoryUnits: string[];
  isCompanyView: boolean;
  shopInfo: ShopInfoSettings;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ stockItems, setStockItems, inventoryUnits, isCompanyView, shopInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModalForNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (item: StockItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (itemData: Omit<StockItem, 'id'> & { id?: string }) => {
    if (editingItem) {
      setStockItems(stockItems.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
    } else {
      const newItem: StockItem = { 
        ...itemData, 
        id: `stock_${Date.now()}`,
        stock: itemData.stock || 0,
        averageCost: itemData.averageCost || 0,
        lowStockThreshold: itemData.lowStockThreshold || 0,
      };
      setStockItems([...stockItems, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (itemId: string) => {
    if(window.confirm('Are you sure you want to delete this stock item? This could affect product recipes.')) {
        setStockItems(stockItems.filter(i => i.id !== itemId));
    }
  };

  const handleReceiveStock = (itemId: string, quantity: number, costLBP: number, costUSD: number) => {
    const totalCost = costLBP + (costUSD * shopInfo.usdToLbpRate);
    setStockItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
            if (quantity <= 0) return item;
            const currentStock = item.stock || 0;
            const currentAvgCost = item.averageCost || 0;

            if (currentStock === 0) {
                 return { ...item, stock: quantity, averageCost: totalCost / quantity };
            }

            const newStock = currentStock + quantity;
            const newAverageCost = ((currentStock * currentAvgCost) + totalCost) / newStock;
            return { ...item, stock: newStock, averageCost: newAverageCost };
        }
        return item;
    }));
    setIsReceiveModalOpen(false);
  };
  
  const handleExportCSV = () => {
    const headers = ['id', 'name', 'unit', 'stock', 'averageCost', 'lowStockThreshold'];
    const csvRows = [
        headers.join(','),
        ...stockItems.map(item => 
            [
                item.id,
                item.name,
                item.unit,
                item.stock,
                item.averageCost,
                item.lowStockThreshold
            ].join(',')
        ),
        `,Example Item,g,1000,250,200`
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'inventory_template.csv');
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
        let updatedStockList = [...stockItems];
        let addedCount = 0;
        let updatedCount = 0;

        lines.forEach((line, i) => {
            if (!line.trim()) return;
            const [id, name, unit, stock, averageCost, lowStockThreshold] = line.split(',');
            if (!name || !unit || stock === undefined || averageCost === undefined || lowStockThreshold === undefined) {
                console.warn(`Skipping row ${i+1} due to missing data.`);
                return;
            }

            const itemData = {
                name: name.trim(),
                unit: unit.trim(),
                stock: parseFloat(stock.trim()) || 0,
                averageCost: parseFloat(averageCost.trim()) || 0,
                lowStockThreshold: parseFloat(lowStockThreshold.trim()) || 0,
            };

            if (id && id.trim()) {
                const index = updatedStockList.findIndex(p => p.id === id.trim());
                if (index !== -1) {
                    updatedStockList[index] = { ...updatedStockList[index], ...itemData };
                    updatedCount++;
                } else {
                    updatedStockList.push({ ...itemData, id: `stock_${Date.now()}_${i}` });
                    addedCount++;
                }
            } else {
                updatedStockList.push({ ...itemData, id: `stock_${Date.now()}_${i}` });
                addedCount++;
            }
        });
        
        setStockItems(updatedStockList);
        alert(`Import complete! ${addedCount} items added, ${updatedCount} items updated.`);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const CsvHelpContent = () => (
    <>
      <h3 className="text-lg font-semibold text-on-surface">How to Import Inventory via CSV</h3>
      <p className="text-base">Follow these steps to correctly format and import your inventory data.</p>
      <ol className="list-decimal list-inside space-y-3">
        <li><strong>Download the Template:</strong> Click "Export" to get a pre-formatted CSV file.</li>
        <li><strong>Open and Edit:</strong> Open the file in a spreadsheet program.</li>
        <li><strong>Fill in Data:</strong> Add your stock items as new rows, following the guide below.
            <div className="mt-2 p-3 bg-surface-container rounded-lg text-sm">
                <h4 className="font-semibold mb-2">Column Guide:</h4>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>id</strong> (Optional): To update an existing item, use its ID. Leave blank to create a new item.</li>
                    <li><strong>name</strong> (Required): Name of the stock item (e.g., "Coffee Beans").</li>
                    <li><strong>unit</strong> (Required): Unit of measurement, must exist in Settings (e.g., g, ml, kg).</li>
                    <li><strong>stock</strong> (Required): Current quantity in stock (e.g., 5000).</li>
                    <li><strong>averageCost</strong> (Required): Average cost per unit in LBP (e.g., 250).</li>
                    <li><strong>lowStockThreshold</strong> (Required): Low stock warning level (e.g., 1000).</li>
                </ul>
            </div>
        </li>
        <li><strong>Save and Import:</strong> Save the file, then click "Import" to upload it.</li>
      </ol>
      <h4 className="font-semibold text-on-surface mt-2">Example Row (New Item):</h4>
      <code className="block bg-surface-container p-2 rounded-md text-sm font-mono">,Whole Milk,ml,10000,50,2000</code>
    </>
  );

  return (
    <div>
      {!isCompanyView && (
        <div className="flex justify-end items-center mb-4">
            <div className="flex gap-2">
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
                <button onClick={() => setIsReceiveModalOpen(true)} className="bg-tertiary-container text-on-tertiary-container py-2 px-4 rounded-full font-medium hover:bg-tertiary-container/80 transition-colors flex items-center gap-2 text-sm">
                  <PlusCircleIcon className="w-4 h-4" /> Receive Stock
                </button>
                <button onClick={openModalForNew} className="bg-primary text-on-primary py-2 px-5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                Add Item
                </button>
            </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-outline/20 bg-surface-container">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Name</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Current Stock</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Avg. Cost/Unit (LBP)</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Low Stock At</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {stockItems.map(item => {
                const stock = item.stock || 0;
                const lowStockThreshold = item.lowStockThreshold || 0;
                const averageCost = item.averageCost || 0;
                const unit = item.unit || '';
                const isLowStock = stock <= lowStockThreshold;

                return (
                  <tr key={item.id} className={`hover:bg-surface-container-high transition-colors ${isLowStock ? 'bg-error-container/30' : ''}`}>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">{item.name}</td>
                    <td className={`py-3 px-4 whitespace-nowrap text-right font-medium ${isLowStock ? 'text-error' : 'text-on-surface-variant'}`}>{stock.toFixed(2)} {unit}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant text-right">{averageCost.toFixed(2)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant text-right">{lowStockThreshold} {unit}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isCompanyView && (
                        <>
                          <button onClick={() => openModalForEdit(item)} className="text-primary hover:text-primary/80 mr-4"><EditIcon className="w-5 h-5"/></button>
                          <button onClick={() => handleDelete(item.id)} className="text-error hover:text-error/80"><TrashIcon className="w-5 h-5"/></button>
                        </>
                      )}
                    </td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
      {isModalOpen && !isCompanyView && (
        <StockItemFormModal 
            item={editingItem} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave} 
            inventoryUnits={inventoryUnits}
            shopInfo={shopInfo}
        />
      )}
      {isReceiveModalOpen && !isCompanyView && (
          <ReceiveStockModal 
            stockItems={stockItems}
            onClose={() => setIsReceiveModalOpen(false)}
            onReceive={handleReceiveStock}
          />
      )}
      {isHelpModalOpen && <HelpModal title="Inventory Import/Export Help" onClose={() => setIsHelpModalOpen(false)}><CsvHelpContent /></HelpModal>}
    </div>
  );
};

const StockItemFormModal: React.FC<{
  item: StockItem | null;
  onClose: () => void;
  onSave: (data: Omit<StockItem, 'id'> & { id?: string }) => void;
  inventoryUnits: string[];
  shopInfo: ShopInfoSettings;
}> = ({ item, onClose, onSave, inventoryUnits, shopInfo }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    unit: item?.unit || inventoryUnits[0] || 'pcs',
    stock: item?.stock || 0,
    lowStockThreshold: item?.lowStockThreshold || 0,
  });
  const [costLBP, setCostLBP] = useState<string>((item?.averageCost || 0).toString());
  const [costUSD, setCostUSD] = useState<string>(
    item ? (item.averageCost / shopInfo.usdToLbpRate).toFixed(2) : '0.00'
  );

  const handleCostLBPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lbpValueStr = e.target.value;
    setCostLBP(lbpValueStr);
    const lbpNumber = parseFloat(lbpValueStr) || 0;
    setCostUSD((lbpNumber / shopInfo.usdToLbpRate).toFixed(3));
  };
  
  const handleCostUSDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usdValueStr = e.target.value;
    setCostUSD(usdValueStr);
    const usdNumber = parseFloat(usdValueStr) || 0;
    setCostLBP(Math.round(usdNumber * shopInfo.usdToLbpRate).toString());
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      averageCost: parseFloat(costLBP) || 0
    });
  };
  
  return (
    <Modal title={item ? 'Edit Stock Item' : 'Add Stock Item'} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-on-surface-variant">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field"/>
            
            <label className="block text-sm font-medium text-on-surface-variant">Unit</label>
            <select name="unit" value={formData.unit} onChange={handleChange} className="input-field">
                {inventoryUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            
            <label className="block text-sm font-medium text-on-surface-variant">Initial Stock (if new item)</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} required step="any" className="input-field" disabled={!!item}/>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant">Initial Avg Cost/Unit (LBP)</label>
                <input type="number" value={costLBP} onChange={handleCostLBPChange} required step="any" className="input-field" disabled={!!item}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant">Initial Avg Cost/Unit (USD)</label>
                <input type="number" value={costUSD} onChange={handleCostUSDChange} required step="any" className="input-field" disabled={!!item}/>
              </div>
            </div>

            <label className="block text-sm font-medium text-on-surface-variant">Low Stock Threshold</label>
            <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} required step="any" className="input-field"/>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">Save</button>
            </div>
        </form>
    </Modal>
  )
}

const ReceiveStockModal: React.FC<{
    stockItems: StockItem[];
    onClose: () => void;
    onReceive: (itemId: string, quantity: number, costLBP: number, costUSD: number) => void;
}> = ({ stockItems, onClose, onReceive }) => {
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [costLBP, setCostLBP] = useState(0);
    const [costUSD, setCostUSD] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || quantity <= 0 || (costLBP < 0 && costUSD < 0)) {
            alert("Please fill out all fields correctly.");
            return;
        }
        if (costLBP === 0 && costUSD === 0) {
            if (!window.confirm("You have not entered a cost for this shipment. The average cost of the item will not change. Continue?")) {
                return;
            }
        }
        onReceive(selectedItem, quantity, costLBP, costUSD);
    };

    return (
        <Modal title="Receive Stock" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Item to Receive</label>
                    <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} required className="input-field">
                        <option value="" disabled>Select an item...</option>
                        {stockItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Quantity Received</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} required step="any" min="0.01" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Total Cost (LBP)</label>
                    <input type="number" value={costLBP} onChange={e => setCostLBP(parseFloat(e.target.value) || 0)} required step="any" min="0" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Total Cost (USD)</label>
                    <input type="number" value={costUSD} onChange={e => setCostUSD(parseFloat(e.target.value) || 0)} required step="any" min="0" className="input-field" />
                  </div>
                </div>
                 <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
                    <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">Add to Inventory</button>
                </div>
            </form>
        </Modal>
    );
};

export default InventoryManagement;
