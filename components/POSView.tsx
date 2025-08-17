import React, { useState } from 'react';
import type { Product, OrderItem, Room, Reservation, ShopInfoSettings } from '../types';
import ProductCatalog from './ProductCatalog';
import OrderAndRoomsPanel from './OrderAndRoomsPanel';
import QuantityModal from './QuantityModal';

interface POSViewProps {
  products: Product[];
  orderItems: OrderItem[];
  rooms: Room[];
  reservations: Reservation[];
  activeReservations: Reservation[];
  activeReservation: Reservation | null;
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onClearOrder: () => void;
  onManageSchedule: () => void;
  onStartRoomNow: () => void;
  shopInfo: ShopInfoSettings;
}

const POSView: React.FC<POSViewProps> = (props) => {
  const [quantityMultiplier, setQuantityMultiplier] = useState(1);
  const [isQuantityModalVisible, setQuantityModalVisible] = useState(false);

  const handleAddToCartWithMultiplier = (product: Product) => {
      props.onAddToCart(product, quantityMultiplier);
      if (quantityMultiplier > 1) {
          setQuantityMultiplier(1);
      }
  };

  return (
    <div className="flex-grow flex flex-col lg:flex-row container mx-auto p-2 sm:p-4 md:p-6 gap-6 lg:h-[calc(100vh-76px)]">
      <div className="lg:w-2/3 lg:h-full">
        <ProductCatalog 
            products={props.products} 
            onAddToCart={handleAddToCartWithMultiplier}
            quantityMultiplier={quantityMultiplier}
            onSetMultiplier={() => setQuantityModalVisible(true)}
            shopInfo={props.shopInfo}
        />
      </div>
      <div className="lg:w-1/3 lg:h-full mt-6 lg:mt-0">
        <OrderAndRoomsPanel {...props} />
      </div>
      {isQuantityModalVisible && (
        <QuantityModal 
            onClose={() => setQuantityModalVisible(false)}
            onSetQuantity={(qty) => {
                setQuantityMultiplier(qty);
                setQuantityModalVisible(false);
            }}
        />
      )}
    </div>
  );
};

export default POSView;