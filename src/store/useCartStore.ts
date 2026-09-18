import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  image?: string;
  category: string;
  subcategory?: string;
  description: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  firstItemAnimationProduct: Product | null;
  hasSeenFirstItemAnimation: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearFirstItemAnimation: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  isCartOpen: false,
  firstItemAnimationProduct: null,
  hasSeenFirstItemAnimation: false,
  clearFirstItemAnimation: () => set({ firstItemAnimationProduct: null }),
  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find(item => item.id === product.id);
    
    if (items.length === 0 && !get().hasSeenFirstItemAnimation) {
      set({ firstItemAnimationProduct: product, hasSeenFirstItemAnimation: true });
    }
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        set({
          items: items.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        });
      }
    } else {
      if (product.stock > 0) {
        set({ items: [...items, { ...product, quantity: 1 }] });
      }
    }
  },
  removeItem: (productId) => {
    const newItems = get().items.filter(item => item.id !== productId);
    set({ 
      items: newItems,
      ...(newItems.length === 0 ? { hasSeenFirstItemAnimation: false } : {})
    });
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const items = get().items;
    const existingItem = items.find(item => item.id === productId);
    if (existingItem && quantity <= existingItem.stock) {
      set({
        items: get().items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      });
    }
  },
  clearCart: () => set({ items: [], hasSeenFirstItemAnimation: false }),
  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set({ isCartOpen: !get().isCartOpen })
    }),
    {
      name: 'bbc-cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist cart items, not UI state like modal open/close
    }
  )
);
