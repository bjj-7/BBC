import React, { useEffect, useState } from 'react';
import { useCartStore } from '../store/useCartStore';

const FirstItemAnimation: React.FC = () => {
  const { firstItemAnimationProduct, clearFirstItemAnimation, openCart } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (firstItemAnimationProduct) {
      setIsVisible(true);
      
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for slide-out animation to finish before clearing state
        setTimeout(() => {
          clearFirstItemAnimation();
        }, 300); // 300ms matches the CSS transition
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [firstItemAnimationProduct, clearFirstItemAnimation]);

  if (!firstItemAnimationProduct && !isVisible) return null;

  return (
    <div 
      className={`toast-notification ${isVisible ? 'toast-visible' : 'toast-hidden'}`}
      onClick={() => openCart()}
      style={{ cursor: 'pointer' }}
    >
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div className="toast-text-content">
          <h4 className="toast-title">Added to Cart!</h4>
          <p className="toast-subtitle"><strong>{firstItemAnimationProduct?.name}</strong> is in your bag.</p>
        </div>
        {(firstItemAnimationProduct?.imageUrl || firstItemAnimationProduct?.image) && (
          <img src={firstItemAnimationProduct.imageUrl || firstItemAnimationProduct.image} alt={firstItemAnimationProduct.name} className="toast-image" />
        )}
      </div>
    </div>
  );
};

export default FirstItemAnimation;
