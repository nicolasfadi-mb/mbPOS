import React from 'react';
import type { Transaction, ShopInfoSettings } from '../types';
import { formatPrice } from '../constants';

interface InvoiceProps {
  transaction: Transaction;
  shopInfo: ShopInfoSettings;
}

const Invoice: React.FC<InvoiceProps> = ({ transaction, shopInfo }) => {
  const rate = transaction.usdToLbpRate || shopInfo.usdToLbpRate;

  const formatForInvoice = (priceLBP: number) => {
    const { usd, lbp } = formatPrice(priceLBP, rate);
    return { usd, lbp: lbp.replace(' LBP', '') };
  }

  return (
    <div id="invoice-to-print" className="bg-white text-black font-sans text-xs">
        <div className="p-4 mx-auto" style={{width: '302px'}}>
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{shopInfo.shopName}</h2>
                <p>{shopInfo.address}</p>
                <p>{shopInfo.phone}</p>
                <p>{shopInfo.website}</p>
            </div>
            
            <div className="border-t border-b border-dashed border-black py-1 mb-2 text-xs">
                <p>Invoice #: {transaction.invoiceNumber}</p>
                <p>Date: {new Date(transaction.date).toLocaleString()}</p>
                <p>Rate: 1 USD = {rate.toLocaleString()} LBP</p>
            </div>

            <table className="w-full mb-2">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left font-normal pb-1">QTY</th>
                        <th className="text-left font-normal pb-1">ITEM</th>
                        <th className="text-right font-normal pb-1">USD</th>
                        <th className="text-right font-normal pb-1">LBP</th>
                    </tr>
                </thead>
                <tbody>
                    {transaction.items.map(item => {
                        const itemTotal = formatForInvoice(item.price * item.quantity);
                        return (
                        <tr key={item.productId}>
                            <td className="align-top pr-1">{item.quantity}</td>
                            <td className="align-top">{item.name}</td>
                            <td className="text-right align-top">{itemTotal.usd.replace('$', '')}</td>
                            <td className="text-right align-top">{itemTotal.lbp}</td>
                        </tr>
                    )})}
                </tbody>
            </table>

            <div className="border-t border-dashed border-black pt-2 space-y-1">
                 <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatForInvoice(transaction.subtotal).usd} / {formatForInvoice(transaction.subtotal).lbp}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatForInvoice(transaction.tax).usd} / {formatForInvoice(transaction.tax).lbp}</span>
                </div>
                {transaction.rentalCharge && transaction.rentalCharge > 0 && (
                    <div className="flex justify-between">
                        <span>Room Rent:</span>
                        <span>{formatForInvoice(transaction.rentalCharge).usd} / {formatForInvoice(transaction.rentalCharge).lbp}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-black mt-1 pt-1">
                    <span>TOTAL:</span>
                    <span>{formatForInvoice(transaction.total).usd} / {formatForInvoice(transaction.total).lbp}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black pt-2 mt-2 space-y-1">
                <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{transaction.paymentMethod}</span>
                </div>
                 {transaction.paymentMethod === 'cash' && transaction.amountPaidInCurrency !== undefined && (
                    <>
                        <div className="flex justify-between">
                            <span>Amount Paid:</span>
                            <span>{transaction.paymentCurrency === 'USD' ? `$${transaction.amountPaidInCurrency.toFixed(2)}` : `${transaction.amountPaidInCurrency.toLocaleString()} LBP`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Change Given:</span>
                            <span>{Math.round(transaction.changeGiven).toLocaleString()} LBP</span>
                        </div>
                    </>
                 )}
            </div>

            <div className="text-center mt-4">
                <p>{shopInfo.footerMessage}</p>
            </div>
        </div>
    </div>
  );
};

export default Invoice;