'use client';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../store/useCartStore';

const CartPanel = () => {
  const { items, isCartOpen, closeCart, updateQuantity, getTotal, clearCart } = useCartStore();
  const navigate = useRouter();
  
  const cartTotal = getTotal();

  const handleCheckout = () => {
    closeCart();
    navigate.push('/checkout');
  };

  return (
    <>
      <aside className={`cart-panel ${isCartOpen ? '' : 'hidden'}`}>
        <div className="cart-panel-header">
          <h2>Items in Your Cart</h2>
          <button className="icon-btn" onClick={closeCart}>&times;</button>
        </div>
        
        <div className="cart-items">
          {items.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item">
                <span className="cart-item-name">{item.name}</span>
                <div className="qty-controls">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <span className="cart-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {items.length > 0 ? (
            <button 
              onClick={clearCart} 
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem', padding: 0 }}
            >
              Clear Cart
            </button>
          ) : <span></span>}
          <span>Total ₹: <span>{cartTotal.toFixed(2)}</span></span>
        </div>

        <div style={{ padding: '20px' }}>
          <button 
            className="primary-btn" 
            onClick={handleCheckout} 
            disabled={items.length === 0}
            style={{ width: '100%' }}
          >
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </>
  );
};

export default CartPanel;
