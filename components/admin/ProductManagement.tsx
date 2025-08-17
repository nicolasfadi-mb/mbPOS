
import React, { useState, useMemo, useRef } from 'react';
import type { Product, StockItem, RecipeIngredient, ShopInfoSettings } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CalculatorIcon } from '../icons/CalculatorIcon';
import { formatPrice } from '../../constants';
import { DownloadIcon } from '../icons/DownloadIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { HelpCircleIcon } from '../icons/HelpCircleIcon';
import HelpModal from '../shared/HelpModal';

interface ProductManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  stockItems: StockItem[];
  shopInfo: ShopInfoSettings;
  isCompanyView: boolean;
}

const IngredientAdder: React.FC<{
    stockItems: StockItem[];
    onAdd: (stockItemId: string, quantity: number) => void;
    recipe: RecipeIngredient[];
}> = ({ stockItems, onAdd, recipe }) => {
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState(1);

    const availableItems = useMemo(() => {
        const usedItemIds = new Set(recipe.map(ing => ing.stockItemId));
        return stockItems.filter(item => !usedItemIds.has(item.id));
    }, [stockItems, recipe]);

    const handleAdd = () => {
        if (selectedItem && quantity > 0) {
            onAdd(selectedItem, quantity);
            setSelectedItem('');
            setQuantity(1);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-outline/20 flex items-end gap-2">
            <div className="flex-grow">
                <label className="block text-sm font-medium text-on-surface-variant">Ingredient</label>
                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="input-field w-full">
                    <option value="" disabled>Select ingredient</option>
                    {availableItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-on-surface-variant">Qty</label>
                <input type="number" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} min="0" step="any" className="input-field w-24" />
            </div>
            <button type="button" onClick={handleAdd} className="bg-secondary-container text-on-secondary-container py-3 px-4 rounded-lg font-medium hover:bg-secondary-container/80 transition-colors">Add</button>
        </div>
    );
};


const ProductFormModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'> & { id?: string }) => void;
  stockItems: StockItem[];
  shopInfo: ShopInfoSettings;
}> = ({ product, onClose, onSave, stockItems, shopInfo }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
  });
  const [priceLBP, setPriceLBP] = useState<string>((product?.price || 0).toString());
  const [priceUSD, setPriceUSD] = useState<string>(
    product ? (product.price / shopInfo.usdToLbpRate).toFixed(2) : "0.00"
  );
  const [recipe, setRecipe] = useState<RecipeIngredient[]>(product?.recipe || []);

  const stockItemsMap = useMemo(() =>
    stockItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, StockItem>),
    [stockItems]);

  const costOfGoodsSold = useMemo(() =>
    recipe.reduce((totalCost, ingredient) => {
      const stockItem = stockItemsMap[ingredient.stockItemId];
      return totalCost + (stockItem ? stockItem.averageCost * ingredient.quantity : 0);
    }, 0),
    [recipe, stockItemsMap]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceLBPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lbpValueStr = e.target.value;
    setPriceLBP(lbpValueStr);
    const lbpNumber = parseFloat(lbpValueStr) || 0;
    setPriceUSD((lbpNumber / shopInfo.usdToLbpRate).toFixed(2));
  };

  const handlePriceUSDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usdValueStr = e.target.value;
    setPriceUSD(usdValueStr);
    const usdNumber = parseFloat(usdValueStr) || 0;
    setPriceLBP(Math.round(usdNumber * shopInfo.usdToLbpRate).toString());
  };


  const handleAddIngredient = (stockItemId: string, quantity: number) => {
    if (!stockItemId || quantity <= 0) return;
    setRecipe(prev => [...prev, { stockItemId, quantity }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(priceLBP) || 0;
    onSave({ ...formData, price, recipe, costOfGoodsSold });
  };

  const formattedCOGS = formatPrice(costOfGoodsSold, shopInfo.usdToLbpRate);

  return (
    <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">Name</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-on-surface-variant">Category</label>
          <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priceLBP" className="block text-sm font-medium text-on-surface-variant">Price (LBP)</label>
            <input
              type="number"
              id="priceLBP"
              value={priceLBP}
              onChange={handlePriceLBPChange}
              required
              className="input-field"
              step="any"
            />
          </div>
          <div>
            <label htmlFor="priceUSD" className="block text-sm font-medium text-on-surface-variant">Price (USD)</label>
            <input
              type="number"
              id="priceUSD"
              value={priceUSD}
              onChange={handlePriceUSDChange}
              required
              className="input-field"
              step="any"
            />
          </div>
        </div>

        <fieldset className="border border-outline/50 p-4 rounded-xl">
          <legend className="px-2 font-medium text-primary">Recipe</legend>
          <div className="space-y-3">
            {recipe.map((ing, index) => (
              <div key={index} className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                <div>
                  <span className="font-medium">{stockItemsMap[ing.stockItemId]?.name || 'Unknown Item'}</span>
                  <span className="text-sm text-on-surface-variant ml-2">{ing.quantity} {stockItemsMap[ing.stockItemId]?.unit}</span>
                </div>
                <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-error/80 hover:text-error"><TrashIcon className="w-5 h-5" /></button>
              </div>
            ))}
            {recipe.length === 0 && <p className="text-sm text-on-surface-variant text-center">No ingredients added.</p>}
          </div>
          <IngredientAdder stockItems={stockItems} onAdd={handleAddIngredient} recipe={recipe} />
          <div className="mt-4 pt-4 border-t border-outline/20 flex justify-end items-center gap-3">
            <CalculatorIcon className="w-6 h-6 text-secondary" />
            <span className="text-lg font-medium text-on-surface">Calculated Cost:</span>
            <span className="text-lg font-bold text-primary">{formattedCOGS.usd} ({formattedCOGS.lbp})</span>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-full font-medium text-primary hover:bg-primary/10 transition-colors">Cancel</button>
          <button type="submit" className="bg-primary text-on-primary py-2 px-6 rounded-full font-medium hover:bg-primary/90 transition-colors">Save</button>
        </div>
      </form>
    </Modal>
  )
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, setProducts, stockItems, shopInfo, isCompanyView }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModalForNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
    } else {
      const newProduct: Product = { 
        ...productData, 
        id: `prod_${Date.now()}`,
        recipe: productData.recipe || [],
        costOfGoodsSold: productData.costOfGoodsSold || 0
      };
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (productId: string) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
        setProducts(products.filter(p => p.id !== productId));
    }
  };
  
  const handleExportCSV = () => {
    const headers = ['id', 'name', 'category', 'price', 'costOfGoodsSold', 'recipe'];
    
    const recipeToString = (recipe: RecipeIngredient[]) => {
        return recipe.map(ing => `${ing.stockItemId}:${ing.quantity}`).join(';');
    };

    const escapeCsvValue = (value: any) => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [
        headers.join(','),
        ...products.map(p => 
            [
                p.id,
                escapeCsvValue(p.name),
                p.category,
                p.price,
                p.costOfGoodsSold,
                recipeToString(p.recipe)
            ].join(',')
        ),
        `,Example Product,Example Category,150000,0,stock_001:10;stock_002:150`
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'products_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        const parseCSV = (csvText: string): { headers: string[], data: Record<string, string>[] } => {
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) return { headers: [], data: [] };

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const row: Record<string, string> = {};
                const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;
                let match;
                let headerIndex = 0;
                while ((match = regex.exec(lines[i])) && headerIndex < headers.length) {
                    const value = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
                    row[headers[headerIndex]] = value.trim();
                    headerIndex++;
                }
                while (headerIndex < headers.length) {
                    row[headers[headerIndex]] = '';
                    headerIndex++;
                }
                data.push(row);
            }
            return { headers, data };
        };

        const { headers, data } = parseCSV(text);
        
        const requiredHeaders = ['name', 'category', 'price'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            alert(`CSV must contain the following headers: ${requiredHeaders.join(', ')}`);
            return;
        }
        
        let updatedProductsList = [...products];
        let addedCount = 0;
        let updatedCount = 0;

        const stringToRecipe = (recipeStr: string | undefined): RecipeIngredient[] => {
            if (!recipeStr) return [];
            try {
                return recipeStr.split(';').map(part => {
                    const [stockItemId, quantityStr] = part.split(':');
                    if (!stockItemId || !quantityStr) return null;
                    const quantity = parseFloat(quantityStr);
                    if (isNaN(quantity)) return null;
                    return { stockItemId, quantity };
                }).filter(Boolean) as RecipeIngredient[];
            } catch (error) {
                console.error("Error parsing recipe string:", recipeStr, error);
                return [];
            }
        };
        
        data.forEach((rowData, i) => {
            if (!rowData.name || !rowData.category || !rowData.price) {
                console.warn(`Skipping row ${i+1} due to missing required data.`);
                return;
            }
            const id = rowData.id;
            const recipe = stringToRecipe(rowData.recipe);

            const costOfGoodsSold = recipe.reduce((totalCost, ingredient) => {
                const stockItem = stockItems.find(si => si.id === ingredient.stockItemId);
                return totalCost + (stockItem ? stockItem.averageCost * ingredient.quantity : 0);
            }, 0);
            
            const productData = {
                name: rowData.name,
                category: rowData.category,
                price: parseFloat(rowData.price) || 0,
                recipe: recipe,
                costOfGoodsSold,
            };

            if (id) {
                const index = updatedProductsList.findIndex(p => p.id === id);
                if (index !== -1) {
                    updatedProductsList[index] = { ...updatedProductsList[index], ...productData };
                    updatedCount++;
                } else {
                    updatedProductsList.push({ ...productData, id: `prod_${Date.now()}_${i}` });
                    addedCount++;
                }
            } else {
                updatedProductsList.push({ ...productData, id: `prod_${Date.now()}_${i}` });
                addedCount++;
            }
        });
        
        setProducts(updatedProductsList);
        alert(`Import complete! ${addedCount} products added, ${updatedCount} products updated.`);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };
    
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const CsvHelpContent = () => (
    <>
      <h3 className="text-lg font-semibold text-on-surface">How to Import Products via CSV</h3>
      <p className="text-base">Follow these steps to correctly format and import your product data.</p>
      
      <ol className="list-decimal list-inside space-y-3">
        <li>
          <strong>Download the Template:</strong> Click the "Export" button to download a CSV file. This file includes the correct headers and an example row to guide you.
        </li>
        <li>
          <strong>Open and Edit:</strong> Open the downloaded CSV file in a spreadsheet program like Excel, Google Sheets, or Numbers.
        </li>
        <li>
          <strong>Fill in Data:</strong> Add your products as new rows. Refer to the column guide below for formatting rules.
          <div className="mt-2 p-3 bg-surface-container rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Column Guide:</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>id</strong> (Optional): To update an existing product, use its ID here. Leave blank to create a new product.</li>
                <li><strong>name</strong> (Required): The name of the product (e.g., "Latte").</li>
                <li><strong>category</strong> (Required): The product's category (e.g., "Coffee").</li>
                <li><strong>price</strong> (Required): Sale price in LBP, without commas (e.g., 150000).</li>
                <li><strong>costOfGoodsSold</strong> (Optional): Manually set cost. Will be auto-calculated and overwritten if a recipe is provided.</li>
                <li><strong>recipe</strong> (Optional): List of stock item IDs and quantities.
                  <ul className="list-[circle] list-inside ml-4">
                    <li>Format: <code>stock_item_id:quantity;another_item_id:quantity</code></li>
                    <li>Example: <code>si_123:25;si_456:150</code></li>
                  </ul>
                </li>
              </ul>
          </div>
        </li>
        <li>
            <strong>Save and Import:</strong> Save your file, then click the "Import" button and select your saved CSV file.
        </li>
      </ol>
      <h4 className="font-semibold text-on-surface mt-2">Example Row (New Product):</h4>
      <code className="block bg-surface-container p-2 rounded-md text-sm font-mono">,Cappuccino,Coffee,180000,,si_123:30;si_456:200</code>
    </>
  );

  return (
    <div>
      {!isCompanyView && (
        <div className="flex justify-end items-center mb-4">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsHelpModalOpen(true)} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors" title="CSV Format Help">
                    <HelpCircleIcon className="w-5 h-5" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportCSV} 
                    className="hidden"
                    accept=".csv"
                />
                <button onClick={handleExportCSV} className="bg-surface-container text-on-surface-variant py-2 px-4 rounded-full font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm">
                    <DownloadIcon className="w-4 h-4"/>
                    Export
                </button>
                <button onClick={handleImportClick} className="bg-surface-container text-on-surface-variant py-2 px-4 rounded-full font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2 text-sm">
                    <UploadIcon className="w-4 h-4"/>
                    Import
                </button>
                <button onClick={openModalForNew} className="bg-primary text-on-primary py-2 px-5 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
                  Add Product
                </button>
            </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-outline/20 bg-surface-container">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Name</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Category</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Price</th>
              <th className="py-3 px-4 text-left font-semibold text-on-surface-variant">Cost</th>
              <th className="py-3 px-4 text-right font-semibold text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {products.map(product => {
                const formattedPrice = formatPrice(product.price, shopInfo.usdToLbpRate);
                const formattedCost = formatPrice(product.costOfGoodsSold, shopInfo.usdToLbpRate);
                return (
                  <tr key={product.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">{product.name}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">{product.category}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">{formattedPrice.usd} ({formattedPrice.lbp})</td>
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant">{formattedCost.usd} ({formattedCost.lbp})</td>
                    <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isCompanyView && (
                        <>
                          <button onClick={() => openModalForEdit(product)} className="text-primary hover:text-primary/80 mr-4"><EditIcon className="w-5 h-5"/></button>
                          <button onClick={() => handleDelete(product.id)} className="text-error hover:text-error/80"><TrashIcon className="w-5 h-5"/></button>
                        </>
                      )}
                    </td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
      {isModalOpen && !isCompanyView && (
        <ProductFormModal 
            product={editingProduct} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSave} 
            stockItems={stockItems}
            shopInfo={shopInfo}
        />
      )}
      {isHelpModalOpen && <HelpModal title="Product Import/Export Help" onClose={() => setIsHelpModalOpen(false)}><CsvHelpContent /></HelpModal>}
    </div>
  );
};

export default ProductManagement;
