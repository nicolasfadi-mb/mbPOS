




import React, { useState } from 'react';
import type { Product, User, Room, Transaction, Reservation, InvoiceSettings, StockItem, ShopInfoSettings, OverageEntry, CashierInventory, CashierSession, Branch, CashBoxEntry } from '../types';
import ProductManagement from './admin/ProductManagement';
import UserManagement from './admin/UserManagement';
import RoomManagement from './admin/RoomManagement';
import DailyReports from './admin/DailyReports';
import InventoryManagement from './admin/InventoryManagement';
import AccountingPage from './admin/AccountingPage';
import CashierMonitoring from './admin/CashierMonitoring';
import AdminReservationsView from './admin/AdminReservationsView';
import BranchManagement from './admin/BranchManagement';
import CashManagementPage from './admin/CashManagementPage';
import { TagIcon } from './icons/TagIcon';
import { UsersIcon } from './icons/UsersIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CogIcon } from './icons/CogIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { MonitorIcon } from './icons/MonitorIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { WalletIcon } from './icons/WalletIcon';
import { formatPrice } from '../constants';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';


interface AdminPageProps {
  isCompanyView: boolean;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  inventoryUnits: string[];
  setInventoryUnits: React.Dispatch<React.SetStateAction<string[]>>;
  transactions: Transaction[];
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  deletionPin: string;
  setDeletionPin: (pinAction: React.SetStateAction<string>) => Promise<void>;
  invoiceSettings: InvoiceSettings;
  setInvoiceSettings: React.Dispatch<React.SetStateAction<InvoiceSettings>>;
  shopInfo: ShopInfoSettings;
  setShopInfo: React.Dispatch<React.SetStateAction<ShopInfoSettings>>;
  cashierSessions: CashierSession[];
  onCreateReservation: (details: Omit<Reservation, 'id' | 'status' | 'items' | 'actualStartTime' | 'actualEndTime'>) => void;
  onCheckInReservation: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
  setActiveSessionId: (id: string) => void;
  branches: Branch[];
  onAddBranch: (name: string) => void;
  cashBoxByBranch: Record<string, CashBoxEntry[]>;
  mainCashBox: CashBoxEntry[];
  onSaveManualCashBoxEntry: (branchIdOrMain: string, entryData: Partial<CashBoxEntry> & { id?: string }) => void;
  onTransferToMainBox: (fromBranchId: string, amountLBP: number, amountUSD: number, description: string) => void;
  activeBranchId: string | null;
  cashBoxIncomeCategories: string[];
  setCashBoxIncomeCategories: React.Dispatch<React.SetStateAction<string[]>>;
  cashBoxExpenseCategories: string[];
  setCashBoxExpenseCategories: React.Dispatch<React.SetStateAction<string[]>>;
  pettyCashByBranch: Record<string, { lbp: number, usd: number }>;
  onFundPettyCash: (branchId: string, amountLBP: number, amountUSD: number, memo: string) => void;
}

type AdminTab = 'dashboard' | 'reports' | 'products' | 'inventory' | 'users' | 'rooms' | 'branches' | 'settings' | 'accounting' | 'cashier_monitoring' | 'reservations' | 'cash_box';

