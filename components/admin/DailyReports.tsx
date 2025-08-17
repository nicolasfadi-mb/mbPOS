import React, { useState } from 'react';
import type { Transaction, Reservation, ShopInfoSettings } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';
import { formatPrice } from '../../constants';

interface DailyReportsProps {
    transactions: Transaction[];
    reservations: Reservation[];
    shopInfo: ShopInfoSettings;
}

const toISODateString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const PriceDisplay: React.FC<{priceLBP: number, rate: number}> = ({priceLBP, rate}) => {
    const { usd, lbp } = formatPrice(priceLBP, rate);
    return (
        <div className="flex flex-col items-start leading-tight">
            <span className="text-2xl font-bold text-on-surface">{usd}</span>
            <span className="text-sm text-on-surface-variant/80 font-medium">{lbp}</span>
        </div>
    )
}

const DailyReports: React.FC<DailyReportsProps> = ({ transactions, reservations, shopInfo }) => {
    const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const filterTransactionsByDate = (dateStr: string) => {
        return transactions.filter(t => t.date.startsWith(dateStr));
    };

    const selectedTransactions = filterTransactionsByDate(selectedDate);
    
    const totalRevenue = selectedTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCogs = selectedTransactions.reduce((sum, t) => sum + (t.costOfGoodsSold || 0), 0);
    const totalProfit = selectedTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalOrders = selectedTransactions.length;
    
    const salesByItem = selectedTransactions
        .flatMap(t => t.items)
        .reduce((acc, item) => {
            if (!acc[item.productId]) {
                acc[item.productId] = { name: item.name, quantity: 0, total: 0 };
            }
            acc[item.productId].quantity += item.quantity;
            acc[item.productId].total += item.price * item.quantity;
            return acc;
        }, {} as Record<string, { name: string, quantity: number, total: number }>);
        
    const sortedItems = Object.values(salesByItem).sort((a, b) => b.quantity - a.quantity);

    const handlePrint = () => {
        const openReservations = reservations.filter(r => r.status === 'active' || r.status === 'scheduled');
        if (openReservations.length > 0) {
            alert(`There are still ${openReservations.length} active or scheduled reservations. Please resolve them before finalizing the day.`);
            return;
        }
        window.print();
    };
    
    const ReportContent = () => (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-container p-4 rounded-xl"><h4 className="font-medium text-on-surface-variant">Total Revenue</h4><PriceDisplay priceLBP={totalRevenue} rate={shopInfo.usdToLbpRate} /></div>
            <div className="bg-surface-container p-4 rounded-xl"><h4 className="font-medium text-on-surface-variant">Total COGS</h4><PriceDisplay priceLBP={totalCogs} rate={shopInfo.usdToLbpRate} /></div>
            <div className="bg-surface-container p-4 rounded-xl"><h4 className="font-medium text-on-surface-variant">Gross Profit</h4><PriceDisplay priceLBP={totalProfit} rate={shopInfo.usdToLbpRate} /></div>
            <div className="bg-surface-container p-4 rounded-xl"><h4 className="font-medium text-on-surface-variant">Total Orders</h4><p className="text-2xl font-bold text-on-surface">{totalOrders}</p></div>
        </div>

        <h3 className="text-xl font-medium text-on-surface mb-4 pt-4 border-t border-outline/20">Item Sales Summary</h3>
        {sortedItems.length > 0 ? (
          <div className="overflow-x-auto bg-surface-container-low rounded-xl">
            <table className="min-w-full">
              <thead className="border-b border-outline/20">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-medium text-on-surface-variant">Item</th>
                  <th className="py-2 px-4 text-right text-sm font-medium text-on-surface-variant">Quantity Sold</th>
                  <th className="py-2 px-4 text-right text-sm font-medium text-on-surface-variant">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {sortedItems.map(item => {
                  const formattedValue = formatPrice(item.total, shopInfo.usdToLbpRate);
                  return (
                  <tr key={item.name}>
                    <td className="py-2 px-4 whitespace-nowrap font-medium text-on-surface">{item.name}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-on-surface-variant text-right">{item.quantity}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-on-surface-variant text-right">{formattedValue.usd} ({formattedValue.lbp})</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-on-surface-variant py-8">No sales data for the selected date.</p>
        )}
        
        <h3 className="text-xl font-medium text-on-surface mb-4 pt-4 border-t border-outline/20 mt-8">Transaction Log</h3>
        {selectedTransactions.length > 0 ? (
          <div className="overflow-x-auto bg-surface-container-low rounded-xl">
            <table className="min-w-full">
               <thead className="border-b border-outline/20">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-medium text-on-surface-variant">Invoice #</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-on-surface-variant">Time</th>
                  <th className="py-2 px-4 text-right text-sm font-medium text-on-surface-variant">Rent</th>
                  <th className="py-2 px-4 text-right text-sm font-medium text-on-surface-variant">Total</th>
                  <th className="py-2 px-4 text-right text-sm font-medium text-on-surface-variant">Profit</th>
                  <th className="py-2 px-4 text-left text-sm font-medium text-on-surface-variant">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {selectedTransactions.map(t => {
                  const rate = t.usdToLbpRate || shopInfo.usdToLbpRate;
                  const rent = formatPrice(t.rentalCharge || 0, rate);
                  const total = formatPrice(t.total, rate);
                  const profit = formatPrice(t.profit || 0, rate);
                  
                  return (
                  <tr key={t.id}>
                    <td className="py-2 px-4 whitespace-nowrap font-medium text-on-surface">{t.invoiceNumber}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-on-surface-variant">{new Date(t.date).toLocaleTimeString()}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-on-surface-variant text-right">{rent.usd}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-on-surface text-right font-medium">{total.usd}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-green-700 text-right font-medium">{profit.usd}</td>
                    <td className="py-2 px-4 whitespace-nowrap text-on-surface-variant capitalize">{t.paymentMethod} {t.paymentCurrency ? `(${t.paymentCurrency})` : ''}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-on-surface-variant py-8">No transactions for the selected date.</p>
        )}
      </>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4 no-print">
                <h2 className="text-xl font-medium text-on-surface">Daily Report</h2>
                <div className="flex items-center gap-4">
                     <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={handleDateChange} 
                        className="p-2 border border-outline bg-surface-container-low rounded-lg"
                    />
                    <button onClick={handlePrint} className="bg-primary text-on-primary py-2 px-4 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm text-sm">
                        <PrinterIcon className="w-4 h-4" />
                        Finalize & Print
                    </button>
                </div>
            </div>

            <div id="report-to-print" className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-on-surface">End of Day Report</h1>
                    <p className="text-lg font-medium text-on-surface-variant">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                </div>
                <ReportContent />
            </div>
        </div>
    );
};

export default DailyReports;
