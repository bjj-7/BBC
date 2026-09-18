import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Product } from '../store/useCartStore';
import { logger } from '../utils/logger';

interface ProductRequestModalProps {
  product: Product;
  onClose: () => void;
}

const ProductRequestModal: React.FC<ProductRequestModalProps> = ({ product, onClose }) => {
  const { user, loginWithGoogle, createProductRequest } = useAppStore();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Authentication is required — the Firestore rate-limiting rule enforces a
  // deterministic document ID of {uid}_{productId}, so a UID is mandatory.
  if (!user) {
    return (
      <div className="modal">
        <div className="modal-box" style={{ maxWidth: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Request Product</h3>
            <button className="icon-btn" onClick={onClose}>&times;</button>
          </div>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            <strong>{product.name}</strong> is currently out of stock. Log in to request a restock notification.
          </p>
          <button className="primary-btn" style={{ width: '100%' }} onClick={loginWithGoogle}>
            Login with Google to Request
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) return;

    setIsSubmitting(true);
    try {
      await createProductRequest({
        productId: product.id,
        productName: product.name,
        quantity,
        userId: user?.id,
        email: user.email ?? '',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
    } catch (err) {
      logger.error('Failed to submit request', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-box" style={{ maxWidth: '500px' }}>
        {!success ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Request Product</h3>
              <button className="icon-btn" onClick={onClose}>&times;</button>
            </div>
            
            <p style={{ color: '#666', marginBottom: '20px' }}>
              <strong>{product.name}</strong> is currently out of stock. Let us know how many you need, and we'll notify you when it's back!
            </p>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Quantity Needed</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                  required 
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '10px' }} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h2 style={{ color: 'var(--accent-2)', marginBottom: '15px' }}>Request Received!</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              We've logged your request for {quantity} x {product.name}. We will stock up soon and notify you!
            </p>
            <button className="primary-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductRequestModal;