// --- WIDGET & DASHBOARD COMPONENTS ---
interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}
const Widget: React.FC<WidgetProps> = ({ title, children, className = '', actions }) => (
    <div className={`bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col border border-outline/10 ${className}`}>
        {(title || actions) && (
          <div className="flex justify-between items-center p-4 border-b border-outline/10 flex-shrink-0 h-[65px]">
              <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        <div className="p-4 flex-grow overflow-auto">
            {children}
        </div>
    </div>
);

const StatCard: React.FC<{ title: string, value: string | React.ReactNode, subtext?: string }> = ({ title, value, subtext }) => (
    <>
        <h3 className="text-base font-medium text-on-surface-variant">{title}</h3>
        {typeof value === 'string' ? (
             <p className="text-3xl font-bold text-on-surface mt-1">{value}</p>
        ) : (
            <div className="mt-1">{value}</div>
        )}
        {subtext && <p className="text-xs text-on-surface-variant/80 mt-1">{subtext}</p>}
    </>
);

const PriceDisplay: React.FC<{priceLBP: number, rate: number}> = ({priceLBP, rate}) => {
    const { usd, lbp } = formatPrice(priceLBP, rate);
    return (
        <div className="flex flex-col items-start leading-tight">
            <span className="text-3xl font-bold text-on-surface">{usd}</span>
            <span className="text-sm text-on-surface-variant/80 font-medium">{lbp}</span>
        </div>
    )
}

const DashboardWidgets: React.FC<{transactions: Transaction[], products: Product[], shopInfo: ShopInfoSettings}> = ({ transactions, products, shopInfo }) => {
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    };
    const todaysTransactions = transactions.filter(t => isToday(t.date));
    
    const totalRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCogs = todaysTransactions.reduce((sum, t) => sum + (t.costOfGoodsSold || 0), 0);
    const grossProfit = totalRevenue - totalCogs;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalOrders = todaysTransactions.length;

    const topSellingItems = todaysTransactions.flatMap(t => t.items).reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const sortedTopItems = Object.entries(topSellingItems).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return { name: product?.name || 'Unknown', quantity };
    }).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    const salesByCategory = todaysTransactions.flatMap(t => t.items).reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
        return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(salesByCategory).sort((a, b) => b[1] - a[1]);

    return (
        <>
            <Widget title="" className="col-span-12 sm:col-span-6 md:col-span-3"><StatCard title="Total Revenue" value={<PriceDisplay priceLBP={totalRevenue} rate={shopInfo.usdToLbpRate} />} subtext={`${totalOrders} orders`} /></Widget>
            <Widget title="" className="col-span-12 sm:col-span-6 md:col-span-3"><StatCard title="Gross Profit" value={<PriceDisplay priceLBP={grossProfit} rate={shopInfo.usdToLbpRate} />} subtext={`from ${totalOrders} orders`} /></Widget>
            <Widget title="" className="col-span-12 sm:col-span-6 md:col-span-3"><StatCard title="Profit Margin" value={`${profitMargin.toFixed(1)}%`} subtext="Gross profit / Revenue" /></Widget>
            <Widget title="" className="col-span-12 sm:col-span-6 md:col-span-3"><StatCard title="Total Orders" value={totalOrders.toString()} subtext="transactions today" /></Widget>
            
            <Widget title="Top Selling Items Today" className="col-span-12 md:col-span-6">
                {sortedTopItems.length > 0 ? (
                    <ul className="space-y-3">
                        {sortedTopItems.map((item, index) => (
                            <li key={index} className="flex justify-between items-center text-on-surface-variant text-sm">
                                <span className="font-medium">{item.name}</span>
                                <span className="font-bold text-on-surface">{item.quantity} sold</span>
                            </li>
                        ))}
                    </ul>
                 ) : (
                    <p className="text-on-surface-variant text-sm text-center py-4">No items sold yet today.</p>
                 )}
            </Widget>
            <Widget title="Sales by Category" className="col-span-12 md:col-span-6">
                {sortedCategories.length > 0 ? (
                    <ul className="space-y-3">
                        {sortedCategories.map(([category, revenue]) => {
                            const formattedRevenue = formatPrice(revenue, shopInfo.usdToLbpRate);
                            return (
                                <li key={category} className="flex justify-between items-center text-on-surface-variant text-sm">
                                    <span className="font-medium">{category}</span>
                                    <span className="font-bold text-on-surface">{formattedRevenue.usd}</span>
                                </li>
                            )
                        })}
                    </ul>
                 ) : (
                    <p className="text-on-surface-variant text-sm text-center py-4">No sales yet today.</p>
                 )}
            </Widget>
        </>
    )
}

