'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useAppStore, type Order, type ProductRequest } from '../../src/store/useAppStore';
import type { Product } from '../../src/store/useCartStore';
import ScrollableChips from '../../src/components/ScrollableChips';
import { logger } from '../../src/utils/logger';

const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type and size before reading
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE_MB = 5;
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error(`Invalid file type "${file.type}". Only JPEG, PNG, WebP, and GIF images are allowed.`));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      reject(new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_SIZE_MB}MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getHeatmapColor = (count: number, max: number) => {
  if (count === 0) return '#f0f0f0';
  const intensity = count / max;
  if (intensity > 0.7) return 'var(--accent, #F28C63)'; // Orange for high
  if (intensity > 0.3) return 'var(--primary, #0F2F24)'; // Dark Green for medium
  return '#8E9D97'; // Lighter green for low
};


const getTagColor = (type: 'category' | 'subcategory') => {
  if (type === 'category') {
    return { bg: '#E3F2FD', text: '#1565C0' }; // Blue
  }
  return { bg: '#FFF3E0', text: '#EF6C00' }; // Orange
};

const SalesCalendarHeatmap = ({ selectedDate, onChange, orders }: { selectedDate: string, onChange: (date: string) => void, orders: Order[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeMonth = (offset: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

  const monthData = useMemo(() => {
    const data = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const count = orders.filter(o => {
        if (o.status === 'cancelled') return false;
        const orderDate = new Date(o.createdAt);
        return orderDate >= start && orderDate <= end;
      }).length;
      return count;
    });
    const max = Math.max(...data, 1);
    return { data, max };
  }, [currentMonth, orders, daysInMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const blanks = Array.from({ length: firstDayIndex }).map((_, i) => <div key={`blank-${i}`} className="calendar-cell blank"></div>);
  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    // Format date carefully to handle local timezone
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
    
    const isSelected = dateStr === selectedDate;
    const count = monthData.data[i];
    const bgColor = getHeatmapColor(count, monthData.max);
    
    return (
      <div 
        key={day} 
        className={`calendar-cell ${isSelected ? 'selected' : ''}`}
        style={{ 
          background: bgColor, 
          color: count > 0 ? '#fff' : '#333',
          border: isSelected ? '2px solid #000' : '1px solid transparent'
        }}
        onClick={() => {
          onChange(dateStr);
          setIsOpen(false);
        }}
        title={`${count} orders`}
      >
        {day}
      </div>
    );
  });

  return (
    <div className="custom-calendar-wrapper" ref={containerRef}>
      <button className="calendar-trigger-btn" onClick={() => setIsOpen(!isOpen)}>
        {new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      </button>

      {isOpen && (
        <div className="calendar-popover">
          <div className="calendar-header">
            <button onClick={() => changeMonth(-1)}>&larr;</button>
            <strong>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</strong>
            <button onClick={() => changeMonth(1)}>&rarr;</button>
          </div>
          <div className="calendar-weekdays">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="calendar-grid">
            {blanks}
            {days}
          </div>
          <div className="calendar-footer">
            <div className="legend">
              <span style={{ background: '#f0f0f0' }}></span> 0
              <span style={{ background: '#8E9D97' }}></span> Low
              <span style={{ background: 'var(--primary)' }}></span> Med
              <span style={{ background: 'var(--accent, #F28C63)' }}></span> High
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Combobox = ({ name, placeholder, defaultValue = '', options, required = false, onChange }: { name: string, placeholder: string, defaultValue?: string, options: string[], required?: boolean, onChange?: (val: string) => void }) => {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { setValue(e.target.value); setIsOpen(true); if (onChange) onChange(e.target.value); }}
        onFocus={() => setIsOpen(true)}
        required={required}
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem', outline: 'none', background: 'white' }}
        autoComplete="off"
      />
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.5, padding: '4px', userSelect: 'none', fontSize: '0.7rem' }}
      >
        ▼
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: '4px',
          background: 'white', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          maxHeight: '200px', 
          overflowY: 'auto',
          zIndex: 50,
          listStyle: 'none',
          padding: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {filteredOptions.map((opt, i) => (
            <li 
              key={i}
              onClick={() => { setValue(opt); setIsOpen(false); if (onChange) onChange(opt); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--text)' }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PremiumDropdown = ({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          padding: '8px 24px 8px 12px', 
          borderRadius: '6px', 
          border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`, 
          fontSize: '0.85rem', 
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
          boxShadow: isOpen ? '0 0 0 3px rgba(15,47,36,0.1)' : 'none',
          transition: 'all 0.2s ease',
          color: value ? 'var(--text)' : 'var(--text-muted)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || placeholder}</span>
        <svg style={{ position: 'absolute', right: '8px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>

      {isOpen && (
        <ul style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: '4px',
          background: 'white', 
          border: '1px solid var(--border)', 
          borderRadius: '6px', 
          maxHeight: '200px', 
          overflowY: 'auto',
          zIndex: 9999, // high z-index to overlay next table rows
          listStyle: 'none',
          padding: '4px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          {options.map((opt, i) => (
            <li 
              key={i}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ 
                padding: '8px 12px', 
                cursor: 'pointer', 
                borderRadius: '4px', 
                fontSize: '0.85rem', 
                color: 'var(--text)',
                background: value === opt ? 'var(--surface-alt)' : 'transparent',
                fontWeight: value === opt ? 600 : 400
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Admin = () => {
  const { 
    isAdmin,
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    storeSettings,
    updateStoreSettings,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getAllProductRequests,
    isInitializing
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'restock' | 'settings' | 'analytics'>('dashboard');
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [activeMoveSubcat, setActiveMoveSubcat] = useState<{name: string, currentCategory: string | 'UNLINKED'} | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [adminActiveCategory, setAdminActiveCategory] = useState<string | null>(null);
  const [adminActiveSubcategory, setAdminActiveSubcategory] = useState<string | null>(null);
  const [adminProductSearch, setAdminProductSearch] = useState('');

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [editedProducts, setEditedProducts] = useState<Record<string, Product>>({});
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const [formCategory, setFormCategory] = useState('');
  
  useEffect(() => {
    if (editingProduct) {
      setFormCategory(editingProduct.category);
    } else if (isAddingNew) {
      setFormCategory(adminActiveCategory ? adminActiveCategory : '');
    }
  }, [editingProduct, isAddingNew, adminActiveCategory]);

  const allCategoriesCombined = useMemo(() => {
    return Array.from(new Set([...(storeSettings.managedCategories || []), ...products.map(p => p.category).filter(Boolean)])) as string[];
  }, [storeSettings.managedCategories, products]);

  const allSubcategoriesCombined = useMemo(() => {
    return Array.from(new Set([...(storeSettings.managedSubcategories || []), ...products.map(p => p.subcategory).filter(Boolean)])) as string[];
  }, [storeSettings.managedSubcategories, products]);

  const categoryTreeMapping = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    for (const cat of allCategoriesCombined) {
      mapping[cat] = [];
    }
    if (storeSettings.categoryMapping) {
      for (const [cat, subcats] of Object.entries(storeSettings.categoryMapping)) {
        if (!mapping[cat]) mapping[cat] = [];
        mapping[cat].push(...subcats);
      }
    }
    products.forEach(p => {
      if (p.category && p.subcategory) {
        if (!mapping[p.category]) mapping[p.category] = [];
        mapping[p.category].push(p.subcategory);
      }
    });
    for (const cat of Object.keys(mapping)) {
      mapping[cat] = Array.from(new Set(mapping[cat]));
    }
    return mapping;
  }, [allCategoriesCombined, storeSettings.categoryMapping, products]);

  const unlinkedSubcategories = useMemo(() => {
    const allMappedSubcategories = new Set(Object.values(categoryTreeMapping).flat());
    return allSubcategoriesCombined.filter(s => !allMappedSubcategories.has(s));
  }, [allSubcategoriesCombined, categoryTreeMapping]);

  const availableSubcategoriesForForm = useMemo(() => {
    if (!formCategory) {
      return allSubcategoriesCombined;
    }
    const mapped = categoryTreeMapping[formCategory] || [];
    return Array.from(new Set([...unlinkedSubcategories, ...mapped]));
  }, [formCategory, allSubcategoriesCombined, categoryTreeMapping, unlinkedSubcategories]);

  const adminAvailableSubcategories = useMemo(() => {
    if (!adminActiveCategory) return [];
    return categoryTreeMapping[adminActiveCategory] || [];
  }, [adminActiveCategory, categoryTreeMapping]);
  
  // Settings States
  const defaultLayout = [
    { id: 'bestsellers', label: 'Bestselling Products', visible: true },
    { id: 'explore', label: 'Explore Categories', visible: true },
    { id: 'featured', label: 'Featured Products', visible: true },
    { id: 'offers', label: 'Offers Section', visible: true }
  ];
  
  const [localSettings, setLocalSettings] = useState(() => ({
    ...storeSettings,
    sectionLayout: storeSettings.sectionLayout?.length ? storeSettings.sectionLayout : defaultLayout
  }));

  useEffect(() => {
    if (!isInitializing) {
      setLocalSettings({
        ...storeSettings,
        sectionLayout: storeSettings.sectionLayout?.length ? storeSettings.sectionLayout : defaultLayout
      });
    }
  }, [isInitializing]);

  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
  const [settingsSortMode, setSettingsSortMode] = useState('name-asc');
  
  const settingsFilteredProducts = useMemo(() => {
    let list = [...products];
    if (settingsSearchQuery) {
      const term = settingsSearchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term));
    }
    if (settingsSortMode === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (settingsSortMode === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
    else if (settingsSortMode === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (settingsSortMode === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    return list;
  }, [products, settingsSearchQuery, settingsSortMode]);

  const [isUploading, setIsUploading] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // New Analytics & Filter states
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [orderFilter, setOrderFilter] = useState<Order['status'] | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week' | 'day'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const allOrders = await getAllOrders();
      setOrders(allOrders);
    } catch (err) {
      logger.error('Failed to fetch orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const allRequests = await getAllProductRequests();
      setProductRequests(allRequests);
    } catch (err) {
      logger.error('Failed to fetch requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchRequests();
    }
  }, [isAdmin]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      logger.error('Failed to update status:', err);
      alert('Failed to update status.');
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm('Are you sure you want to cancel this order? This will restock the items and cannot be undone.')) return;
    try {
      await cancelOrder(order);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      logger.error('Failed to cancel order:', err);
      alert('Failed to cancel order.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const uiSettings = {
        heroSubtitle: localSettings.heroSubtitle,
        offersTitle: localSettings.offersTitle,
        offersDiscount: localSettings.offersDiscount,
        offersDesc: localSettings.offersDesc,
        bestsellerIds: localSettings.bestsellerIds,
        bestsellersTitle: localSettings.bestsellersTitle,
        bestsellersSubtitle: localSettings.bestsellersSubtitle,
        featuredIds: localSettings.featuredIds,
        featuredTitle: localSettings.featuredTitle,
        featuredSubtitle: localSettings.featuredSubtitle,
        exploreCategories: localSettings.exploreCategories,
        exploreTitle: localSettings.exploreTitle,
        exploreSubtitle: localSettings.exploreSubtitle,
        sectionLayout: localSettings.sectionLayout,
      };
      await updateStoreSettings({ ...storeSettings, ...uiSettings });
      alert("Settings updated successfully!");
    } catch (err: any) {
      logger.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    }
  };

  const moveSubcategory = async (subcat: string, sourceCat: string | 'UNLINKED', targetCat: string | 'UNLINKED') => {
    if (sourceCat === targetCat) return;
    try {
      let newMapping = { ...(storeSettings.categoryMapping || {}) };
      if (sourceCat !== 'UNLINKED') {
        newMapping[sourceCat] = (newMapping[sourceCat] || []).filter(s => s !== subcat);
      }
      if (targetCat !== 'UNLINKED') {
        newMapping[targetCat] = Array.from(new Set([...(newMapping[targetCat] || []), subcat]));
      }
      await updateStoreSettings({ ...storeSettings, categoryMapping: newMapping });

      if (sourceCat !== 'UNLINKED' && targetCat !== 'UNLINKED') {
        const productsToUpdate = products.filter(p => p.category === sourceCat && p.subcategory === subcat);
        if (productsToUpdate.length > 0) {
          if (confirm(`This will move ${productsToUpdate.length} product(s) currently in "${sourceCat} -> ${subcat}" to "${targetCat}". Proceed?`)) {
            for (const p of productsToUpdate) {
              await updateProduct({ ...p, category: targetCat });
            }
          }
        }
      } else if (sourceCat !== 'UNLINKED' && targetCat === 'UNLINKED') {
        const productsToUpdate = products.filter(p => p.category === sourceCat && p.subcategory === subcat);
        if (productsToUpdate.length > 0) {
           if (confirm(`This subcategory is used by ${productsToUpdate.length} product(s) in "${sourceCat}". Unlinking it will clear the subcategory from these products. Proceed?`)) {
             for (const p of productsToUpdate) {
               await updateProduct({ ...p, subcategory: '' });
             }
           }
        }
      }
    } catch (err: any) {
      logger.error('moveSubcategory error:', err);
      alert(err.message ?? 'An error occurred.');
    }
  };

  const handleCategoryDrop = async (e: React.DragEvent, targetCat: string | 'UNLINKED') => {
    e.preventDefault();
    setDragOverCategory(null);
    const subcat = e.dataTransfer.getData('subcategory');
    const sourceCat = e.dataTransfer.getData('sourceCategory');
    if (!subcat) return;
    await moveSubcategory(subcat, sourceCat, targetCat);
  };


  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    
    let finalImageUrl = editingProduct?.imageUrl || editingProduct?.image || '';
    const imageFile = formData.get('imageFile') as File | null;
    
    if (imageFile && imageFile.size > 0) {
      try {
        finalImageUrl = await convertImageToBase64(imageFile);
      } catch (err) {
        logger.error('Failed to process image:', err);
        alert('Failed to process image. Please use a valid JPEG, PNG, WebP, or GIF file under 5MB.');
        setIsUploading(false);
        return;
      }
    }
    
    const productData = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')) || 0,
      image: finalImageUrl,
      imageUrl: finalImageUrl,
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || undefined,
      description: formData.get('description') as string || '',
      stock: Number(formData.get('stock')) || 0,
    };

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, ...productData });
      } else {
        await addProduct(productData);
      }
      setEditingProduct(null);
      setIsAddingNew(false);
      setNewImagePreview(null);
    } catch (err: any) {
      logger.error('Failed to save product:', err);
      alert('Error saving product. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setNewImagePreview(null);
  };

  // --- Analytics Calculations ---
  const { weeklyData, currentMonthRevenue, percentageChange, categorySales, maxMonthlyOrders, maxCategorySales } = useMemo(() => {
    const selDate = new Date(selectedDate);
    // Find monday of the week
    const dayOfWeek = selDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(selDate);
    monday.setDate(monday.getDate() + diffToMonday);
    monday.setHours(0,0,0,0);

    const weekDays = Array.from({length: 7}).map((_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });

    const weeklyData = weekDays.map(date => {
      // Find orders matching this date in local timezone
      // Since createdAt is ISO string in UTC, a precise local filter would require converting to local.
      // We'll approximate by checking if local date matches.
      const startOfDay = new Date(date);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23,59,59,999);
      
      const count = orders.filter(o => {
        if (o.status === 'cancelled') return false;
        const orderDate = new Date(o.createdAt);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      }).length;
      
      const dateStr = date.toISOString().split('T')[0];
      return { 
        label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), 
        dateStr, 
        count,
        isCurrent: dateStr === selectedDate
      };
    });

    // Monthly Sales
    const currentMonth = selDate.getMonth();
    const currentYear = selDate.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currRev = 0;
    let prevRev = 0;
    const catSales: Record<string, number> = {};

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = new Date(o.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        currRev += o.total;
        o.items.forEach(item => {
          const cat = item.category || 'Other';
          catSales[cat] = (catSales[cat] || 0) + item.quantity;
        });
      } else if (d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear) {
        prevRev += o.total;
      }
    });

    const pctChange = prevRev === 0 ? (currRev > 0 ? 100 : 0) : ((currRev - prevRev) / prevRev) * 100;
    const maxCategorySales = Math.max(...Object.values(catSales), 1);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let maxMonthlyOrders = 1;
    for (let i = 1; i <= daysInMonth; i++) {
       const start = new Date(currentYear, currentMonth, i);
       const end = new Date(currentYear, currentMonth, i, 23, 59, 59, 999);
       const count = orders.filter(o => {
         if (o.status === 'cancelled') return false;
         const orderDate = new Date(o.createdAt);
         return orderDate >= start && orderDate <= end;
       }).length;
       if (count > maxMonthlyOrders) maxMonthlyOrders = count;
    }

    return { 
      weeklyData, 
      currentMonthRevenue: currRev, 
      percentageChange: pctChange,
      categorySales: Object.entries(catSales).sort((a,b) => b[1]-a[1]), // Sort desc
      maxMonthlyOrders,
      maxCategorySales
    };
  }, [orders, selectedDate]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderFilter !== 'all') {
      list = list.filter(o => o.status === orderFilter);
    }
    
    if (timeFilter !== 'all') {
      const selDate = new Date(selectedDate);
      list = list.filter(o => {
        const d = new Date(o.createdAt);
        if (timeFilter === 'day') {
          return d.getFullYear() === selDate.getFullYear() && d.getMonth() === selDate.getMonth() && d.getDate() === selDate.getDate();
        } else if (timeFilter === 'month') {
          return d.getFullYear() === selDate.getFullYear() && d.getMonth() === selDate.getMonth();
        } else if (timeFilter === 'week') {
          const dayOfWeek = selDate.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const start = new Date(selDate);
          start.setDate(start.getDate() + diffToMonday);
          start.setHours(0,0,0,0);
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          end.setHours(23,59,59,999);
          return d >= start && d <= end;
        }
        return true;
      });
    }
    return list;
  }, [orders, orderFilter, timeFilter, selectedDate]);

  const filterCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o=>o.status==='pending').length,
      paid: orders.filter(o=>o.status==='paid').length,
      processed: orders.filter(o=>o.status==='processed').length,
      shipped: orders.filter(o=>o.status==='shipped').length,
      complete: orders.filter(o=>o.status==='complete').length,
      cancelled: orders.filter(o=>o.status==='cancelled').length,
    }
  }, [orders]);


  if (isInitializing) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    redirect("/");
    return null;
  }

  return (
    <div className="admin-layout">
      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <h2 className="serif" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem', lineHeight: '1.1' }}>Basement Buzz<br/>Corner</h2>
        <button className="admin-hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {isMobileMenuOpen && <div className="admin-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2 className="serif" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.5rem', lineHeight: '1.1' }}>Basement Buzz<br/>Corner</h2>
        </div>
        
        <div className="admin-profile">
          <div className="admin-avatar">A</div>
          <div className="admin-info">
            <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.95rem' }}>Admin User</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Management</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </button>
          <button className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Products
          </button>
          <button className={`admin-nav-item ${activeTab === 'restock' ? 'active' : ''}`} onClick={() => { setActiveTab('restock'); setIsMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Restock
          </button>
          <button className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setLocalSettings({ ...storeSettings, sectionLayout: storeSettings.sectionLayout?.length ? storeSettings.sectionLayout : defaultLayout }); setIsMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Settings
          </button>
          <button className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Analytics
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <Link href="/" className="add-btn-editorial" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#F1EBE4', color: 'var(--primary)' }}>
            &larr; Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard-view">
            {/* Analytics Widgets */}
            <div className="analytics-widgets">
              
              {/* Orders Chart */}
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <h2 className="section-title">Admin Dashboard</h2>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <SalesCalendarHeatmap 
                    selectedDate={selectedDate} 
                    onChange={setSelectedDate} 
                    orders={orders} 
                  />
                </div>
                <div className="bar-chart-container">
                  <div className="y-axis">
                    <span>{maxMonthlyOrders}</span>
                    <span>{Math.round(maxMonthlyOrders/2)}</span>
                    <span>0</span>
                  </div>
                  <div className="bars-wrapper">
                    {weeklyData.map((d, i) => {
                      const heightPct = (d.count / maxMonthlyOrders) * 100;
                      return (
                        <div key={i} className={`bar-col ${d.isCurrent ? 'current' : ''}`}>
                          {d.count > 0 ? (
                            <div className="bar-fill-wrapper">
                              <div 
                                className="bar-fill" 
                                style={{ 
                                  height: `${heightPct}%`, 
                                  background: getHeatmapColor(d.count, maxMonthlyOrders) 
                                }} 
                                title={`${d.count} orders`}
                              ></div>
                            </div>
                          ) : (
                            <div className="bar-fill-empty" style={{ flex: 1 }}></div>
                          )}
                          <span className="bar-label">{d.label.split(' ')[0]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Sales Overview */}
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <h3 className="analytics-title">Sales Overview</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                  <span className="sales-total">₹{currentMonthRevenue.toLocaleString()}</span>
                  <span className={`sales-pct ${percentageChange >= 0 ? 'positive' : 'negative'}`}>
                    {percentageChange >= 0 ? '↗' : '↘'} {Math.abs(percentageChange).toFixed(1)}%
                  </span>
                </div>
                
                <div className="sales-categories-chart">
                  {categorySales.length === 0 ? (
                    <div className="no-data">No sales this month</div>
                  ) : (
                    <div className="horizontal-bars">
                      {categorySales.map(([cat, qty], i) => {
                        const widthPct = (qty / maxCategorySales) * 100;
                        // Use a set of greens/grays for premium look
                        const colors = ['#0F2F24', '#1FA089', '#596D65', '#8E9D97', '#DCD9D1'];
                        const bgColor = colors[i % colors.length];
                        return (
                          <div key={cat} className="h-bar-row">
                            <span className="h-bar-label">{cat}</span>
                            <div className="h-bar-track">
                              <div className="h-bar-fill" style={{ width: `${widthPct}%`, background: bgColor }} title={`${qty} sold`}></div>
                            </div>
                            <span className="h-bar-value">{qty}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="orders-section-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 className="serif" style={{ margin: 0 }}>Orders <span className="order-count-badge">{filterCounts.all}</span></h2>
                <div style={{ display: 'flex', gap: '12px 8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="order-filters" style={{ marginRight: '8px' }}>
                    <button className={`order-filter-pill ${timeFilter === 'all' ? 'active' : ''}`} onClick={() => setTimeFilter('all')}>All Time</button>
                    <button className={`order-filter-pill ${timeFilter === 'month' ? 'active' : ''}`} onClick={() => setTimeFilter('month')}>Month</button>
                    <button className={`order-filter-pill ${timeFilter === 'week' ? 'active' : ''}`} onClick={() => setTimeFilter('week')}>Week</button>
                    <button className={`order-filter-pill ${timeFilter === 'day' ? 'active' : ''}`} onClick={() => setTimeFilter('day')}>Day</button>
                  </div>
                  <SalesCalendarHeatmap 
                    selectedDate={selectedDate} 
                    onChange={setSelectedDate} 
                    orders={orders} 
                  />
                </div>
              </div>
              <div className="order-filters" style={{ marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <button className={`order-filter-pill ${orderFilter === 'all' ? 'active' : ''}`} onClick={() => setOrderFilter('all')}>All Statuses</button>
                <button className={`order-filter-pill ${orderFilter === 'pending' ? 'active' : ''}`} onClick={() => setOrderFilter('pending')}>Pending <span className="filter-count">{filterCounts.pending}</span></button>
                <button className={`order-filter-pill ${orderFilter === 'paid' ? 'active' : ''}`} onClick={() => setOrderFilter('paid')}>Paid <span className="filter-count">{filterCounts.paid}</span></button>
                <button className={`order-filter-pill ${orderFilter === 'processed' ? 'active' : ''}`} onClick={() => setOrderFilter('processed')}>Processed <span className="filter-count">{filterCounts.processed}</span></button>
                <button className={`order-filter-pill ${orderFilter === 'shipped' ? 'active' : ''}`} onClick={() => setOrderFilter('shipped')}>Shipped <span className="filter-count">{filterCounts.shipped}</span></button>
                <button className={`order-filter-pill ${orderFilter === 'complete' ? 'active' : ''}`} onClick={() => setOrderFilter('complete')}>Completed <span className="filter-count">{filterCounts.complete}</span></button>
                <button className={`order-filter-pill ${orderFilter === 'cancelled' ? 'active' : ''}`} onClick={() => setOrderFilter('cancelled')}>Cancelled <span className="filter-count">{filterCounts.cancelled}</span></button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isLoadingOrders ? (
                <p>Loading orders...</p>
              ) : filteredOrders.length === 0 ? (
                <div className="admin-card"><p>No orders found.</p></div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className="admin-card order-card">
                    <div className="order-header">
                      <div>
                        <span className="order-meta-label">Date</span>
                        <strong>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</strong>
                      </div>
                      <div>
                        <span className="order-meta-label">Customer</span>
                        <strong>{order.name}</strong>
                        <div style={{ fontSize: '0.85rem' }}>{order.email}</div>
                      </div>
                      <div>
                        <span className="order-meta-label">Total</span>
                        <strong>₹{order.total.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="order-meta-label">Invoice No.</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{order.invoiceNumber}</span>
                      </div>
                    </div>
                    
                    <div className="order-body">
                      <div className="order-details-col">
                        <h4 style={{ margin: '0 0 10px 0' }}>Invoice Details</h4>
                        <div className="order-items-list">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-item-row">
                              <span>{item.quantity} x {item.name}</span>
                              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-address">
                          <strong>Delivery Address:</strong><br/>
                          {order.address}<br/>
                          <strong>Phone:</strong> {order.phone}
                        </div>
                        {order.notes && (
                          <div className="order-notes">
                            <strong>Notes:</strong> {order.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="order-status-col">
                        <h4 style={{ margin: '0 0 10px 0' }}>Update Status</h4>
                        {order.status === 'cancelled' ? (
                          <div style={{ color: 'var(--error)', fontWeight: 'bold', fontSize: '1.1rem', padding: '12px 0' }}>
                            CANCELLED
                          </div>
                        ) : (
                          <>
                            <select 
                              value={order.status} 
                              onChange={(e) => handleStatusChange(order.id as string, e.target.value as Order['status'])}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="processed">Processed</option>
                              <option value="shipped">Shipped</option>
                              <option value="complete">Complete</option>
                            </select>
                            <div className="current-status" style={{ marginBottom: '16px' }}>
                              Current Status: <strong>{order.status}</strong>
                            </div>
                            <button 
                              onClick={() => handleCancelOrder(order)}
                              className="add-btn-editorial"
                              style={{ width: '100%', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Existing Sections (Products, Restock, Settings, Analytics) */}
        {activeTab === 'analytics' && (
          <div className="admin-card">
            <h2 className="serif">Advanced Analytics</h2>
            <p style={{ color: 'var(--text-muted)' }}>Advanced reporting and historical metrics coming soon.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-card">
            <h3 style={{ margin: '0 0 20px 0' }}>Store Settings</h3>
            <div className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontWeight: 'bold' }}>Welcome Subtitle (Hero Section)</label>
                <input 
                  type="text"
                  value={localSettings.heroSubtitle}
                  onChange={(e) => setLocalSettings({...localSettings, heroSubtitle: e.target.value})}
                  placeholder="Enter welcome subtitle..."
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '8px' }}
                />
              </div>

              {localSettings.sectionLayout?.map((section, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === (localSettings.sectionLayout?.length || 0) - 1;
                
                return (
                  <div key={section.id} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', opacity: section.visible ? 1 : 0.6, transition: 'opacity 0.2s ease', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: section.visible ? '16px' : '0', paddingBottom: section.visible ? '16px' : '0', borderBottom: section.visible ? '1px solid var(--border)' : 'none', transition: 'all 0.2s ease' }}>
                      <input 
                        type="checkbox" 
                        checked={section.visible} 
                        onChange={(e) => {
                          const newLayout = [...(localSettings.sectionLayout || [])];
                          newLayout[idx] = { ...section, visible: e.target.checked };
                          setLocalSettings({ ...localSettings, sectionLayout: newLayout });
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <h4 style={{ margin: 0, flex: 1, color: section.visible ? 'inherit' : 'var(--text-muted)' }}>{section.label}</h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          disabled={isFirst} 
                          onClick={() => {
                            const newLayout = [...(localSettings.sectionLayout || [])];
                            [newLayout[idx - 1], newLayout[idx]] = [newLayout[idx], newLayout[idx - 1]];
                            setLocalSettings({ ...localSettings, sectionLayout: newLayout });
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: isFirst ? 'not-allowed' : 'pointer', opacity: isFirst ? 0.3 : 1, padding: '4px' }}
                          title="Move Up"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>
                        <button 
                          disabled={isLast} 
                          onClick={() => {
                            const newLayout = [...(localSettings.sectionLayout || [])];
                            [newLayout[idx], newLayout[idx + 1]] = [newLayout[idx + 1], newLayout[idx]];
                            setLocalSettings({ ...localSettings, sectionLayout: newLayout });
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: isLast ? 'not-allowed' : 'pointer', opacity: isLast ? 0.3 : 1, padding: '4px' }}
                          title="Move Down"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                      </div>
                    </div>
                    
                    {section.visible && (
                      <div style={{ pointerEvents: section.visible ? 'auto' : 'none' }}>
                        {section.id === 'offers' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <label>Title</label>
                              <input 
                                type="text"
                                value={localSettings.offersTitle}
                                onChange={(e) => setLocalSettings({...localSettings, offersTitle: e.target.value})}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                              />
                            </div>
                            <div>
                              <label>Discount Value</label>
                              <input 
                                type="text"
                                value={localSettings.offersDiscount}
                                onChange={(e) => setLocalSettings({...localSettings, offersDiscount: e.target.value})}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                              />
                            </div>
                            <div>
                              <label>Description</label>
                              <textarea 
                                rows={3}
                                value={localSettings.offersDesc}
                                onChange={(e) => setLocalSettings({...localSettings, offersDesc: e.target.value})}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px', resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {section.id === 'bestsellers' && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                              <div>
                                <label>Section Title</label>
                                <input 
                                  type="text"
                                  value={localSettings.bestsellersTitle || ''}
                                  onChange={(e) => setLocalSettings({...localSettings, bestsellersTitle: e.target.value})}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                                />
                              </div>
                              <div>
                                <label>Section Subtitle</label>
                                <input 
                                  type="text"
                                  value={localSettings.bestsellersSubtitle || ''}
                                  onChange={(e) => setLocalSettings({...localSettings, bestsellersSubtitle: e.target.value})}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                                />
                              </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select up to 8 products to display in the Bestsellers section on the Home page.</p>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              <input 
                                type="text" 
                                placeholder="Search products..." 
                                value={settingsSearchQuery}
                                onChange={(e) => setSettingsSearchQuery(e.target.value)}
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                              />
                              <select 
                                value={settingsSortMode}
                                onChange={(e) => setSettingsSortMode(e.target.value)}
                                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                              >
                                <option value="name-asc">Name: A-Z</option>
                                <option value="name-desc">Name: Z-A</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                              </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                              {settingsFilteredProducts.map(p => {
                                const validBestsellerIds = localSettings.bestsellerIds.filter(id => products.some(prod => prod.id === id));
                                const isChecked = validBestsellerIds.includes(p.id!);
                                const isDisabled = !isChecked && validBestsellerIds.length >= 8;
                                return (
                                  <label key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, border: isChecked ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', padding: '10px', background: isChecked ? 'rgba(15, 47, 36, 0.05)' : 'white', transition: 'all 0.2s ease' }}>
                                    <img src={p.imageUrl || p.image} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        disabled={isDisabled}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setLocalSettings({...localSettings, bestsellerIds: [...validBestsellerIds, p.id!]});
                                          } else {
                                            setLocalSettings({...localSettings, bestsellerIds: validBestsellerIds.filter(id => id !== p.id)});
                                          }
                                        }}
                                        style={{ marginTop: '2px', width: '16px', height: '16px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                      />
                                      <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.2 }}>{p.name}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                              Selected: {localSettings.bestsellerIds.filter(id => products.some(prod => prod.id === id)).length} / 8
                            </div>
                          </div>
                        )}

                        {section.id === 'featured' && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                              <div>
                                <label>Section Title</label>
                                <input 
                                  type="text"
                                  value={localSettings.featuredTitle || ''}
                                  onChange={(e) => setLocalSettings({...localSettings, featuredTitle: e.target.value})}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                                />
                              </div>
                              <div>
                                <label>Section Subtitle</label>
                                <input 
                                  type="text"
                                  value={localSettings.featuredSubtitle || ''}
                                  onChange={(e) => setLocalSettings({...localSettings, featuredSubtitle: e.target.value})}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                                />
                              </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select up to 8 products to display in the Featured section on the Home page.</p>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                              <input 
                                type="text" 
                                placeholder="Search products..." 
                                value={settingsSearchQuery}
                                onChange={(e) => setSettingsSearchQuery(e.target.value)}
                                style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                              />
                              <select 
                                value={settingsSortMode}
                                onChange={(e) => setSettingsSortMode(e.target.value)}
                                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                              >
                                <option value="name-asc">Name: A-Z</option>
                                <option value="name-desc">Name: Z-A</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                              </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                              {settingsFilteredProducts.map(p => {
                                const validFeaturedIds = localSettings.featuredIds.filter(id => products.some(prod => prod.id === id));
                                const isChecked = validFeaturedIds.includes(p.id!);
                                const isDisabled = !isChecked && validFeaturedIds.length >= 8;
                                return (
                                  <label key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, border: isChecked ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', padding: '10px', background: isChecked ? 'rgba(15, 47, 36, 0.05)' : 'white', transition: 'all 0.2s ease' }}>
                                    <img src={p.imageUrl || p.image} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        disabled={isDisabled}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setLocalSettings({...localSettings, featuredIds: [...validFeaturedIds, p.id!]});
                                          } else {
                                            setLocalSettings({...localSettings, featuredIds: validFeaturedIds.filter(id => id !== p.id)});
                                          }
                                        }}
                                        style={{ marginTop: '2px', width: '16px', height: '16px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                      />
                                      <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.2 }}>{p.name}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                              Selected: {localSettings.featuredIds.filter(id => products.some(prod => prod.id === id)).length} / 8
                            </div>
                          </div>
                        )}

                        {section.id === 'explore' && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                              <div>
                                <label>Section Title</label>
                                <input 
                                  type="text"
                                  value={localSettings.exploreTitle || ''}
                                  onChange={(e) => setLocalSettings({...localSettings, exploreTitle: e.target.value})}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                                />
                              </div>
                              <div>
                                <label>Section Subtitle</label>
                                <input 
                                  type="text"
                                  value={localSettings.exploreSubtitle || ''}
                                  onChange={(e) => setLocalSettings({...localSettings, exploreSubtitle: e.target.value})}
                                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', marginTop: '4px' }}
                                />
                              </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the 6 category cards shown in the Explore section on the Home page.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                              {(() => {
                                const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
                                return [0, 1, 2, 3, 4, 5].map(index => {
                                  const cat = localSettings.exploreCategories?.[index] || { name: '' };
                                  return (
                                    <div key={index} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--card-bg)' }}>
                                      <h5 style={{ margin: '0 0 10px 0' }}>Category Card {index + 1}</h5>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                          <label style={{ fontSize: '0.8rem' }}>Category Name</label>
                                          <select 
                                            value={cat.name}
                                            onChange={(e) => {
                                              const newCats = [...(localSettings.exploreCategories || [])];
                                              newCats[index] = { ...cat, name: e.target.value };
                                              setLocalSettings({ ...localSettings, exploreCategories: newCats });
                                            }}
                                            style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }}
                                          >
                                            <option value="">Select Category...</option>
                                            {uniqueCategories.map(c => (
                                              <option key={c} value={c}>{c}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label style={{ fontSize: '0.8rem' }}>Background Image</label>
                                          {cat.imageUrl && (
                                            <img src={cat.imageUrl} alt="preview" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />
                                          )}
                                          <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const base64 = await convertImageToBase64(file);
                                                const newCats = [...(localSettings.exploreCategories || [])];
                                                newCats[index] = { ...cat, imageUrl: base64 };
                                                setLocalSettings({ ...localSettings, exploreCategories: newCats });
                                              }
                                            }}
                                            style={{ fontSize: '0.8rem' }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}



              <button className="add-btn-editorial" onClick={handleSaveSettings} style={{ marginTop: '16px', maxWidth: '200px' }}>
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'products' && !editingProduct && !isAddingNew && (
          <>
            {/* Category Management Section */}
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Manage Categories & Subcategories</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Add or remove categories from the master list. These will appear in the Add Product dropdowns.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {/* Unlinked Subcategories Pool */}
                <div style={{ flex: '1 1 300px', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0' }}>Unlinked Subcategories</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: 1.4 }}>Drag these into a category on the right.</p>
                  
                  {/* Add new unlinked subcategory */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                    <input type="text" id="newSubcatInputProd" placeholder="New subcategory..." style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                    <button onClick={async (e) => {
                      e.preventDefault();
                      const input = document.getElementById('newSubcatInputProd') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val && !storeSettings.managedSubcategories?.includes(val) && !products.some(p => p.subcategory === val)) {
                        try {
                          const newSubcats = [...(storeSettings.managedSubcategories || []), val];
                          await updateStoreSettings({ ...storeSettings, managedSubcategories: newSubcats });
                          setLocalSettings(prev => ({ ...prev, managedSubcategories: newSubcats }));
                          input.value = '';
                        } catch(err: any) { 
                          logger.error('Error adding subcategory:', err);
                          alert('An error occurred.'); 
                        }
                      } else if (val) {
                        alert(`"${val}" already exists.`);
                      }
                    }} className="add-btn-editorial" style={{ width: 'auto', padding: '8px 16px' }}>Add</button>
                  </div>

                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOverCategory('UNLINKED'); }}
                    onDragLeave={() => setDragOverCategory(null)}
                    onDrop={(e) => handleCategoryDrop(e, 'UNLINKED')}
                    style={{ minHeight: '150px', background: dragOverCategory === 'UNLINKED' ? 'var(--bg)' : 'transparent', padding: '10px', borderRadius: '4px', border: '1px dashed var(--border)' }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {unlinkedSubcategories.map(subcat => {
                        const isDynamic = products.some(p => p.subcategory === subcat);
                        return (
                        <div 
                          key={subcat} 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('subcategory', subcat);
                            e.dataTransfer.setData('sourceCategory', 'UNLINKED');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: getTagColor('subcategory').bg, color: getTagColor('subcategory').text, padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', cursor: 'grab', border: '1px solid var(--border)' }}
                          title={isDynamic ? "In use by products" : "Managed"}
                        >
                          {subcat}
                          {isDynamic && <span style={{ fontSize: '0.7rem', opacity: 0.5 }} title="Linked to products">🔗</span>}
                          <span 
                            onClick={() => setActiveMoveSubcat({ name: subcat, currentCategory: 'UNLINKED' })}
                            style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '4px', textDecoration: 'underline' }}
                          >
                            Move
                          </span>
                          <span style={{ cursor: 'pointer', color: 'var(--error)' }} onClick={async () => {
                            if (isDynamic) {
                              alert(`Cannot remove "${subcat}". It is currently assigned to products. To remove it, you must change those products to a different subcategory.`);
                              return;
                            }
                            try {
                              const newSubcats = storeSettings.managedSubcategories!.filter(c => c !== subcat);
                              await updateStoreSettings({ ...storeSettings, managedSubcategories: newSubcats });
                              setLocalSettings(prev => ({ ...prev, managedSubcategories: newSubcats }));
                            } catch(err: any) { 
                              logger.error('Error removing subcategory:', err);
                              alert('An error occurred.'); 
                            }
                          }}>×</span>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>

                {/* Category Tree */}
                <div style={{ flex: '2 1 400px', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0' }}>Category Tree</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: 1.4 }}>Add categories and drop subcategories into them.</p>

                  {/* Add new category */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                    <input type="text" id="newCatInputProd" placeholder="New category..." style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                    <button onClick={async (e) => {
                      e.preventDefault();
                      const input = document.getElementById('newCatInputProd') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val && !storeSettings.managedCategories?.includes(val) && !products.some(p => p.category === val)) {
                        try {
                          const newCats = [...(storeSettings.managedCategories || []), val];
                          await updateStoreSettings({ ...storeSettings, managedCategories: newCats });
                          setLocalSettings(prev => ({ ...prev, managedCategories: newCats }));
                          input.value = '';
                        } catch(err: any) { 
                          logger.error('Error adding category:', err);
                          alert('An error occurred.'); 
                        }
                      } else if (val) {
                        alert(`"${val}" already exists.`);
                      }
                    }} className="add-btn-editorial" style={{ width: 'auto', padding: '8px 16px' }}>Add</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {allCategoriesCombined.map(cat => {
                      const isDynamic = products.some(p => p.category === cat);
                      const mappedSubcats = categoryTreeMapping[cat] || [];
                      const isDragOver = dragOverCategory === cat;
                      
                      return (
                        <div 
                          key={cat}
                          onDragOver={(e) => { e.preventDefault(); setDragOverCategory(cat); }}
                          onDragLeave={() => setDragOverCategory(null)}
                          onDrop={(e) => handleCategoryDrop(e, cat)}
                          style={{ border: `1px solid ${isDragOver ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '6px', padding: '10px', background: isDragOver ? 'var(--bg)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mappedSubcats.length ? '10px' : '0' }}>
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: getTagColor('category').bg, color: getTagColor('category').text, padding: '4px 10px', borderRadius: '12px', fontSize: '0.9rem' }}>
                                {cat}
                              </span>
                              {isDynamic && <span style={{ fontSize: '0.8rem', opacity: 0.5 }} title="Linked to products">🔗</span>}
                            </strong>
                            <span style={{ cursor: 'pointer', color: 'var(--error)', fontSize: '0.85rem' }} onClick={async () => {
                              if (isDynamic) {
                                alert(`Cannot remove "${cat}". It is currently assigned to products. To remove it, you must change those products to a different category.`);
                                return;
                              }
                              try {
                                const newCats = storeSettings.managedCategories!.filter(c => c !== cat);
                                // Also clean up mapping
                                const newMapping = { ...storeSettings.categoryMapping };
                                delete newMapping[cat];
                                await updateStoreSettings({ ...storeSettings, managedCategories: newCats, categoryMapping: newMapping });
                                setLocalSettings(prev => ({ ...prev, managedCategories: newCats, categoryMapping: newMapping }));
                              } catch(err: any) { 
                                logger.error('Error removing category:', err);
                                alert('An error occurred.'); 
                              }
                            }}>Remove</span>
                          </div>
                          
                          {mappedSubcats.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '15px', borderLeft: '2px solid var(--border)' }}>
                              {mappedSubcats.map(subcat => {
                                // Check if THIS specific subcat is dynamically linked to THIS category
                                const isDynLinked = products.some(p => p.category === cat && p.subcategory === subcat);
                                return (
                                  <div 
                                    key={subcat}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('subcategory', subcat);
                                      e.dataTransfer.setData('sourceCategory', cat);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: getTagColor('subcategory').bg, color: getTagColor('subcategory').text, padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', cursor: 'grab', border: '1px solid var(--border)' }}
                                  >
                                    {subcat}
                                    {isDynLinked && <span style={{ fontSize: '0.7rem', opacity: 0.5 }} title="Linked by products">🔗</span>}
                                    <span 
                                      onClick={() => setActiveMoveSubcat({ name: subcat, currentCategory: cat })}
                                      style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '4px', textDecoration: 'underline' }}
                                    >
                                      Move
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {allCategoriesCombined.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '0.9rem' }}>
                        No categories yet. Add one above.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
                <button className="add-btn-editorial" onClick={() => setIsAddingNew(true)} style={{ maxWidth: '200px' }}>
                  + Add New Product
                </button>
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={adminProductSearch}
                  onChange={(e) => setAdminProductSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', flex: 1, minWidth: 0 }}>
                {!adminActiveCategory ? (
                  <ScrollableChips>
                    {allCategoriesCombined.map(cat => (
                      <button
                        key={cat}
                        className="chip"
                        onClick={() => {
                          setAdminActiveCategory(cat);
                          setAdminActiveSubcategory(null);
                        }}
                        style={{ fontSize: '0.85rem', padding: '6px 16px' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </ScrollableChips>
                ) : (
                  <div className="active-category-container">
                    <button 
                      className="chip chip-active"
                      style={{ fontSize: '0.85rem', padding: '6px 16px', flexShrink: 0 }}
                      onClick={() => {
                        setAdminActiveCategory(null);
                        setAdminActiveSubcategory(null);
                      }}
                    >
                      {adminActiveCategory}
                    </button>
                    
                    {adminAvailableSubcategories.length > 0 && (
                      <>
                        <div className="category-divider" />
                        <ScrollableChips className="subcategory-chips">
                          {adminAvailableSubcategories.map(subcat => {
                            const isActive = subcat === adminActiveSubcategory;
                            return (
                              <button 
                                key={subcat}
                                className={`chip ${isActive ? 'chip-active' : ''}`}
                                style={{ fontSize: '0.80rem', padding: '4px 12px' }}
                                onClick={() => setAdminActiveSubcategory(isActive ? null : subcat)}
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className={`admin-action-btn ${isEditMode ? 'delete' : 'edit'}`} 
                  onClick={() => {
                    if (isEditMode) {
                      setEditedProducts({});
                      setIsEditMode(false);
                    } else {
                      setIsEditMode(true);
                      setIsDeleteMode(false);
                    }
                  }}
                >
                  {isEditMode ? 'Cancel Edit' : 'Edit Products'}
                </button>
                <button 
                  className={`admin-action-btn ${isDeleteMode ? 'edit' : 'delete'}`} 
                  onClick={() => {
                    if (isDeleteMode) {
                      setSelectedForDeletion(new Set());
                      setIsDeleteMode(false);
                    } else {
                      setIsDeleteMode(true);
                      setIsEditMode(false);
                    }
                  }}
                >
                  {isDeleteMode ? 'Cancel Delete' : 'Bulk Delete'}
                </button>
              </div>

              {isEditMode && (
                <button className="add-btn-editorial" style={{ width: 'auto', padding: '8px 16px' }} onClick={async () => {
                  setIsSaving(true);
                  try {
                    for (const prod of Object.values(editedProducts)) {
                      await updateProduct(prod);
                    }
                    setEditedProducts({});
                    setIsEditMode(false);
                  } catch (err: any) { 
                    logger.error('Error saving changes:', err);
                    alert('An error occurred saving changes.'); 
                  }
                  setIsSaving(false);
                }} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              {isDeleteMode && selectedForDeletion.size > 0 && (
                <button className="admin-action-btn delete" onClick={async () => {
                  if (confirm(`Are you sure you want to delete ${selectedForDeletion.size} products?`)) {
                    setIsSaving(true);
                    try {
                      for (const id of Array.from(selectedForDeletion)) {
                        await deleteProduct(id);
                      }
                      setSelectedForDeletion(new Set());
                      setIsDeleteMode(false);
                    } catch (err: any) { 
                      logger.error('Error deleting products:', err);
                      alert('An error occurred deleting products.'); 
                    }
                    setIsSaving(false);
                  }
                }} disabled={isSaving}>
                  {isSaving ? 'Deleting...' : `Delete Selected (${selectedForDeletion.size})`}
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    {isDeleteMode && <th>Select</th>}
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => {
                    if (adminActiveCategory && p.category !== adminActiveCategory) return false;
                    if (adminActiveSubcategory && p.subcategory !== adminActiveSubcategory) return false;
                    if (adminProductSearch) {
                      const t = adminProductSearch.toLowerCase();
                      if (!p.name?.toLowerCase().includes(t) && !p.description?.toLowerCase().includes(t)) return false;
                    }
                    return true;
                  }).map(p => {
                    const editData = editedProducts[p.id!] || p;
                    const isSelected = selectedForDeletion.has(p.id!);
                    const handleFieldChange = (field: keyof Product, val: any) => {
                      setEditedProducts(prev => ({
                        ...prev,
                        [p.id!]: { ...editData, [field]: val }
                      }));
                    };
                    return (
                    <tr key={p.id}>
                      {isDeleteMode && (
                        <td>
                          <input type="checkbox" checked={isSelected} onChange={(e) => {
                            const newSet = new Set(selectedForDeletion);
                            if (e.target.checked) newSet.add(p.id!);
                            else newSet.delete(p.id!);
                            setSelectedForDeletion(newSet);
                          }} style={{ transform: 'scale(1.2)' }} />
                        </td>
                      )}
                      <td>
                        {isEditMode ? (
                          <div className="image-replace-wrapper" style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden' }}>
                            <img src={editData.imageUrl || editData.image} alt={editData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <label className="image-replace-overlay">
                              Replace
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  try {
                                    const base64 = await convertImageToBase64(e.target.files[0]);
                                    handleFieldChange('image', base64);
                                    handleFieldChange('imageUrl', ''); // Clear external url if replacing
                                  } catch (e) { alert('Failed to read image'); }
                                }
                              }} />
                            </label>
                          </div>
                        ) : (
                          <img src={p.imageUrl || p.image} alt={p.name} className="admin-product-img" />
                        )}
                      </td>
                      <td>
                        {isEditMode ? (
                          <input type="text" value={editData.name} onChange={e => handleFieldChange('name', e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                        ) : p.name}
                      </td>
                      <td>
                        {isEditMode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px' }}>
                            <PremiumDropdown 
                              options={allCategoriesCombined}
                              value={editData.category || ''}
                              onChange={val => handleFieldChange('category', val)}
                              placeholder="Select Category"
                            />
                            <PremiumDropdown 
                              options={categoryTreeMapping[editData.category] || []}
                              value={editData.subcategory || ''}
                              onChange={val => handleFieldChange('subcategory', val)}
                              placeholder="No Subcategory"
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            {p.category && (
                              <span style={{ 
                                background: getTagColor('category').bg, 
                                color: getTagColor('category').text, 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.75rem', 
                                fontWeight: 500 
                              }}>
                                {p.category}
                              </span>
                            )}
                            {p.subcategory && (
                              <span style={{ 
                                background: getTagColor('subcategory').bg, 
                                color: getTagColor('subcategory').text, 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.7rem', 
                                fontWeight: 500,
                                opacity: 0.8
                              }}>
                                {p.subcategory}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditMode ? (
                          <input type="number" step="0.01" value={editData.price} onChange={e => handleFieldChange('price', parseFloat(e.target.value))} style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                        ) : `₹${p.price}`}
                      </td>
                      <td>
                        {isEditMode ? (
                          <input type="number" value={editData.stock} onChange={e => handleFieldChange('stock', parseInt(e.target.value))} style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                        ) : p.stock}
                      </td>
                    </tr>
                  )})}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
        )}

        {activeTab === 'products' && (editingProduct || isAddingNew) && (
          <div className="admin-card">
            <form key={editingProduct ? 'edit-'+editingProduct.id : 'add-new'} className="checkout-form" onSubmit={handleSaveProduct} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--primary)' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Product Name</label>
                <input type="text" name="name" placeholder="E.g., Vintage Lamp" defaultValue={editingProduct?.name || ''} required style={{ width: '100%' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Price (₹)</label>
                <input type="number" name="price" placeholder="E.g., 1500" step="0.01" defaultValue={editingProduct?.price || ''} required style={{ width: '100%' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Category</label>
                <Combobox 
                  name="category" 
                  placeholder="E.g., Home Decor" 
                  defaultValue={editingProduct?.category || (adminActiveCategory ? adminActiveCategory : '')} 
                  required={true}
                  options={Array.from(new Set([...(storeSettings.managedCategories || []), ...products.map(p => p.category).filter(Boolean)])) as string[]}
                  onChange={setFormCategory}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Subcategory (Optional)</label>
                <Combobox 
                  name="subcategory" 
                  placeholder="E.g., Mugs, Action Figures" 
                  defaultValue={editingProduct?.subcategory || (adminActiveSubcategory ? adminActiveSubcategory : '')} 
                  options={availableSubcategoriesForForm}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Product Image</label>
                {editingProduct && (editingProduct.imageUrl || editingProduct.image) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <img src={editingProduct.imageUrl || editingProduct.image} alt="Current product" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Current Image</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Leave empty below to keep this image</span>
                    </div>
                  </div>
                )}
                {!editingProduct && newImagePreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <img src={newImagePreview} alt="New product preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Image Preview</span>
                    </div>
                  </div>
                )}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <input type="file" name="imageFile" accept="image/*" required={!editingProduct} id="imageFile" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10, left: 0, top: 0 }} onChange={async (e) => {
                    if (e.target.files && e.target.files[0] && !editingProduct) {
                      try {
                        const base64 = await convertImageToBase64(e.target.files[0]);
                        setNewImagePreview(base64);
                      } catch (err) {
                        logger.error('Failed to process image preview:', err);
                      }
                    } else if (!e.target.files?.[0] && !editingProduct) {
                      setNewImagePreview(null);
                    }
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '2px dashed var(--border)', padding: '16px', borderRadius: '8px', background: 'white', transition: 'border 0.2s ease' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Choose File</div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{editingProduct ? 'Upload new file to replace' : (newImagePreview ? 'File selected (replace?)' : 'No file chosen')}</span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Stock Quantity</label>
                <input type="number" name="stock" placeholder="E.g., 10" defaultValue={editingProduct?.stock || ''} required style={{ width: '100%' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Description</label>
                <textarea name="description" placeholder="Product details..." defaultValue={editingProduct?.description || ''} rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="add-btn-editorial" disabled={isUploading}>
                  {isUploading ? 'Saving...' : 'Save Product'}
                </button>
                <button type="button" className="add-btn-editorial" onClick={cancelEdit} disabled={isUploading} style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'restock' && (
          <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: '1fr' }}>
            <div className="admin-card">
              <h3 style={{ margin: '0 0 15px 0' }}>Out of Stock Products</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.stock <= 0).map(p => (
                      <tr key={p.id}>
                        <td><img src={p.imageUrl || p.image} alt={p.name} className="admin-product-img" /></td>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td style={{ color: 'var(--error)', fontWeight: 'bold' }}>{p.stock}</td>
                        <td>
                          <button onClick={() => { setActiveTab('products'); setIsEditMode(true); setAdminProductSearch(p.name); }} className="admin-action-btn edit">Update Stock</button>
                        </td>
                      </tr>
                    ))}
                    {products.filter(p => p.stock <= 0).length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No out of stock products.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card">
              <h3 style={{ margin: '0 0 15px 0' }}>Product Requests</h3>
              {isLoadingRequests ? (
                <p>Loading requests...</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Total Quantity Requested</th>
                        <th>Unique Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(
                        productRequests.reduce((acc, req) => {
                          if (!acc[req.productId]) {
                            acc[req.productId] = { name: req.productName, totalQty: 0, users: new Set() };
                          }
                          acc[req.productId].totalQty += req.quantity;
                          acc[req.productId].users.add(req.userId || req.email || 'guest');
                          return acc;
                        }, {} as Record<string, { name: string, totalQty: number, users: Set<string> }>)
                      ).map((agg, idx) => (
                        <tr key={idx}>
                          <td>{agg.name}</td>
                          <td style={{ fontWeight: 'bold' }}>{agg.totalQty}</td>
                          <td>{agg.users.size} user{agg.users.size !== 1 ? 's' : ''}</td>
                        </tr>
                      ))}
                      {productRequests.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>No product requests yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {activeMoveSubcat && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setActiveMoveSubcat(null)}>
          <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '350px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 15px 0' }}>Move "{activeMoveSubcat.name}"</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>Select a new category for this subcategory:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeMoveSubcat.currentCategory !== 'UNLINKED' && (
                <button 
                  className="add-btn-editorial"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  onClick={() => {
                    moveSubcategory(activeMoveSubcat.name, activeMoveSubcat.currentCategory, 'UNLINKED');
                    setActiveMoveSubcat(null);
                  }}
                >
                  Unlink
                </button>
              )}
              
              {allCategoriesCombined.map(cat => (
                cat !== activeMoveSubcat.currentCategory && (
                  <button 
                    key={cat}
                    className="add-btn-editorial"
                    onClick={() => {
                      moveSubcategory(activeMoveSubcat.name, activeMoveSubcat.currentCategory, cat);
                      setActiveMoveSubcat(null);
                    }}
                  >
                    Move to {cat}
                  </button>
                )
              ))}
            </div>
            
            <button 
              style={{ marginTop: '15px', width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
              onClick={() => setActiveMoveSubcat(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
