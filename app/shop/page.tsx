'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../../src/components/ProductCard';
import ScrollableChips from '../../src/components/ScrollableChips';
import PremiumSelect from '../../src/components/PremiumSelect';
import { useAppStore } from '../../src/store/useAppStore';

const Shop = () => {
  const { products, searchQuery } = useAppStore();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || null;
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  
  useEffect(() => {
    const queryCategory = searchParams.get('category');
    if (queryCategory) {
      setActiveCategory(queryCategory);
      setActiveSubcategory(null); // Reset subcategory when category changes
    }
  }, [searchParams]);

  const [sortMode, setSortMode] = useState('default');

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory) {
      list = list.filter(p => p.category === activeCategory);
    }
    
    if (activeSubcategory) {
      list = list.filter(p => p.subcategory === activeSubcategory);
    }

    if (searchQuery) {
      const t = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(t) || 
        p.description.toLowerCase().includes(t)
      );
    }

    if (sortMode === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortMode === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortMode === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [activeCategory, activeSubcategory, searchQuery, sortMode, products]);

  // Compute available subcategories for the current category selection
  const availableSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    
    let list = [...products];
    list = list.filter(p => p.category === activeCategory);
    
    const subcats = list.map(p => p.subcategory).filter(Boolean) as string[];
    const unique = Array.from(new Set(subcats));
    return unique;
  }, [products, activeCategory]);

  return (
    <div>
      <div className="section-header-container">
        <div>
          <h2 className="section-title">All Products</h2>
          <h3 className="section-subtitle serif">Shop our collection</h3>
        </div>
      </div>

      <div className="sticky-filters">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
            {!activeCategory ? (
              <ScrollableChips>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    className="chip"
                    style={{ '--chip-color': 'var(--primary)' } as React.CSSProperties}
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveSubcategory(null);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </ScrollableChips>
            ) : (
              <div className="active-category-container">
                <button 
                  className="chip chip-active"
                  style={{ '--chip-color': 'var(--primary)', flexShrink: 0 } as React.CSSProperties}
                  onClick={() => {
                    setActiveCategory(null);
                    setActiveSubcategory(null);
                  }}
                >
                  {activeCategory}
                </button>
                
                {availableSubcategories.length > 0 && (
                  <>
                    <div className="category-divider" />
                    <ScrollableChips className="subcategory-chips">
                      {availableSubcategories.map(subcat => {
                        const isActive = subcat === activeSubcategory;
                        return (
                          <button 
                            key={subcat}
                            className={`chip ${isActive ? 'chip-active' : ''}`}
                            onClick={() => setActiveSubcategory(isActive ? null : subcat)}
                          >
                            {subcat}
                          </button>
                        );
                      })}
                    </ScrollableChips>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="toolbar" style={{ padding: 0, flexShrink: 0 }}>
            <PremiumSelect 
              value={sortMode}
              onChange={setSortMode}
              options={[
                { value: 'default', label: 'Sort: Featured' },
                { value: 'price-asc', label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
                { value: 'name-asc', label: 'Name: A-Z' }
              ]}
            />
          </div>
        </div>
      </div>

      <div style={{ minHeight: '50vh' }}>
        <main className="product-grid shop-grid">
          {filteredProducts.length === 0 ? (
            <p className="loading">No products match your search.</p>
          ) : (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
