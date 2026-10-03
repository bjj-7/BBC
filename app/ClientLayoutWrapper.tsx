'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from '../src/components/Navbar';
import CartPanel from '../src/components/CartPanel';
import FirstItemAnimation from '../src/components/FirstItemAnimation';
import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../src/store/useAppStore';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Note: initializeFirebaseListeners will need to be refactored for SSR/HttpOnly cookies
  const initializeFirebaseListeners = useAppStore(state => state.initializeFirebaseListeners);
  const isInitializing = useAppStore(state => state.isInitializing);

  const exitToastRef = useRef<HTMLDivElement | null>(null);
  const backPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [backPressCount, setBackPressCount] = useState(0);

  // Hardware Back Button Handler
  useEffect(() => {
    // Inject a trap state on the Home page to catch the back button before exiting
    if (pathname === '/') {
      if (!window.history.state || !window.history.state.exitTrap) {
        window.history.pushState({ ...window.history.state, exitTrap: true }, '', '/');
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (pathname !== '/') {
        // We are on a non-home page. Force navigation back to Home.
        // We use setTimeout to ensure Next.js router state is updated correctly after the pop.
        setTimeout(() => {
          router.replace('/');
        }, 0);
      } else {
        // We are on the Home page.
        if (backPressCount === 0) {
          // First back press
          setBackPressCount(1);
          
          // Re-insert the trap state so we don't actually exit
          window.history.pushState({ ...window.history.state, exitTrap: true }, '', '/');

          // Show Toast
          if (!exitToastRef.current) {
            const toast = document.createElement('div');
            toast.innerText = 'Press back again to exit';
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:24px;z-index:9999;font-size:14px;pointer-events:none;transition:opacity 0.3s;';
            document.body.appendChild(toast);
            exitToastRef.current = toast;
          }

          if (backPressTimer.current) clearTimeout(backPressTimer.current);
          backPressTimer.current = setTimeout(() => {
            setBackPressCount(0);
            if (exitToastRef.current) {
              exitToastRef.current.remove();
              exitToastRef.current = null;
            }
          }, 2000);
        } else {
          // Second back press within 2 seconds
          if (exitToastRef.current) {
            exitToastRef.current.remove();
            exitToastRef.current = null;
          }
          if (backPressTimer.current) clearTimeout(backPressTimer.current);
          
          // Call history.back() to actually pop the original state and exit the app
          window.history.back();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pathname, router, backPressCount]);

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
