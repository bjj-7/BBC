'use client';
import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import type { Product } from '../store/useCartStore';
import ProductRequestModal from './ProductRequestModal';

import { useRouter } from 'next/navigation';

const CATEGORY_COLORS = ['#FF6B6B','#4ECDC4','#FFD93D','#6C5CE7','#1DD1A1','#FF9F43','#54A0FF','#EE5A6F','#A29BFE','#00B894'];

export const colorForCategory = (cat: string) => {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const navigate = useRouter();

  const cartItem = items.find(item => item.id === product.id);

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleImageClick = () => {
    if (product.stock <= 0) {
      setShowRequestModal(true);
      return;
    }

    navigate.push(`/shop?category=${encodeURIComponent(product.category)}`);
  };

  const getStockBadge = () => {
    if (product.stock <= 0) return <span className="stock-badge stock-out">Out of stock</span>;
    if (product.stock <= 10) return <span className="stock-badge stock-low">Only {product.stock} left</span>;
    return null;
  };

  return (
    <div className="product-card">
      <div 
        className="product-card-image-wrap" 
        onClick={handleImageClick}
        style={{ cursor: 'pointer' }}
      >
        {product.imageUrl || product.image ? (
          <img src={product.imageUrl || product.image} alt={product.name} className="product-img" />
        ) : (
          <div className="product-img placeholder"></div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description || ''}</p>
        
        <div style={{ marginTop: 'auto' }}>
          {getStockBadge() && (
            <div style={{ marginBottom: '8px' }}>
              {getStockBadge()}
            </div>
          )}
          
          <div className="product-footer" style={{ marginTop: 0, paddingTop: '8px' }}>
            <span className="price">₹{Number(product.price).toFixed(2)}</span>
            {cartItem ? (
              <div className="qty-controls">
                <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}>-</button>
                <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center', fontWeight: '500' }}>{cartItem.quantity}</span>
                <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} disabled={cartItem.quantity >= product.stock}>+</button>
              </div>
            ) : (
              <button 
                className="add-btn-editorial" 
                onClick={product.stock <= 0 ? () => setShowRequestModal(true) : handleAddToCart}
                style={{ background: product.stock <= 0 ? '#6c757d' : '' }}
              >
                {product.stock <= 0 ? 'Request' : '+ Cart'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showRequestModal && (
        <ProductRequestModal product={product} onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
};

export default ProductCard;
