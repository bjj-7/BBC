'use client';

import { usePathname } from 'next/navigation';
import Navbar from '../src/components/Navbar';
import CartPanel from '../src/components/CartPanel';
import FirstItemAnimation from '../src/components/FirstItemAnimation';
import { useEffect } from 'react';
import { useAppStore } from '../src/store/useAppStore';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Note: initializeFirebaseListeners will need to be refactored for SSR/HttpOnly cookies
  const initializeFirebaseListeners = useAppStore(state => state.initializeFirebaseListeners);
  const isInitializing = useAppStore(state => state.isInitializing);

  useEffect(() => {
    const unsubscribe = initializeFirebaseListeners();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeFirebaseListeners]);

  if (isInitializing) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <>
      <CartPanel />
      <FirstItemAnimation />
      {!isAdminPage && <Navbar />}
      {children}
    </>
  );
}
