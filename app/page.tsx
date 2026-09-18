'use client';
import React from 'react';
import Link from 'next/link';
import ProductCard from '../src/components/ProductCard';
import { useAppStore } from '../src/store/useAppStore';

const Home = () => {
  const { products, storeSettings } = useAppStore();
  
  // Find products that match the selected IDs for bestsellers and featured
  // Or fallback to slice if nothing is selected (or we can just render whatever is returned)
  const bestsellerProducts = storeSettings.bestsellerIds.length > 0 
    ? storeSettings.bestsellerIds.map(id => products.find(p => p.id === id)).filter(Boolean)
    : products.slice(8, 16); // fallback to something if not set
    
  const featuredProducts = storeSettings.featuredIds.length > 0
    ? storeSettings.featuredIds.map(id => products.find(p => p.id === id)).filter(Boolean)
    : products.slice(0, 8); // fallback

  const defaultLayout = [
    { id: 'bestsellers', label: 'Bestselling Products', visible: true },
    { id: 'explore', label: 'Explore Categories', visible: true },
    { id: 'featured', label: 'Featured Products', visible: true },
    { id: 'offers', label: 'Offers Section', visible: true }
  ];

  const layout = storeSettings.sectionLayout || defaultLayout;

  const renderSection = (id: string) => {
    switch(id) {
      case 'bestsellers':
        return (
          <React.Fragment key="bestsellers">
            <div className="section-header-container" id="productGrid">
              <div>
                <h2 className="section-title">{storeSettings.bestsellersSubtitle}</h2>
                <h3 className="section-subtitle serif">{storeSettings.bestsellersTitle}</h3>
              </div>
            </div>
            <main className="product-grid">
              {bestsellerProducts.map((product: any) => (
                <ProductCard key={`bestseller-${product.id}`} product={product} />
              ))}
            </main>
          </React.Fragment>
        );
      case 'explore': {
        const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
        const validCategories = storeSettings.exploreCategories?.filter(c => c.name && c.name.trim() !== '' && uniqueCategories.includes(c.name)) || [];
        if (validCategories.length === 0) return null;

        return (
          <section key="explore" className="explore-section" id="explore">
            <h2 className="section-title" style={{ paddingBottom: '4px' }}>{storeSettings.exploreSubtitle}</h2>
            <h3 className="section-subtitle serif" style={{ marginBottom: '20px' }}>{storeSettings.exploreTitle}</h3>
            <div className="explore-grid">
              {validCategories.map((category, idx) => (
                <Link key={idx} href={`/shop?category=${encodeURIComponent(category.name)}`} className="explore-card" style={{ 
                  backgroundImage: category.imageUrl ? `url(${category.imageUrl})` : 'none',
                  backgroundColor: category.imageUrl ? '#000' : 'var(--primary)',
                  backgroundBlendMode: 'normal',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  textDecoration: 'none'
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)', zIndex: 1 }}></div>
                  <div className="explore-text" style={{ position: 'relative', zIndex: 2, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Explore<br/>{category.name}
                  </div>
                  <div className="explore-btn" style={{ position: 'relative', zIndex: 2, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'inline-block' }}>Shop &rarr;</div>
                </Link>
              ))}
            </div>
          </section>
        );
      }
      case 'featured':
        return (
          <React.Fragment key="featured">
            <div className="section-header-container">
              <div>
                <h2 className="section-title">{storeSettings.featuredSubtitle}</h2>
                <h3 className="section-subtitle serif">{storeSettings.featuredTitle}</h3>
              </div>
            </div>
            <main className="product-grid">
              {featuredProducts.map((product: any) => (
                <ProductCard key={`featured-${product.id}`} product={product} />
              ))}
            </main>
          </React.Fragment>
        );
      case 'offers':
        return (
          <section key="offers" className="offers-section">
            <div className="offers-content">
              <h2 className="offers-title serif">{storeSettings.offersTitle}</h2>
              <h1 className="offers-discount serif">{storeSettings.offersDiscount}</h1>
              <p className="offers-desc">{storeSettings.offersDesc}</p>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title serif">Welcome to<br/>our store!</h1>
          <p className="hero-subtitle">{storeSettings.heroSubtitle}</p>
          <Link href="/shop" className="hero-shop-btn">Shop now &rarr;</Link>
        </div>
      </section>

      {/* Dynamic Sections */}
      {layout.filter(s => s.visible).map(s => renderSection(s.id))}
    </>
  );
};

export default Home;
