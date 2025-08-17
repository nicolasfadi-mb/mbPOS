import type { Branch, CashBoxEntry, CashierSession, InvoiceSettings, Product, Reservation, Room, ShopInfoSettings, StockItem, Transaction, User } from '../types';

// Type definition for the API exposed by the preload script
interface IpcApi {
  get: <T>(endpoint: string) => Promise<T>;
  post: <T>(endpoint: string, body: any) => Promise<T>;
}

// Augment the window object with our new `api` property
declare global {
  interface Window {
    api: IpcApi;
  }
}

// Default values for settings, used if they don't exist for a branch
export const INITIAL_INVOICE_SETTINGS: InvoiceSettings = {
    primaryFormat: { format: 'INV-{YYYY}{MM}-{seq}', nextNumber: 1 },
    useDualSystem: false,
    dualSystemPercentage: 80,
    secondaryFormat: { format: 'ALT-{YYYY}{MM}-{seq}', nextNumber: 1 },
};
export const INITIAL_SHOP_INFO_SETTINGS: ShopInfoSettings = {
    shopName: 'New Branch',
    address: '123 Main Street',
    phone: '555-1234',
    website: 'www.example.com',
    footerMessage: 'Thank you!',
    usdToLbpRate: 90000,
};


// --- API Abstraction ---
const get = <T>(endpoint: string): Promise<T> => window.api.get(endpoint);
const post = <T>(endpoint: string, body: any): Promise<T> => window.api.post(endpoint, body);

// --- Combined Getter ---
export const getAllData = () => get<any>('/api/all-data.php');

// --- SETTERS / MUTATIONS ---

// Global setters
export const setUsers = (users: User[]) => post<User[]>('/api/users.php', users);
export const setDeletionPin = (pin: string) => post<string>('/api/deletion-pin.php', { pin });

// Branch-specific setters
const createBranchSetter = <T>(dataType: string) => 
    (branchId: string, data: T) => post<T>(`/api/${dataType}.php?branchId=${branchId}`, data);

export const setProducts = createBranchSetter<Product[]>('products');
export const setRooms = createBranchSetter<Room[]>('rooms');
export const setStockItems = createBranchSetter<StockItem[]>('stockItems');
export const setInventoryUnits = createBranchSetter<string[]>('inventoryUnits');
export const setInvoiceSettings = createBranchSetter<InvoiceSettings>('invoiceSettings');
export const setReservations = createBranchSetter<Reservation[]>('reservations');
export const setShopInfo = createBranchSetter<ShopInfoSettings>('shopInfo');
export const setTransactions = createBranchSetter<Transaction[]>('transactions');
export const setCashierSessions = createBranchSetter<CashierSession[]>('cashierSessions');
export const setCashBoxEntries = createBranchSetter<CashBoxEntry[]>('cashBoxEntries');
export const setCashBoxIncomeCategories = createBranchSetter<string[]>('cashBoxIncomeCategories');
export const setCashBoxExpenseCategories = createBranchSetter<string[]>('cashBoxExpenseCategories');

// --- COMPLEX OPERATIONS ---

export const addBranch = async (name: string): Promise<Branch[]> => {
    return post('/api/branches.php', { name });
};

export const generateInvoiceNumber = async (branchId: string): Promise<{ invoiceNumber: string, settings: InvoiceSettings }> => {
    return get(`/api/invoice-number.php?branchId=${branchId}`);
};

export const saveManualCashBoxEntry = async (branchIdOrMain: string, entryData: Partial<CashBoxEntry> & { id?: string }): Promise<CashBoxEntry[]> => {
    return post(`/api/cash-box-entry.php?target=${branchIdOrMain}`, entryData);
};

export const transferToMainBox = async (fromBranchId: string, amountLBP: number, amountUSD: number, memo: string): Promise<{ updatedBranchBox: CashBoxEntry[], updatedMainBox: CashBoxEntry[] }> => {
    return post('/api/transfer-to-main.php', { fromBranchId, amountLBP, amountUSD, memo });
};

export const fundPettyCash = async (branchId: string, amountLBP: number, amountUSD: number, memo: string): Promise<{ updatedCashBox: CashBoxEntry[], updatedPettyCash: { lbp: number; usd: number; } }> => {
    return post(`/api/fund-petty-cash.php?branchId=${branchId}`, { amountLBP, amountUSD, memo });
};

export const logPettyCashExpense = async (branchId: string, expenseData: { category: string, description: string | undefined, amountLBP: number, amountUSD: number }): Promise<{ updatedCashBox: CashBoxEntry[], updatedPettyCash: { lbp: number; usd: number; } }> => {
    return post(`/api/log-petty-cash-expense.php?branchId=${branchId}`, expenseData);
};
