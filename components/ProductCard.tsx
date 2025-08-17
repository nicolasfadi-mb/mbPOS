import React from 'react';
import type { Product, ShopInfoSettings } from '../types';
import { CATEGORY_COLORS, formatPrice } from '../constants';
import { PlusIcon } from './icons/PlusIcon';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  shopInfo: ShopInfoSettings;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, shopInfo }) => {
  const colors = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Default;
  const formattedPrice = formatPrice(product.price, shopInfo.usdToLbpRate);

  return (
    <button
      onClick={() => onAddToCart(product)}
      className={`group relative rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between p-3 aspect-square active:scale-95 transform-gpu ${colors.bg} border ${colors.border}`}
    >
      <div className="flex-grow">
          <h3 className={`text-2xl font-bold ${colors.text} leading-tight text-left`}>{product.name}</h3>
      </div>
      <div className="flex justify-between items-end mt-1">
        <div className="flex flex-col items-start leading-tight">
          <p className={`text-3xl font-extrabold ${colors.text}`}>{formattedPrice.usd}</p>
          <p className={`text-sm ${colors.text} opacity-80 -mt-1`}>{formattedPrice.lbp}</p>
        </div>
        <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-on-primary/20 group-hover:bg-on-primary transition-all duration-300 group-hover:scale-110`}>
          <PlusIcon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>
    </button>
  );
};

export default ProductCard;
