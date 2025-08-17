import React, { useState } from 'react';
import type { Product, ShopInfoSettings } from '../types';
import ProductCard from './ProductCard';
import { TimesIcon } from './icons/TimesIcon';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  quantityMultiplier: number;
  onSetMultiplier: () => void;
  shopInfo: ShopInfoSettings;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ products, onAddToCart, quantityMultiplier, onSetMultiplier, shopInfo }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-surface-container-low rounded-3xl shadow-sm p-4 sm:p-6 flex flex-col md:flex-row gap-6 h-full">
      {/* Categories Sidebar/Top bar */}
      <nav className="flex md:flex-col md:w-48 flex-shrink-0 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto md:overflow-y-auto md:border-r md:border-outline/10 md:pr-4 gap-3">
        <h2 className="hidden md:block text-lg font-semibold text-on-surface-variant px-1 pb-2">Categories</h2>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 rounded-full md:rounded-xl text-base font-bold transition-colors duration-200 flex items-center justify-center px-5 py-3 md:w-full md:justify-start break-words
              ${selectedCategory === category
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            {category}
          </button>
        ))}
      </nav>

      {/* Main content area (products grid and header) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-2xl sm:text-3xl font-semibold text-on-surface">Products</h2>
            <button 
                onClick={onSetMultiplier} 
                className="flex items-center gap-2 bg-secondary-container text-on-secondary-container font-medium py-2.5 px-5 rounded-full hover:bg-secondary-container/80 transition-colors"
            >
                <TimesIcon className="w-4 h-4" />
                <span className="text-lg font-semibold">x{quantityMultiplier}</span>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} shopInfo={shopInfo} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;