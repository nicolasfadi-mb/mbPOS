

import React from 'react';
import type { Transaction, Product, StockItem, ShopInfoSettings } from '../../types';
import { formatPrice } from '../../constants';


interface DashboardProps {
    transactions: Transaction[];
    products: Product[];
    stockItems: StockItem[];
    shopInfo: ShopInfoSettings;
}

const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
};

const StatCard: React.FC<{ title: string, value: string | React.ReactNode, subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-medium text-on-surface-variant">{title}</h3>
        {typeof value === 'string' ? (
             <p className="text-4xl font-bold text-on-surface mt-2">{value}</p>
        ) : (
            <div className="mt-2">{value}</div>
        )}
        {subtext && <p className="text-sm text-on-surface-variant/80 mt-1">{subtext}</p>}
    </div>
);

const PriceDisplay: React.FC<{priceLBP: number, rate: number}> = ({priceLBP, rate}) => {
    const { usd, lbp } = formatPrice(priceLBP, rate);
    return (
        <div className="flex flex-col items-start leading-tight">
            <span className="text-4xl font-bold text-on-surface">{usd}</span>
            <span className="text-base text-on-surface-variant/80 font-medium">{lbp}</span>
        </div>
    )
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, stockItems, shopInfo }) => {
    const todaysTransactions = transactions.filter(t => isToday(t.date));
    
    const totalRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCogs = todaysTransactions.reduce((sum, t) => sum + (t.costOfGoodsSold || 0), 0);
    const grossProfit = totalRevenue - totalCogs;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalOrders = todaysTransactions.length;

    const topSellingItems = todaysTransactions
        .flatMap(t => t.items)
        .reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);

    const sortedTopItems = Object.entries(topSellingItems)
        .map(([productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            return { name: product?.name || 'Unknown', quantity };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const salesByCategory = todaysTransactions
        .flatMap(t => t.items)
        .reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
            return acc;
        }, {} as Record<string, number>);

    const sortedCategories = Object.entries(salesByCategory).sort((a, b) => b[1] - a[1]);
    
    return null; // Content is now rendered directly in AdminPage for widget layout
};

export default Dashboard;
