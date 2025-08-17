
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Product, OrderItem, User, Room, Reservation, Transaction, PaymentMethod, InvoiceSettings, TransactionItem, StockItem, ShopInfoSettings, CashierInventory, OverageEntry, CashierSession, SessionTransaction, BreakdownItem, Branch, CashBoxEntry } from './types';
import { INITIAL_DELETION_PIN, TAX_RATE } from './constants';
import * as api from './services/api';
import LoginScreen from './components/LoginScreen';
import AdminPage from './components/AdminPage';
import POSView from './components/POSView';
import { CoffeeIcon } from './components/icons/CoffeeIcon';
import CheckoutModal from './components/CheckoutModal';
import PinVerificationModal from './components/PinVerificationModal';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';
import { LayoutDashboardIcon } from './components/icons/LayoutDashboardIcon';
import ReservationsTimelineModal from './components/ReservationsTimelineModal';
import StartNowModal from './components/StartNowModal';
import CashierSetupModal from './components/CashierSetupModal';
import { ArrowRightArrowLeftIcon } from './components/icons/ArrowRightArrowLeftIcon';
import ChangeBreakdownModal from './components/ChangeBreakdownModal';
import CashierHandoverModal from './components/CashierHandoverModal';
import BranchSelectionScreen from './components/BranchSelectionScreen';
import { ChevronDownIcon } from './components/icons/ChevronDownIcon';
import { BanknoteIcon } from './components/icons/BanknoteIcon';
import PettyCashModal from './components/PettyCashModal';

const COMPANY_VIEW_ID = 'company_view_id';