// --- SETTINGS WIDGETS ---
const ShopInfoSettingsManager: React.FC<{settings: ShopInfoSettings, setSettings: React.Dispatch<React.SetStateAction<ShopInfoSettings>>}> = ({ settings, setSettings }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    React.useEffect(() => { setLocalSettings(settings); }, [settings]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalSettings(s => ({ ...s, [name]: name === 'usdToLbpRate' ? parseFloat(value) || 0 : value }));
    };
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); setSettings(localSettings); alert("Shop info saved!"); }
    const isChanged = JSON.stringify(settings) !== JSON.stringify(localSettings);
    return (
        <form onSubmit={handleSave} className="space-y-4">
            <label className="block text-sm font-medium text-on-surface-variant">Shop Name</label>
            <input type="text" name="shopName" value={localSettings.shopName} onChange={handleChange} className="input-field"/>
            <label className="block text-sm font-medium text-on-surface-variant">Address</label>
            <input type="text" name="address" value={localSettings.address} onChange={handleChange} className="input-field"/>
            <label className="block text-sm font-medium text-on-surface-variant">Phone Number</label>
            <input type="text" name="phone" value={localSettings.phone} onChange={handleChange} className="input-field"/>
            <label className="block text-sm font-medium text-on-surface-variant">Website</label>
            <input type="text" name="website" value={localSettings.website} onChange={handleChange} className="input-field"/>
            <label className="block text-sm font-medium text-on-surface-variant">Invoice Footer Message</label>
            <textarea name="footerMessage" value={localSettings.footerMessage} onChange={handleChange} rows={2} className="input-field"/>
            <label className="block text-sm font-medium text-on-surface-variant">USD to LBP Rate</label>
            <input type="number" name="usdToLbpRate" value={localSettings.usdToLbpRate} onChange={handleChange} className="input-field" step="any"/>
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={!isChanged} className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:bg-on-surface/20 disabled:text-on-surface/50">Save Details</button>
            </div>
        </form>
    );
};

const PinSettings: React.FC<{deletionPin: string, setDeletionPin: (pinAction: React.SetStateAction<string>) => Promise<void>}> = ({ deletionPin, setDeletionPin }) => {
    const [newPin, setNewPin] = useState(deletionPin);
    const [showSuccess, setShowSuccess] = useState(false);
    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (/^\d{0,4}$/.test(e.target.value)) setNewPin(e.target.value); };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length !== 4) { alert('PIN must be exactly 4 digits.'); return; }
        setDeletionPin(newPin);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-on-surface-variant">This 4-digit PIN is required for baristas to perform sensitive actions across all branches.</p>
            <input type="password" name="deletionPin" value={newPin} onChange={handlePinChange} maxLength={4} className="input-field text-lg tracking-[8px]" required />
            <div className="flex items-center justify-end space-x-4 pt-2">
                {showSuccess && <p className="text-green-600 text-sm font-medium">PIN saved!</p>}
                <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 disabled:bg-on-surface/20" disabled={newPin === deletionPin || newPin.length !== 4}>Save PIN</button>
            </div>
        </form>
    );
}

