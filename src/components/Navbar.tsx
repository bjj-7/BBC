'use client';
import { useCartStore } from '../store/useCartStore';
import { useAppStore } from '../store/useAppStore';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
const Navbar = () => {
  const { items, toggleCart } = useCartStore();
  const { user, isAdmin, searchQuery, setSearchQuery } = useAppStore();
  const navigate = useRouter();
  const location = usePathname();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="header-top">
          {/* Mobile Menu Button */}
          {location !== '/account' && (
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}

          {/* Search Bar (Left side on desktop) */}
          {location !== '/account' && (
            <div className="header-search-container">
              <span className="search-icon" style={{ display: 'flex', color: 'var(--primary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input 
                type="text" 
                className="header-search-input" 
                placeholder="Search Product..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() !== '' && location !== '/shop') {
                    navigate.push('/shop');
                  }
                }}
              />
            </div>
          )}

          {/* Center Text Logo (Takes place of left links if needed, but flex will naturally push it) */}
          <Link href="/" className="site-logo-text serif">
            Basement Buzz Corner
          </Link>
          
          {/* Right Actions */}
          <div className="nav-buttons-container">
            {location === '/account' ? (
              <Link href="/shop" className="frosted-btn back-to-shop-btn" style={{ padding: '0 16px', fontSize: '0.9rem', fontWeight: 600 }}>
                &larr; Back to Shop
              </Link>
            ) : (
              <div className="desktop-actions" style={{ display: 'flex', gap: '12px' }}>
                {isAdmin && (
                  <Link href="/admin" className="frosted-btn" title="Admin Dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </Link>
                )}
                
                <Link href="/account" className="frosted-btn" title="My Account">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </Link>
                
                <button className="frosted-btn" onClick={toggleCart} title="Cart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu-panel ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h2 className="serif">Menu</h2>
          <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="mobile-menu-links">
          <Link href="/account" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            {user ? "My Account" : "Login"}
          </Link>
          <button className="mobile-nav-link" onClick={() => { setIsMobileMenuOpen(false); toggleCart(); }} style={{ textAlign: 'left', border: 'none', background: 'transparent', width: '100%' }}>
            Cart ({cartCount})
          </button>
          {isAdmin && (
            <Link href="/admin" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>
          )}
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </>
  );
};

export default Navbar;
