import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'seller';
  read: boolean;
  time: string;
}

interface AppContextType {
  cart: CartItem[];
  wishlist: Product[];
  notifications: AppNotification[];
  theme: 'light' | 'dark';
  language: 'EN' | 'HI';
  setLanguage: (lang: 'EN' | 'HI') => void;
  couponCode: string;
  couponDiscount: number; // percentage, e.g. 10 for 10%
  applyCoupon: (code: string) => boolean;
  addToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markNotificationsAsRead: () => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('shoptantra_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('shoptantra_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('shoptantra_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n-1',
      title: 'Welcome to SHOPTANTRA!',
      message: 'Explore millions of products directly from Indian manufacturers.',
      type: 'system',
      read: false,
      time: 'Just now'
    },
    {
      id: 'n-2',
      title: 'Mega Flash Sale Live',
      message: 'Get up to 50% off on premium local brands. Use coupon WELCOME.',
      type: 'promo',
      read: false,
      time: '2 hours ago'
    }
  ]);

  useEffect(() => {
    localStorage.setItem('shoptantra_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('shoptantra_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('shoptantra_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const addToCart = (product: Product, quantity: number, color?: string, size?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );

      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx].quantity += quantity;
        return nextCart;
      }

      return [...prev, { product, quantity, selectedColor: color, selectedSize: size }];
    });

    addNotification(
      'Item Added to Cart',
      `${product.title} has been added to your shopping cart.`,
      'system'
    );
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === color &&
            item.selectedSize === size
          )
      )
    );
  };

  const updateCartQuantity = (productId: string, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        item.selectedColor === color &&
        item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      if (idx > -1) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        addNotification(
          'Added to Wishlist',
          `${product.title} added to your wishlist.`,
          'system'
        );
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const applyCoupon = (code: string) => {
    const upperCode = code.toUpperCase();
    if (upperCode === 'SHOPTANTRA10') {
      setCouponCode('SHOPTANTRA10');
      setCouponDiscount(10);
      addNotification('Coupon Applied', 'SHOPTANTRA10 gives you 10% off your entire order!', 'promo');
      return true;
    }
    if (upperCode === 'WELCOME') {
      setCouponCode('WELCOME');
      setCouponDiscount(20);
      addNotification('Coupon Applied', 'WELCOME discount applied successfully! 20% off.', 'promo');
      return true;
    }
    if (upperCode === 'FESTIVE50') {
      setCouponCode('FESTIVE50');
      setCouponDiscount(50);
      addNotification('Coupon Applied', 'FESTIVE50 flat 50% discount applied!', 'promo');
      return true;
    }
    return false;
  };

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'system') => {
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}`,
        title,
        message,
        type,
        read: false,
        time: 'Just now'
      },
      ...prev
    ]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        notifications,
        theme,
        language,
        setLanguage,
        couponCode,
        couponDiscount,
        applyCoupon,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        addNotification,
        markNotificationsAsRead,
        toggleTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