const InvoiceSettingsManager: React.FC<{settings: InvoiceSettings, setSettings: React.Dispatch<React.SetStateAction<InvoiceSettings>>}> = ({ settings, setSettings }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    React.useEffect(() => { setLocalSettings(settings); }, [settings]);
    const handlePrimaryFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(s => ({ ...s, primaryFormat: { ...s.primaryFormat, format: e.target.value } }));
    const handleSecondaryFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(s => ({ ...s, secondaryFormat: { ...s.secondaryFormat, format: e.target.value } }));
    const handleDualSystemToggle = (e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(s => ({ ...s, useDualSystem: e.target.checked }));
    const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings(s => ({ ...s, dualSystemPercentage: parseInt(e.target.value, 10) }));
    const handleResetPrimary = () => { if (window.confirm("Reset primary sequence to 1?")) setLocalSettings(s => ({...s, primaryFormat: {...s.primaryFormat, nextNumber: 1}})); }
    const handleResetSecondary = () => { if (window.confirm("Reset secondary sequence to 1?")) setLocalSettings(s => ({...s, secondaryFormat: {...s.secondaryFormat, nextNumber: 1}})); }
    const handleSave = () => { setSettings(localSettings); alert("Invoice settings saved!"); }
    const isChanged = JSON.stringify(settings) !== JSON.stringify(localSettings);
    return (
        <div className="space-y-6">
            <fieldset className="border border-outline/50 p-4 rounded-xl">
                <legend className="px-2 font-medium text-primary">Primary System</legend>
                <label className="block text-sm font-medium text-on-surface-variant">Format</label>
                <input type="text" value={localSettings.primaryFormat.format} onChange={handlePrimaryFormatChange} className="input-field"/>
                <p className="text-xs text-on-surface-variant/80 mt-1">Placeholders: {"{YYYY}, {MM}, {DD}, {seq}"}</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-on-surface-variant">Next number: <span className="font-bold">{localSettings.primaryFormat.nextNumber}</span></p>
                    <button onClick={handleResetPrimary} className="text-xs font-medium text-error hover:underline">Reset</button>
                </div>
            </fieldset>
            <div className="flex items-center space-x-3"><input type="checkbox" id="useDualSystem" checked={localSettings.useDualSystem} onChange={handleDualSystemToggle} className="h-4 w-4 rounded text-primary focus:ring-primary"/><label htmlFor="useDualSystem" className="font-medium text-on-surface-variant">Enable Dual Invoicing</label></div>
            {localSettings.useDualSystem && (
                <fieldset className="border border-outline/50 p-4 rounded-xl space-y-4">
                    <legend className="px-2 font-medium text-primary">Secondary System</legend>
                    <label className="block text-sm font-medium text-on-surface-variant">Split Percentage</label>
                    <div className="flex items-center gap-4"><input type="range" min="0" max="100" value={localSettings.dualSystemPercentage} onChange={handlePercentageChange} className="w-full h-2 bg-surface-container-high rounded-lg cursor-pointer accent-primary"/><span className="font-bold text-primary w-28 text-center">{localSettings.dualSystemPercentage}% / {100 - localSettings.dualSystemPercentage}%</span></div>
                    <label className="block text-sm font-medium text-on-surface-variant">Secondary Format</label>
                    <input type="text" value={localSettings.secondaryFormat.format} onChange={handleSecondaryFormatChange} className="input-field"/>
                    <div className="flex justify-between items-center mt-2"><p className="text-sm text-on-surface-variant">Next number: <span className="font-bold">{localSettings.secondaryFormat.nextNumber}</span></p><button onClick={handleResetSecondary} className="text-xs font-medium text-error hover:underline">Reset</button></div>
                </fieldset>
            )}
            <div className="flex justify-end pt-2"><button onClick={handleSave} disabled={!isChanged} className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 disabled:bg-on-surface/20">Save</button></div>
        </div>
    )
}

const UnitSettingsManager: React.FC<{units: string[], setUnits: React.Dispatch<React.SetStateAction<string[]>>, stockItems: StockItem[]}> = ({ units, setUnits, stockItems }) => {
    const [newUnit, setNewUnit] = useState('');
    const handleAdd = (e: React.FormEvent) => { e.preventDefault(); const trimmed = newUnit.trim(); if (trimmed && !units.some(u => u.toLowerCase() === trimmed.toLowerCase())) { setUnits([...units, trimmed]); setNewUnit(''); } else if (trimmed) { alert('This unit already exists.'); } };
    const handleDelete = (unitToDelete: string) => { if (units.length <= 1) { alert('You must have at least one unit.'); return; } if (stockItems.some(item => item.unit === unitToDelete)) { alert('Cannot delete unit. It is in use by stock items.'); return; } if (window.confirm(`Delete "${unitToDelete}"?`)) { setUnits(units.filter(u => u !== unitToDelete)); } };
    return (
        <div>
            <p className="text-sm text-on-surface-variant mb-4">Manage units of measurement for stock items (e.g., g, ml, pcs, kg).</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">{units.map(unit => (<div key={unit} className="flex justify-between items-center bg-surface-container p-2 rounded-lg"><span className="font-medium text-on-surface">{unit}</span><button onClick={() => handleDelete(unit)} className="text-error/80 hover:text-error"><TrashIcon className="w-5 h-5"/></button></div>))}</div>
            <form onSubmit={handleAdd} className="flex items-center gap-2"><input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Add new unit..." className="input-field flex-grow !mt-0" /><button type="submit" className="bg-secondary-container text-on-secondary-container py-3 px-4 rounded-lg font-medium hover:bg-secondary-container/80">Add</button></form>
        </div>
    );
};

const CashBoxCategoryManager: React.FC<{
    cashBoxIncomeCategories: string[], 
    setCashBoxIncomeCategories: React.Dispatch<React.SetStateAction<string[]>>, 
    cashBoxExpenseCategories: string[], 
    setCashBoxExpenseCategories: React.Dispatch<React.SetStateAction<string[]>>, 
    cashBoxByBranch: Record<string, CashBoxEntry[]>, 
    mainCashBox: CashBoxEntry[]
}> = ({ cashBoxIncomeCategories, setCashBoxIncomeCategories, cashBoxExpenseCategories, setCashBoxExpenseCategories, cashBoxByBranch, mainCashBox }) => {
    const isCategoryInUse = (cat: string): boolean => { const allEntries = [...Object.values(cashBoxByBranch).flat(), ...mainCashBox]; if (['Sale', 'Transfer to Main', 'Transfer from Branch'].includes(cat)) return true; return allEntries.some(e => e.category === cat); };
    const CategoryList: React.FC<{title: string, categories: string[], setCategories: React.Dispatch<React.SetStateAction<string[]>>}> = ({ title, categories, setCategories }) => {
        const [newCat, setNewCat] = useState('');
        const handleAdd = (e: React.FormEvent) => { e.preventDefault(); const t = newCat.trim(); if (t && !categories.some(c => c.toLowerCase() === t.toLowerCase())) { setCategories(p => [...p, t]); setNewCat(''); } else if (t) { alert('Category exists.'); } };
        const handleDelete = (cat: string) => { if (isCategoryInUse(cat)) { alert('Cannot delete category in use.'); return; } if (window.confirm(`Delete "${cat}"?`)) setCategories(p => p.filter(c => c !== cat)); };
        return (
            <div>
                <h4 className="font-semibold text-on-surface mb-2">{title}</h4>
                <div className="space-y-2 mb-3 max-h-36 overflow-y-auto pr-2">{categories.map(c => (<div key={c} className="flex justify-between items-center bg-surface-container p-2 rounded-lg"><span className="font-medium text-on-surface text-sm">{c}</span><button onClick={() => handleDelete(c)} className="text-error/80 hover:text-error"><TrashIcon className="w-4 h-4"/></button></div>))}</div>
                <form onSubmit={handleAdd} className="flex items-center gap-2"><input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Add new..." className="input-field !mt-0 text-sm py-2"/><button type="submit" className="bg-secondary-container text-on-secondary-container py-2 px-3 rounded-lg font-medium text-sm">Add</button></form>
            </div>
        );
    };
    return (
        <div><p className="text-sm text-on-surface-variant mb-4">Manage categories for manual income and expense entries in the cash box.</p><div className="grid grid-cols-1 gap-6"><CategoryList title="Income Categories" categories={cashBoxIncomeCategories} setCategories={setCashBoxIncomeCategories} /><CategoryList title="Expense Categories" categories={cashBoxExpenseCategories} setCategories={setCashBoxExpenseCategories} /></div></div>
    );
};


// --- MAIN COMPONENT ---
const AdminPage: React.FC<AdminPageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5"/> },
    { id: 'cashier_monitoring', label: 'Monitoring', icon: <MonitorIcon className="w-5 h-5"/> },
    { id: 'reports', label: 'Reports', icon: <CalendarIcon className="w-5 h-5"/> },
    { id: 'cash_box', label: 'Cash Box', icon: <WalletIcon className="w-5 h-5"/> },
    { id: 'reservations', label: 'Reservations', icon: <CalendarDaysIcon className="w-5 h-5"/> },
    { id: 'products', label: 'Products', icon: <TagIcon className="w-5 h-5"/> },
    { id: 'inventory', label: 'Inventory', icon: <ArchiveIcon className="w-5 h-5"/> },
    { id: 'users', label: 'Users', icon: <UsersIcon className="w-5 h-5"/> },
    { id: 'rooms', label: 'Rooms', icon: <HomeIcon className="w-5 h-5"/> },
    { id: 'branches', label: 'Branches', icon: <BuildingOfficeIcon className="w-5 h-5"/> },
    { id: 'settings', label: 'Settings', icon: <CogIcon className="w-5 h-5"/> },
    { id: 'accounting', label: 'Accounting', icon: <DocumentTextIcon className="w-5 h-5"/> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardWidgets transactions={props.transactions} products={props.products} shopInfo={props.shopInfo}/>;
      case 'cashier_monitoring': return <Widget title="" className="col-span-12"><CashierMonitoring {...props}/></Widget>;
      case 'reports': return <Widget title="" className="col-span-12"><DailyReports {...props}/></Widget>;
      case 'cash_box': return <Widget title="" className="col-span-12"><CashManagementPage {...props}/></Widget>;
      case 'reservations': return <Widget title="" className="col-span-12"><AdminReservationsView {...props}/></Widget>;
      case 'products': return <Widget title="" className="col-span-12"><ProductManagement {...props}/></Widget>;
      case 'inventory': return <Widget title="" className="col-span-12"><InventoryManagement {...props}/></Widget>;
      case 'users': return <Widget title="" className="col-span-12"><UserManagement {...props}/></Widget>;
      case 'rooms': return <Widget title="" className="col-span-12"><RoomManagement {...props}/></Widget>;
      case 'branches': return <Widget title="" className="col-span-12"><BranchManagement {...props}/></Widget>;
      case 'accounting': return <Widget title="" className="col-span-12"><AccountingPage transactions={props.transactions} shopInfo={props.shopInfo}/></Widget>;
      case 'settings': return (
        <>
          <Widget title="Global Manager PIN" className="col-span-12 lg:col-span-5"><PinSettings deletionPin={props.deletionPin} setDeletionPin={props.setDeletionPin} /></Widget>
          <Widget title="Inventory Units" className="col-span-12 lg:col-span-7"><UnitSettingsManager units={props.inventoryUnits} setUnits={props.setInventoryUnits} stockItems={props.stockItems} /></Widget>
          <Widget title="Shop & Invoice Details" className="col-span-12 lg:col-span-6"><ShopInfoSettingsManager settings={props.shopInfo} setSettings={props.setShopInfo} /></Widget>
          <Widget title="Invoice Numbering" className="col-span-12 lg:col-span-6"><InvoiceSettingsManager settings={props.invoiceSettings} setSettings={props.setInvoiceSettings} /></Widget>
          <Widget title="Cash Box Categories" className="col-span-12"><CashBoxCategoryManager {...props} /></Widget>
        </>
      );
      default: return null;
    }
  }

  return (
    <div className="flex h-[calc(100vh-88px)] bg-surface-container-low">
      <nav className="w-60 bg-surface-container p-4 flex-shrink-0 flex flex-col gap-1 border-r border-outline/10">
        {adminTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center space-x-3 px-4 py-2.5 font-semibold text-sm transition-colors w-full text-left rounded-xl
              ${activeTab === tab.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-grow p-4 md:p-6 overflow-auto">
        <div className="grid grid-cols-12 gap-6 auto-rows-min">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;