const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Global States
  const [users, _setUsers] = useState<User[]>([]);
  const [deletionPin, setDeletionPin] = useState<string>(INITIAL_DELETION_PIN);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Branch-specific States
  const [productsByBranch, setProductsByBranch] = useState<Record<string, Product[]>>({});
  const [roomsByBranch, setRoomsByBranch] = useState<Record<string, Room[]>>({});
  const [stockItemsByBranch, setStockItemsByBranch] = useState<Record<string, StockItem[]>>({});
  const [inventoryUnitsByBranch, setInventoryUnitsByBranch] = useState<Record<string, string[]>>({});
  const [invoiceSettingsByBranch, setInvoiceSettingsByBranch] = useState<Record<string, InvoiceSettings>>({});
  const [reservationsByBranch, setReservationsByBranch] = useState<Record<string, Reservation[]>>({});
  const [shopInfoByBranch, setShopInfoByBranch] = useState<Record<string, ShopInfoSettings>>({});
  const [transactionsByBranch, setTransactionsByBranch] = useState<Record<string, Transaction[]>>({});
  const [cashierSessionsByBranch, setCashierSessionsByBranch] = useState<Record<string, CashierSession[]>>({});
  const [cashBoxByBranch, setCashBoxByBranch] = useState<Record<string, CashBoxEntry[]>>({});
  const [cashBoxIncomeCategoriesByBranch, setCashBoxIncomeCategoriesByBranch] = useState<Record<string, string[]>>({});
  const [cashBoxExpenseCategoriesByBranch, setCashBoxExpenseCategoriesByBranch] = useState<Record<string, string[]>>({});
  const [pettyCashByBranch, setPettyCashByBranch] = useState<Record<string, { lbp: number; usd: number }>>({});


  // Company-wide State
  const [mainCashBox, setMainCashBox] = useState<CashBoxEntry[]>([]);

  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userForBranchSelection, setUserForBranchSelection] = useState<User | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [view, setView] = useState<'pos' | 'admin'>('pos');
  
  const [walkInOrderItems, setWalkInOrderItems] = useState<OrderItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('walk-in');

  const [sessionToCheckout, setSessionToCheckout] = useState<{items: OrderItem[], reservation: Reservation | null}>({ items: [], reservation: null });

  const [isCheckoutVisible, setCheckoutVisible] = useState(false);
  const [isTimelineModalVisible, setTimelineModalVisible] = useState(false);
  const [isStartNowModalVisible, setStartNowModalVisible] = useState(false);
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [isChangeBreakdownModalVisible, setChangeBreakdownModalVisible] = useState(false);
  const [isPettyCashModalVisible, setPettyCashModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [rentalCharge, setRentalCharge] = useState(0);

  const [userPendingLogin, setUserPendingLogin] = useState<User | null>(null);
  const [handoverSession, setHandoverSession] = useState<CashierSession | null>(null);
  const [isHandoverModalVisible, setHandoverModalVisible] = useState(false);

  // Load all data from API on initial mount
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getAllData();
        
        _setUsers(data.users || []);
        setDeletionPin(data.deletionPin || INITIAL_DELETION_PIN);
        setBranches(data.branches || []);
        setProductsByBranch(data.products || {});
        setRoomsByBranch(data.rooms || {});
        setStockItemsByBranch(data.stockItems || {});
        setInventoryUnitsByBranch(data.inventoryUnits || {});
        setInvoiceSettingsByBranch(data.invoiceSettings || {});
        setReservationsByBranch(data.reservations || {});
        setShopInfoByBranch(data.shopInfo || {});
        setTransactionsByBranch(data.transactions || {});
        setCashierSessionsByBranch(data.cashierSessions || {});
        setCashBoxByBranch(data.cashBox || {});
        setMainCashBox(data.mainCashBox || []);
        setCashBoxIncomeCategoriesByBranch(data.cashBoxIncomeCategories || {});
        setCashBoxExpenseCategoriesByBranch(data.cashBoxExpenseCategories || {});
        setPettyCashByBranch(data.pettyCash || {});
      } catch (error) {
        console.error("Failed to load initial data:", error);
        alert("Could not connect to the server. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  const isCompanyView = activeBranchId === COMPANY_VIEW_ID;

  // Derived state for active branch data or aggregated company data
  const {
    products, rooms, stockItems, inventoryUnits, invoiceSettings,
    reservations, shopInfo, transactions, cashierSessions, cashBox,
    cashBoxIncomeCategories, cashBoxExpenseCategories
  } = useMemo(() => {
    const id = activeBranchId;
    if (isCompanyView) {
      return {
        products: Object.values(productsByBranch).flat(),
        rooms: Object.values(roomsByBranch).flat(),
        stockItems: Object.values(stockItemsByBranch).flat(),
        reservations: Object.values(reservationsByBranch).flat(),
        transactions: Object.values(transactionsByBranch).flat(),
        cashierSessions: Object.entries(cashierSessionsByBranch).flatMap(([branchId, sessions]) =>
            sessions.map(s => ({ ...s, branchId: s.branchId || branchId }))
        ),
        inventoryUnits: [],
        invoiceSettings: api.INITIAL_INVOICE_SETTINGS,
        shopInfo: { ...api.INITIAL_SHOP_INFO_SETTINGS, shopName: 'Whole Company View' },
        cashBox: [],
        cashBoxIncomeCategories: [],
        cashBoxExpenseCategories: [],
      };
    }
    
    if (!id) {
        return {
            products: [], rooms: [], stockItems: [], inventoryUnits: [], reservations: [],
            transactions: [], cashierSessions: [], cashBox: [], cashBoxIncomeCategories: [],
            cashBoxExpenseCategories: [],
            invoiceSettings: api.INITIAL_INVOICE_SETTINGS,
            shopInfo: api.INITIAL_SHOP_INFO_SETTINGS
        };
    }
    
    return {
        products: productsByBranch[id] || [],
        rooms: roomsByBranch[id] || [],
        stockItems: stockItemsByBranch[id] || [],
        inventoryUnits: inventoryUnitsByBranch[id] || [],
        invoiceSettings: invoiceSettingsByBranch[id] || api.INITIAL_INVOICE_SETTINGS,
        reservations: reservationsByBranch[id] || [],
        shopInfo: shopInfoByBranch[id] || { ...api.INITIAL_SHOP_INFO_SETTINGS, shopName: branches.find(b => b.id === id)?.name || 'New Branch' },
        transactions: transactionsByBranch[id] || [],
        cashierSessions: (cashierSessionsByBranch[id] || []).map(s => ({...s, branchId: s.branchId || id })),
        cashBox: cashBoxByBranch[id] || [],
        cashBoxIncomeCategories: cashBoxIncomeCategoriesByBranch[id] || [],
        cashBoxExpenseCategories: cashBoxExpenseCategoriesByBranch[id] || [],
    };
  }, [isCompanyView, activeBranchId, branches, productsByBranch, roomsByBranch, stockItemsByBranch, inventoryUnitsByBranch, invoiceSettingsByBranch, reservationsByBranch, shopInfoByBranch, transactionsByBranch, cashierSessionsByBranch, cashBoxByBranch, cashBoxIncomeCategoriesByBranch, cashBoxExpenseCategoriesByBranch]);
  
  const readOnlySetter = useCallback(() => {
    if (isCompanyView) {
      console.warn("Write operations are disabled in company-wide view.");
      return true;
    }
    if (!activeBranchId) {
        console.error("No active branch selected for write operation.");
        return true;
    }
    return false;
  }, [isCompanyView, activeBranchId]);

  // WRAPPER SETTERS
  const setUsers = (newUsers: React.SetStateAction<User[]>) => {
    const data = typeof newUsers === 'function' ? (newUsers as (prevState: User[]) => User[])(users) : newUsers;
    api.setUsers(data).then(_setUsers);
  };
    
  const setApiData = <T,>(
    apiFn: (branchId: string, data: T) => Promise<T>, 
    stateByBranch: Record<string, T>,
    setter: React.Dispatch<React.SetStateAction<Record<string, T>>>, 
    dataOrFn: React.SetStateAction<T>,
    initialValue: T
  ) => {
    if (readOnlySetter()) return;
    const branchId = activeBranchId;
    if (!branchId) return;
    
    const currentData = stateByBranch[branchId] ?? initialValue;
    const newData = typeof dataOrFn === 'function' 
        ? (dataOrFn as (prevState: T) => T)(currentData) 
        : dataOrFn;

    // Optimistic update
    setter(prev => ({ ...prev, [branchId]: newData }));
    
    // Fire and forget API call, with error handling
    apiFn(branchId, newData).catch(err => {
        console.error("API sync failed, reverting state", err);
        // Revert state on error
        setter(prev => ({...prev, [branchId]: currentData }));
        alert("Failed to save changes to the server. Your changes have been reverted.");
    });
  };

  const setProducts = (data: React.SetStateAction<Product[]>) => setApiData(api.setProducts, productsByBranch, setProductsByBranch, data, []);
  const setRooms = (data: React.SetStateAction<Room[]>) => setApiData(api.setRooms, roomsByBranch, setRoomsByBranch, data, []);
  const setStockItems = (data: React.SetStateAction<StockItem[]>) => setApiData(api.setStockItems, stockItemsByBranch, setStockItemsByBranch, data, []);
  const setInventoryUnits = (data: React.SetStateAction<string[]>) => setApiData(api.setInventoryUnits, inventoryUnitsByBranch, setInventoryUnitsByBranch, data, []);
  const setInvoiceSettings = (data: React.SetStateAction<InvoiceSettings>) => setApiData(api.setInvoiceSettings, invoiceSettingsByBranch, setInvoiceSettingsByBranch, data, api.INITIAL_INVOICE_SETTINGS);
  const setReservations = (data: React.SetStateAction<Reservation[]>) => setApiData(api.setReservations, reservationsByBranch, setReservationsByBranch, data, []);
  const setShopInfo = (data: React.SetStateAction<ShopInfoSettings>) => setApiData(api.setShopInfo, shopInfoByBranch, setShopInfoByBranch, data, api.INITIAL_SHOP_INFO_SETTINGS);
  const setTransactions = (data: React.SetStateAction<Transaction[]>) => setApiData(api.setTransactions, transactionsByBranch, setTransactionsByBranch, data, []);
  const setCashierSessions = (data: React.SetStateAction<CashierSession[]>) => setApiData(api.setCashierSessions, cashierSessionsByBranch, setCashierSessionsByBranch, data, []);
  const setCashBox = (data: React.SetStateAction<CashBoxEntry[]>) => setApiData(api.setCashBoxEntries, cashBoxByBranch, setCashBoxByBranch, data, []);
  const setCashBoxIncomeCategories = (data: React.SetStateAction<string[]>) => setApiData(api.setCashBoxIncomeCategories, cashBoxIncomeCategoriesByBranch, setCashBoxIncomeCategoriesByBranch, data, []);
  const setCashBoxExpenseCategories = (data: React.SetStateAction<string[]>) => setApiData(api.setCashBoxExpenseCategories, cashBoxExpenseCategoriesByBranch, setCashBoxExpenseCategoriesByBranch, data, []);
  
  const activeCashierSession = currentUser && activeBranchId && !isCompanyView ? cashierSessions.find(s => s.userId === currentUser.id && s.isActive) : null;
  const activeReservations = useMemo(() => reservations.filter(r => r.status === 'active'), [reservations]);
  
  const handleLogin = (user: User, pin: string): boolean => {
    const foundUser = users.find(u => u.id === user.id);
    if (foundUser && foundUser.pin === pin) {
        setUserForBranchSelection(foundUser);
        return true;
    }
    alert('Invalid PIN');
    return false;
  };
  
  const handleBranchSelected = (branchId: string, user: User) => {
    if (branchId === COMPANY_VIEW_ID && user.role === 'admin') {
      setActiveBranchId(COMPANY_VIEW_ID);
      setCurrentUser(user);
      setView('admin');
      setUserForBranchSelection(null);
      return;
    }

    setActiveBranchId(branchId);
    setUserForBranchSelection(null);

    const branchCashierSessions = cashierSessionsByBranch[branchId] || [];
    
    if (user.role === 'barista') {
      const todaysSessions = branchCashierSessions.filter(s => isToday(s.startTime));
      const sameUserSessionToday = todaysSessions.find(s => s.userId === user.id);

      if (sameUserSessionToday) {
        if (!sameUserSessionToday.isActive) {
          setCashierSessions(prev => prev.map(s => s.sessionId === sameUserSessionToday.sessionId ? { ...s, isActive: true, endTime: null } : s));
        }
        setCurrentUser(user);
        setView('pos');
        return;
      }
      
      const lastEndedSessionToday = todaysSessions
        .filter(s => !s.isActive && s.endTime)
        .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())[0];

      if (lastEndedSessionToday) {
        setUserPendingLogin(user);
        setHandoverSession(lastEndedSessionToday);
        setHandoverModalVisible(true);
        return;
      }

      setCurrentUser(user);
      setView('pos');
    } else { // Admin login
      setCurrentUser(user);
      setView('admin');
    }
  };

  const handleLogout = () => {
    if(!isCompanyView && currentUser && activeCashierSession) {
        setCashierSessions(prev => prev.map(s => 
            s.sessionId === activeCashierSession.sessionId ? { ...s, isActive: false, endTime: new Date().toISOString() } : s
        ));
    }
    setCurrentUser(null);
    setActiveBranchId(null);
    setWalkInOrderItems([]);
    setActiveSessionId('walk-in');
  };
  
  const handleAddBranch = async (name: string) => {
    const newBranches = await api.addBranch(name);
    setBranches(newBranches);
  };

  const handleSessionStart = (startingInventory: CashierInventory) => {
    if (!currentUser || readOnlySetter()) return;
    const newSession: CashierSession = {
        sessionId: `ses_${Date.now()}`,
        userId: currentUser.id,
        branchId: activeBranchId!,
        userName: currentUser.name,
        startTime: new Date().toISOString(),
        endTime: null,
        startingInventory,
        currentInventory: startingInventory,
        overageLog: [],
        transactions: [],
        isActive: true,
    };
    setCashierSessions(prev => [ ...prev.map(s => s.userId === currentUser.id ? {...s, isActive: false} : s), newSession ]);
  };
  
  const handleConfirmHandover = () => {
    if (!userPendingLogin || !handoverSession || !activeBranchId) return;
    const newSession: CashierSession = {
        sessionId: `ses_${Date.now()}`,
        userId: userPendingLogin.id,
        branchId: activeBranchId,
        userName: userPendingLogin.name,
        startTime: new Date().toISOString(),
        endTime: null,
        startingInventory: handoverSession.currentInventory,
        currentInventory: handoverSession.currentInventory,
        overageLog: [],
        transactions: [],
        isActive: true,
    };
    setCashierSessions(prev => [ ...prev.map(s => s.userId === userPendingLogin.id ? {...s, isActive: false} : s), newSession ]);
    setCurrentUser(userPendingLogin);
    setView('pos');
    setHandoverModalVisible(false);
    setHandoverSession(null);
    setUserPendingLogin(null);
  };
  
  const handleDeclineHandover = () => {
    if (!userPendingLogin) return;
    setCurrentUser(userPendingLogin);
    setView('pos');
    setHandoverModalVisible(false);
    setHandoverSession(null);
    setUserPendingLogin(null);
  };
  
  const getActiveSession = () => {
      if (activeSessionId === 'walk-in') return { items: walkInOrderItems, setter: setWalkInOrderItems, reservation: null }
      const reservation = reservations.find(r => r.id === activeSessionId);
      const setter = (updater: React.SetStateAction<OrderItem[]>) => {
          const newItems = typeof updater === 'function' ? updater(reservation?.items || []) : updater;
          setReservations(prev => prev.map(r => r.id === activeSessionId ? { ...r, items: newItems } : r));
      };
      return { items: reservation?.items || [], setter, reservation: reservation || null }
  }

  const handleActionWithPin = (action: () => void) => {
    if (currentUser?.role === 'admin') action();
    else { setPendingAction(() => action); setPinModalVisible(true); }
  };
  
  const handleClearOrder = useCallback(() => {
    const action = () => {
        const { setter, reservation } = getActiveSession();
        setter([]);
        if (!reservation) setActiveSessionId('walk-in');
    };
    handleActionWithPin(action);
  }, [activeSessionId, reservations, walkInOrderItems, currentUser?.role]);

  const handleAddToCart = useCallback((product: Product, quantity: number) => {
    const { setter } = getActiveSession();
    setter(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) return prevItems.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prevItems, { product, quantity }];
    });
  }, [activeSessionId, reservations, walkInOrderItems]);

  const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
    const { setter } = getActiveSession();
    if (newQuantity <= 0) {
      handleActionWithPin(() => setter(currentItems => currentItems.filter(item => item.product.id !== productId)));
      return;
    }
    setter(prevItems => prevItems.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
  }, [activeSessionId, reservations, walkInOrderItems, currentUser?.role]);
  
  const handleCheckout = useCallback(() => {
    const { items, reservation } = getActiveSession();
    if (items.length > 0 || reservation) {
        let finalRentalCharge = 0;
        if (reservation?.status === 'active' && reservation.actualStartTime) {
            const room = rooms.find(r => r.id === reservation.roomId);
            if(room) {
                const durationMillis = new Date().getTime() - new Date(reservation.actualStartTime).getTime();
                const halfHourBlocks = Math.ceil(durationMillis / (1000 * 60 * 30));
                finalRentalCharge = halfHourBlocks * (room.hourlyRate / 2);
            }
        }
        setRentalCharge(finalRentalCharge);
        setSessionToCheckout({ items, reservation });
        setCheckoutVisible(true);
    }
  }, [activeSessionId, walkInOrderItems, reservations, rooms]);
  
  const handleCreateReservation = useCallback((reservationDetails: Omit<Reservation, 'id' | 'status' | 'items' | 'actualStartTime' | 'actualEndTime'>) => {
    if (readOnlySetter()) return;
    const newReservation: Reservation = {
        ...reservationDetails,
        id: `res_${Date.now()}`,
        status: 'scheduled',
        items: [],
        actualStartTime: null,
        actualEndTime: null,
    };
    setReservations(prev => [...prev, newReservation]);
    setTimelineModalVisible(false);
  }, [setReservations, readOnlySetter]);
  
  const handleCheckInReservation = useCallback((reservationId: string) => {
    setReservations(prev => prev.map(r => r.id === reservationId && r.status === 'scheduled' ? { ...r, status: 'active', actualStartTime: new Date().toISOString() } : r));
    setActiveSessionId(reservationId);
    setTimelineModalVisible(false);
  }, [setReservations]);

  const handleStartRoomNow = useCallback((roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const newReservation: Reservation = {
        id: `res_${Date.now()}`, roomId, customerName: `${room.name} (Now)`, guests: 1,
        scheduledStartTime: new Date().toISOString(), scheduledEndTime: new Date(new Date().getTime() + 60*60*1000).toISOString(),
        actualStartTime: new Date().toISOString(), actualEndTime: null, status: 'active', items: [],
    };
    setReservations(prev => [...prev, newReservation]);
    setActiveSessionId(newReservation.id);
    setStartNowModalVisible(false);
  }, [rooms, setReservations]);

  const handleCancelReservation = useCallback((reservationId: string) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
        setReservations(prev => prev.map(r => r.id === reservationId ? {...r, status: 'cancelled'} : r));
    }
  }, [setReservations]);

  const generateInvoiceNumber = useCallback(async () => {
    if (readOnlySetter()) return `Error-ReadOnly`;
    const newSettings = await api.generateInvoiceNumber(activeBranchId!);
    setInvoiceSettingsByBranch(prev => ({...prev, [activeBranchId!]: newSettings.settings }));
    return newSettings.invoiceNumber;
  }, [activeBranchId, readOnlySetter]);

  const handlePaymentSuccess = useCallback(async (paymentMethod: PaymentMethod, cashDetails?: { amount: number, currency: 'USD' | 'LBP', changeGiven: number }) => {
    const { items: orderItems, reservation: activeReservation } = sessionToCheckout;
    let totalCostOfGoodsSold = 0;
    const transactionItems: TransactionItem[] = orderItems.map(item => {
        const itemTotalCost = (item.product.costOfGoodsSold || 0) * item.quantity;
        totalCostOfGoodsSold += itemTotalCost;
        return {
            productId: item.product.id, name: item.product.name, price: item.product.price,
            quantity: item.quantity, category: item.product.category, costOfGoodsSold: item.product.costOfGoodsSold || 0,
        };
    });

    const newStockItems = [...stockItems];
    let stockNeedsUpdate = false;
    orderItems.forEach(orderItem => {
        orderItem.product.recipe.forEach(ingredient => {
            const stockIndex = newStockItems.findIndex(si => si.id === ingredient.stockItemId);
            if (stockIndex > -1) {
              newStockItems[stockIndex].stock -= ingredient.quantity * orderItem.quantity;
              stockNeedsUpdate = true;
            }
        });
    });
    if (stockNeedsUpdate) {
        setStockItems(newStockItems);
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const finalRentalCharge = activeReservation ? rentalCharge : 0;
    const totalLBP = subtotal + tax + finalRentalCharge;
    
    const newTransaction: Transaction = {
        id: `txn_${Date.now()}`, invoiceNumber: await generateInvoiceNumber(), date: new Date().toISOString(),
        items: transactionItems, subtotal, tax, total: totalLBP, paymentMethod,
        costOfGoodsSold: totalCostOfGoodsSold, profit: subtotal - totalCostOfGoodsSold,
        rentalCharge: finalRentalCharge > 0 ? finalRentalCharge : undefined,
        reservationId: activeReservation?.id, amountPaidInCurrency: cashDetails?.amount,
        paymentCurrency: cashDetails?.currency, changeGiven: cashDetails?.changeGiven || 0, usdToLbpRate: shopInfo.usdToLbpRate,
    };
    setTransactions(prev => [...prev, newTransaction]);
    setLastTransaction(newTransaction);
    
    if (activeReservation) {
        setReservations(prev => prev.map(r => r.id === activeReservation.id ? {...r, status: 'completed', actualEndTime: new Date().toISOString()} : r));
    }
    else setWalkInOrderItems([]);
    
    setActiveSessionId('walk-in');
    setRentalCharge(0);
    setSessionToCheckout({ items: [], reservation: null });
  }, [sessionToCheckout, setReservations, setTransactions, generateInvoiceNumber, stockItems, setStockItems, rentalCharge, shopInfo]);
  
  const handleCashTransactionComplete = useCallback((sessionTx: SessionTransaction) => {
    // 1. Update cashier session log
    if (activeCashierSession) {
        setCashierSessions(prev => prev.map(s => 
            s.sessionId === activeCashierSession.sessionId 
            ? { ...s, transactions: [...s.transactions, sessionTx] } 
            : s
        ));
    }

    // 2. Update branch cash box
    const { tenderedNotes, changeNotes, invoiceNumber } = sessionTx;
    
    const tenderedLBP = tenderedNotes.filter(n => n.currency === 'LBP').reduce((sum, n) => sum + n.note * n.count, 0);
    const tenderedUSD = tenderedNotes.filter(n => n.currency === 'USD').reduce((sum, n) => sum + n.note * n.count, 0);
    
    const changeLBP = changeNotes.filter(n => n.currency === 'LBP').reduce((sum, n) => sum + n.note * n.count, 0);
    const changeUSD = changeNotes.filter(n => n.currency === 'USD').reduce((sum, n) => sum + n.note * n.count, 0);
    
    const netLBP = tenderedLBP - changeLBP;
    const netUSD = tenderedUSD - changeUSD;
    
    if (readOnlySetter()) return;

    const newEntry: CashBoxEntry = {
        id: `cbe_${Date.now()}`,
        date: new Date().toISOString(),
        type: 'income',
        category: 'Sale',
        description: `Invoice: ${invoiceNumber}`,
        amountLBP: Math.abs(netLBP),
        amountUSD: Math.abs(netUSD),
        invoiceNumber: invoiceNumber,
        isManual: false,
    };

    setCashBox(prev => [...prev, newEntry]);
  }, [readOnlySetter, activeCashierSession, setCashierSessions, setCashBox]);

  const handleInventoryUpdate = useCallback((newInventory: CashierInventory) => {
    if (activeCashierSession) setCashierSessions(prev => prev.map(s => s.sessionId === activeCashierSession.sessionId ? { ...s, currentInventory: newInventory } : s));
  }, [activeCashierSession, setCashierSessions]);
  
  const handleConfirmChangeBreakdown = useCallback((noteToRemove: BreakdownItem, notesToAdd: BreakdownItem[]) => {
    if (!activeCashierSession) return;
    const newInventory = JSON.parse(JSON.stringify(activeCashierSession.currentInventory));
    newInventory[noteToRemove.currency][noteToRemove.note as any] -= noteToRemove.count;
    notesToAdd.forEach(note => { newInventory[note.currency][note.note as any] += note.count; });
    setCashierSessions(prev => prev.map(s => s.sessionId === activeCashierSession.sessionId ? { ...s, currentInventory: newInventory } : s));
    setChangeBreakdownModalVisible(false);
  }, [activeCashierSession, setCashierSessions]);

  const handleSaveManualCashBoxEntry = useCallback(async (branchIdOrMain: string, entryData: Partial<CashBoxEntry> & { id?: string }) => {
    const newBox = await api.saveManualCashBoxEntry(branchIdOrMain, entryData);
    if (branchIdOrMain === 'main') {
      setMainCashBox(newBox);
    } else {
      setCashBoxByBranch(prev => ({...prev, [branchIdOrMain]: newBox }));
    }
  }, [setMainCashBox, setCashBoxByBranch]);

  const handleTransferToMainBox = useCallback(async (fromBranchId: string, amountLBP: number, amountUSD: number, memo: string) => {
    const { updatedBranchBox, updatedMainBox } = await api.transferToMainBox(fromBranchId, amountLBP, amountUSD, memo);
    setCashBoxByBranch(prev => ({ ...prev, [fromBranchId]: updatedBranchBox }));
    setMainCashBox(updatedMainBox);
  }, [setCashBoxByBranch, setMainCashBox]);
  
  const handleFundPettyCash = useCallback(async (branchId: string, amountLBP: number, amountUSD: number, memo: string) => {
    if (isCompanyView) return;
    const { updatedCashBox, updatedPettyCash } = await api.fundPettyCash(branchId, amountLBP, amountUSD, memo);
    setCashBoxByBranch(prev => ({ ...prev, [branchId]: updatedCashBox }));
    setPettyCashByBranch(prev => ({ ...prev, [branchId]: updatedPettyCash }));
  }, [isCompanyView, setCashBoxByBranch, setPettyCashByBranch]);

  const handleLogPettyCashExpense = useCallback(async (category: string, description: string | undefined, amountLBP: number, amountUSD: number) => {
    if (!activeBranchId || isCompanyView) return;

    const currentPettyCash = pettyCashByBranch[activeBranchId] || { lbp: 0, usd: 0 };
    if (amountLBP > currentPettyCash.lbp || amountUSD > currentPettyCash.usd) {
        alert("Expense exceeds available petty cash in one of the currencies.");
        return;
    }
    const { updatedCashBox, updatedPettyCash } = await api.logPettyCashExpense(activeBranchId, {category, description, amountLBP, amountUSD});

    setCashBox(updatedCashBox);
    setPettyCashByBranch(prev => ({...prev, [activeBranchId]: updatedPettyCash }));

    setPettyCashModalVisible(false);
  }, [activeBranchId, isCompanyView, setCashBox, pettyCashByBranch, setPettyCashByBranch]);

  const handleSetDeletionPin = async (pinAction: React.SetStateAction<string>) => {
    const newPin = typeof pinAction === 'function' ? pinAction(deletionPin) : pinAction;
    await api.setDeletionPin(newPin);
    setDeletionPin(newPin);
  };

  // Modal handlers
  const handlePinSuccess = () => { if (pendingAction) pendingAction(); setPinModalVisible(false); setPendingAction(null); }
  const handleCloseCheckout = useCallback(() => { setCheckoutVisible(false); setLastTransaction(null); setRentalCharge(0); setSessionToCheckout({ items: [], reservation: null }); }, []);
  const handleCloseTimelineModal = useCallback(() => setTimelineModalVisible(false), []);
  const handleCloseStartNowModal = useCallback(() => setStartNowModalVisible(false), []);
  const handleCloseChangeBreakdownModal = useCallback(() => setChangeBreakdownModalVisible(false), []);
  const handleClosePinModal = useCallback(() => { setPinModalVisible(false); setPendingAction(null); }, []);

  const { items: currentItems, reservation: currentReservation } = getActiveSession();
  
  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center font-sans text-on-surface bg-surface">
            <CoffeeIcon className="w-16 h-16 text-primary animate-pulse" />
            <p className="mt-4 text-xl font-medium text-on-surface-variant">Loading Cafe POS Pro...</p>
        </div>
    );
  }

  if (!currentUser) {
    if (userForBranchSelection) {
      return <BranchSelectionScreen user={userForBranchSelection} branches={branches} onSelect={(branchId) => handleBranchSelected(branchId, userForBranchSelection)} onLogout={() => setUserForBranchSelection(null)} />;
    }
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }
  
  if (currentUser.role === 'barista' && !activeCashierSession && !isHandoverModalVisible) {
    return <CashierSetupModal user={currentUser} onSessionStart={handleSessionStart} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-on-surface bg-surface">
      <header className="bg-surface/80 backdrop-blur-lg border-b border-outline/20 text-on-surface w-full sticky top-0 z-20 no-print">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CoffeeIcon className="w-8 h-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold text-on-surface tracking-tight truncate">
              {shopInfo.shopName}
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             {currentUser.role === 'admin' && (branches.length > 0 || isCompanyView) && (
                <div className="relative">
                    <select
                        value={activeBranchId || ''}
                        onChange={e => {
                            const newId = e.target.value;
                            handleBranchSelected(newId, currentUser);
                        }}
                        className="appearance-none cursor-pointer flex items-center gap-2 pl-4 pr-10 py-2 rounded-full text-sm font-medium transition-colors bg-surface-container text-on-surface-variant hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value={COMPANY_VIEW_ID}>Whole Company</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"/>
                </div>
            )}
            {currentUser.role === 'admin' && (
              <button onClick={() => setView(v => v === 'pos' ? 'admin' : 'pos')} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80">
                {view === 'pos' ? <ShieldCheckIcon className="w-5 h-5"/> : <LayoutDashboardIcon className="w-5 h-5" />}
                <span className="hidden sm:inline">{view === 'pos' ? 'Admin Panel' : 'POS View'}</span>
              </button>
            )}
            {currentUser.role === 'barista' && activeCashierSession && view === 'pos' && (
              <>
                <button onClick={() => setPettyCashModalVisible(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors bg-surface-container text-on-surface-variant hover:bg-surface-container-high" title="Petty Cash">
                    <BanknoteIcon className="w-5 h-5" /><span className="hidden sm:inline">Petty Cash</span>
                </button>
                <button onClick={() => handleActionWithPin(() => setChangeBreakdownModalVisible(true))} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors bg-surface-container text-on-surface-variant hover:bg-surface-container-high" title="Break Change">
                    <ArrowRightArrowLeftIcon className="w-5 h-5" /><span className="hidden sm:inline">Break Change</span>
                </button>
              </>
            )}
            <div className="flex items-center space-x-2 bg-surface-container-low px-3 py-1.5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center">
                  <span className="text-lg font-medium text-on-tertiary-container">{currentUser.name.charAt(0)}</span>
              </div>
              <span className="font-semibold hidden sm:inline">{currentUser.name}</span>
            </div>
            <button onClick={handleLogout} className="font-medium text-sm text-primary hover:underline">Logout</button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="animate-fade-in">
          {view === 'pos' ? (
            <POSView
              products={products} orderItems={currentItems} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={() => {}} onCheckout={handleCheckout} onClearOrder={handleClearOrder}
              onManageSchedule={() => setTimelineModalVisible(true)} onStartRoomNow={() => setStartNowModalVisible(true)}
              rooms={rooms} reservations={reservations} activeReservation={currentReservation} activeReservations={activeReservations} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId} shopInfo={shopInfo}
            />
          ) : (
            <AdminPage 
              isCompanyView={isCompanyView}
              products={products} setProducts={setProducts}
              users={users} setUsers={setUsers}
              rooms={rooms} setRooms={setRooms}
              stockItems={stockItems} setStockItems={setStockItems}
              inventoryUnits={inventoryUnits} setInventoryUnits={setInventoryUnits}
              transactions={transactions}
              reservations={reservations} setReservations={setReservations}
              deletionPin={deletionPin} setDeletionPin={handleSetDeletionPin}
              invoiceSettings={invoiceSettings} setInvoiceSettings={setInvoiceSettings}
              shopInfo={shopInfo} setShopInfo={setShopInfo}
              cashierSessions={cashierSessions}
              onCreateReservation={handleCreateReservation} onCheckInReservation={handleCheckInReservation} onCancelReservation={handleCancelReservation} setActiveSessionId={setActiveSessionId}
              branches={branches} onAddBranch={handleAddBranch}
              cashBoxByBranch={cashBoxByBranch} mainCashBox={mainCashBox}
              onSaveManualCashBoxEntry={handleSaveManualCashBoxEntry} onTransferToMainBox={handleTransferToMainBox} activeBranchId={activeBranchId}
              cashBoxIncomeCategories={cashBoxIncomeCategories} setCashBoxIncomeCategories={setCashBoxIncomeCategories}
              cashBoxExpenseCategories={cashBoxExpenseCategories} setCashBoxExpenseCategories={setCashBoxExpenseCategories}
              pettyCashByBranch={pettyCashByBranch}
              onFundPettyCash={handleFundPettyCash}
            />
          )}
        </div>
      </main>

      {isHandoverModalVisible && handoverSession && userPendingLogin && <CashierHandoverModal onConfirm={handleConfirmHandover} onDecline={handleDeclineHandover} previousSession={handoverSession} newUser={userPendingLogin} shopInfo={shopInfo} />}
      {isCheckoutVisible && activeCashierSession && <CheckoutModal items={sessionToCheckout.items} lastTransaction={lastTransaction} onClose={handleCloseCheckout} onPaymentSuccess={handlePaymentSuccess} activeReservation={sessionToCheckout.reservation} rentalCharge={rentalCharge} shopInfo={shopInfo} cashierInventory={activeCashierSession.currentInventory} onInventoryUpdate={handleInventoryUpdate} onOverage={() => {}} onCashTransactionComplete={handleCashTransactionComplete} />}
      {isTimelineModalVisible && <ReservationsTimelineModal onClose={handleCloseTimelineModal} rooms={rooms} reservations={reservations} onCreateReservation={handleCreateReservation} onCheckInReservation={handleCheckInReservation} onCancelReservation={handleCancelReservation} setActiveSessionId={setActiveSessionId} />}
      {isStartNowModalVisible && <StartNowModal rooms={rooms} reservations={reservations} onClose={handleCloseStartNowModal} onStartRoom={handleStartRoomNow} />}
      {isPinModalVisible && <PinVerificationModal deletionPin={deletionPin} onClose={handleClosePinModal} onSuccess={handlePinSuccess} />}
      {isChangeBreakdownModalVisible && activeCashierSession && <ChangeBreakdownModal onClose={handleCloseChangeBreakdownModal} onConfirm={handleConfirmChangeBreakdown} inventory={activeCashierSession.currentInventory} shopInfo={shopInfo} />}
      {isPettyCashModalVisible && !isCompanyView && activeBranchId && (
        <PettyCashModal
          onClose={() => setPettyCashModalVisible(false)}
          onConfirm={handleLogPettyCashExpense}
          expenseCategories={cashBoxExpenseCategories}
          pettyCashBalance={pettyCashByBranch[activeBranchId] || { lbp: 0, usd: 0 }}
          shopInfo={shopInfo}
        />
      )}
    </div>
  );
};

export default App;