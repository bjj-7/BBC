import { create } from 'zustand';
import { supabase } from '../supabase/config';
import {
  addProductAction,
  updateProductAction,
  deleteProductAction,
  updateStoreSettingsAction,
  getAllOrdersAction,
  getUserOrdersAction,
  updateOrderStatusAction,
  cancelOrderAction,
  getAllProductRequestsAction,
  createProductRequestAction,
  createOrderAction
} from '../../app/actions';

import type { User } from '@supabase/supabase-js';
import type { Product, CartItem } from './useCartStore';
import { logger } from '../utils/logger';

// Admin authorization is now enforced on the server-side via Supabase RLS and the is_admin() function.
// The email list below is used client-side purely for UI purposes.
const ADMIN_EMAILS = [
  'bbc.savoye@gmail.com',
  'v.jonathanwilliamusa@gmail.com',
  'w.vivekan@gmail.com'
];

export interface Order {
  id?: string;
  invoiceNumber: string;
  userId?: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'processed' | 'shipped' | 'complete' | 'cancelled';
  createdAt: string;
}

export interface ProductRequest {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  userId?: string;
  email?: string;
  createdAt: string;
}

export interface ExploreCategory {
  name: string;
  imageUrl?: string;
}

export interface SectionVisibility {
  id: string; // 'bestsellers' | 'explore' | 'featured' | 'offers'
  label: string;
  visible: boolean;
}

export interface StoreSettings {
  heroSubtitle: string;
  offersTitle: string;
  offersDiscount: string;
  offersDesc: string;
  bestsellerIds: string[];
  bestsellersTitle?: string;
  bestsellersSubtitle?: string;
  featuredIds: string[];
  featuredTitle?: string;
  featuredSubtitle?: string;
  exploreCategories: ExploreCategory[];
  exploreTitle?: string;
  exploreSubtitle?: string;
  sectionLayout?: SectionVisibility[];
  managedCategories?: string[];
  managedSubcategories?: string[];
  categoryMapping?: Record<string, string[]>;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  heroSubtitle: 'Free delivery on orders over Rs.999 • New arrivals added every week',
  offersTitle: 'End of Season Sale',
  offersDiscount: 'UP TO 50% OFF',
  offersDesc: 'Shop our biggest sale of the year. Limited time only.',
  bestsellerIds: [],
  bestsellersTitle: 'Bestsellers',
  bestsellersSubtitle: 'Our most loved pieces',
  featuredIds: [],
  featuredTitle: 'Featured Products',
  featuredSubtitle: 'Handpicked for you',
  exploreCategories: [
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" }
  ],
  exploreTitle: 'Explore',
  exploreSubtitle: 'Discover your style',
  sectionLayout: [
    { id: 'bestsellers', label: 'Bestselling Products', visible: true },
    { id: 'explore', label: 'Explore Categories', visible: true },
    { id: 'featured', label: 'Featured Products', visible: true },
    { id: 'offers', label: 'Offers Section', visible: true }
  ],
  managedCategories: [],
  managedSubcategories: [],
  categoryMapping: {}
};

interface AppStore {
  products: Product[];
  storeSettings: StoreSettings;
  user: User | null;
  /** True when the signed-in user is an admin */
  isAdmin: boolean;
  isInitializing: boolean;
  searchQuery: string;
  
  setSearchQuery: (query: string) => void;
  initializeFirebaseListeners: () => () => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;
  createOrder: (order: Omit<Order, 'id'>) => Promise<string>;
  getUserOrders: (userIdOrEmail: string) => Promise<Order[]>;
  getAllOrders: () => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  cancelOrder: (order: Order) => Promise<void>;
  
  createProductRequest: (request: Omit<ProductRequest, 'id'>) => Promise<void>;
  getAllProductRequests: () => Promise<ProductRequest[]>;
  
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  products: [],
  storeSettings: DEFAULT_STORE_SETTINGS,
  user: null,
  isAdmin: false,
  isInitializing: true,
  searchQuery: '',

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  initializeFirebaseListeners: () => {
    // We kept the method name 'initializeFirebaseListeners' so we don't have to rewrite 
    // all components importing it, but it now uses Supabase.

    // 1. Fetch initial products
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      if (data) set({ products: data as Product[] });
    };

    // 2. Fetch initial settings
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'general').single();
      if (data) {
        set({ 
          storeSettings: {
            ...DEFAULT_STORE_SETTINGS,
            ...data
          }
        });
      } else {
        // Create default if not exists
        await supabase.from('settings').insert({ id: 'general', ...DEFAULT_STORE_SETTINGS });
        set({ storeSettings: DEFAULT_STORE_SETTINGS });
      }
      set({ isInitializing: false });
    };

    fetchProducts();
    fetchSettings();

    // 3. Realtime subscriptions
    const productsChannel = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    const settingsChannel = supabase.channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe();

    // 4. Listen to Auth State
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));
      set({ user, isAdmin });
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));
      set({ user, isAdmin });
    });

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(settingsChannel);
      authSub.unsubscribe();
    };
  },

  addProduct: async (product) => {
    await addProductAction(product);
    // Refresh products
    const { data } = await supabase.from('products').select('*');
    if (data) set({ products: data as Product[] });
  },

  updateProduct: async (product) => {
    await updateProductAction(product);
    // Refresh products
    const { data } = await supabase.from('products').select('*');
    if (data) set({ products: data as Product[] });
  },

  deleteProduct: async (id) => {
    await deleteProductAction(id);
    // Refresh products
    const { data } = await supabase.from('products').select('*');
    if (data) set({ products: data as Product[] });
  },

  updateStoreSettings: async (settings) => {
    await updateStoreSettingsAction(settings);
  },

  createOrder: async (order) => {
    return await createOrderAction(order);
  },

  getUserOrders: async (userIdOrEmail) => {
    return await getUserOrdersAction();
  },

  getAllOrders: async () => {
    return await getAllOrdersAction();
  },

  updateOrderStatus: async (orderId, status) => {
    await updateOrderStatusAction(orderId, status);
  },

  cancelOrder: async (order) => {
    await cancelOrderAction(order.id!);
  },

  createProductRequest: async (request) => {
    await createProductRequestAction(request);
  },

  getAllProductRequests: async () => {
    return await getAllProductRequestsAction();
  },

  loginWithGoogle: async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
    } catch (error) {
      logger.error('Error logging in with Google:', error);
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Error logging out:', error);
    }
  },
}));
