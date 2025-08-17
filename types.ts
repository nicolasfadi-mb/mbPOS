export interface Branch {
    id: string;
    name: string;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  averageCost: number; // per unit
  lowStockThreshold: number;
}

export interface RecipeIngredient {
  stockItemId: string;
  quantity: number;
}

export interface Product {
  id:string;
  name: string;
  price: number;
  category: string;
  recipe: RecipeIngredient[];
  costOfGoodsSold: number;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface User {
  id:string;
  name: string;
  pin: string; // 4-digit PIN - reverted to be required on the client
  role: 'admin' | 'barista';
  accessibleBranchIds: string[] | 'all';
}

export interface Room {
    id: string;
    name: string;
    capacity: number;
    hourlyRate: number;
}

export interface Reservation {
  id:string;
  roomId: string;
  customerName: string;
  guests: number;
  
  scheduledStartTime: string; // ISO
  scheduledEndTime: string; // ISO

  actualStartTime: string | null; // ISO - Set on check-in
  actualEndTime: string | null; // ISO - Set on checkout

  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  items: OrderItem[];
}


export type PaymentMethod = 'cash' | 'card';

export interface TransactionItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    costOfGoodsSold: number; // COGS per item at time of sale
}

export interface Transaction {
    id: string;
    invoiceNumber: string;
    date: string; // ISO 8601 format
    items: TransactionItem[];
    subtotal: number; // LBP
    tax: number; // LBP
    total: number; // LBP
    paymentMethod: PaymentMethod;
    costOfGoodsSold: number; // LBP
    profit: number; // LBP
    rentalCharge?: number; // LBP
    reservationId?: string;
    
    amountPaidInCurrency?: number;
    paymentCurrency?: 'USD' | 'LBP';
    changeGiven: number; // Always in LBP
    usdToLbpRate: number;
}

export interface InvoiceNumberFormat {
    format: string; // e.g., "INV-{YYYY}-{seq}"
    nextNumber: number;
}

export interface InvoiceSettings {
    primaryFormat: InvoiceNumberFormat;
    useDualSystem: boolean;
    dualSystemPercentage: number; // e.g., 80 for 80%
    secondaryFormat: InvoiceNumberFormat;
}

export interface ShopInfoSettings {
    shopName: string;
    address: string;
    phone: string;
    website: string;
    footerMessage: string;
    usdToLbpRate: number;
}

export type LbpDenomination = 100000 | 50000 | 20000 | 10000 | 5000 | 1000;
export type UsdDenomination = 100 | 50 | 20 | 10 | 5 | 1;

export interface CashierInventory {
    LBP: Record<LbpDenomination, number>;
    USD: Record<UsdDenomination, number>;
}

export interface OverageEntry {
    id: string;
    date: string; // ISO 8601
    amount: number; // LBP
    invoiceNumber: string;
}

export interface BreakdownItem {
    note: number;
    currency: 'LBP' | 'USD';
    count: number;
}

export interface SessionTransaction {
  invoiceNumber: string;
  total: number;
  tenderedNotes: BreakdownItem[];
  changeNotes: BreakdownItem[];
}

export interface CashierSession {
  sessionId: string;
  userId: string;
  branchId: string;
  userName: string;
  startTime: string; // ISO
  endTime: string | null; // ISO, null if active
  startingInventory: CashierInventory;
  currentInventory: CashierInventory;
  overageLog: OverageEntry[];
  transactions: SessionTransaction[];
  isActive: boolean;
}

export interface CashBoxEntry {
  id: string;
  date: string; // ISO
  type: 'income' | 'expense';
  category: string; // e.g., "Sale", "Transfer to Main", "Office Supplies"
  description?: string; // Optional user-written note
  amountLBP: number; // positive number always
  amountUSD: number; // positive number always
  invoiceNumber?: string; // for sales
  isManual?: boolean; // To identify editable entries
}