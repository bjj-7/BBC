'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../src/store/useCartStore';
import { useAppStore, type Order } from '../../src/store/useAppStore';
import InvoiceModal from '../../src/components/InvoiceModal';
import { Trash2, Plus, Minus, Edit2, Check } from 'lucide-react';
import { logger } from '../../src/utils/logger';

const Checkout = () => {
  const navigate = useRouter();
  const { items, getTotal, clearCart, updateQuantity, removeItem } = useCartStore();
  const { user, loginWithGoogle, createOrder } = useAppStore();
  

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressStreet: '',
    addressApt: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingCart, setIsEditingCart] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const cartTotal = getTotal();

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name ? prev.name : (user.user_metadata?.full_name || ''),
        email: prev.email ? prev.email : (user.email || ''),
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.addressStreet || !formData.addressCity || !formData.addressState || !formData.addressZip) {
      setError('Please fill in name, email, phone, and all required address fields.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setError('Please enter a valid Indian phone number.');
      return;
    }

    const zipRegex = /^\d{6}$/;
    if (!zipRegex.test(formData.addressZip.trim())) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const invoiceNumber = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const fullAddress = `${formData.addressStreet}${formData.addressApt ? `, ${formData.addressApt}` : ''}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}, India`;

      const order: Omit<Order, 'id'> = {
        invoiceNumber,
        userId: user?.id || '',
        // For authenticated users, always use the JWT-verified email from Firebase Auth
        // to prevent spoofing another user's email via the form field.
        // Guest users fall back to the form email since there is no verified identity.
        email: user?.email || formData.email,
        name: formData.name,
        phone: formData.phone,
        address: fullAddress,
        notes: formData.notes,
        items,
        total: cartTotal,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };

      const orderId = await createOrder(order);
      setCompletedOrder({ id: orderId, ...order });
      setOrderSuccessMsg(`Order confirmed! We will contact you to arrange payment and delivery.`);
      clearCart();
    } catch (err: any) {
      logger.error('Error placing order:', err);
      setError('An error occurred while placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSuccess = () => {
    setOrderSuccessMsg('');
    setCompletedOrder(null);
    navigate.push(user ? '/account' : '/');
  };

  if (items.length === 0 && !orderSuccessMsg) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto', minHeight: '60vh' }}>
        <h2>Your cart is empty</h2>
        <button className="primary-btn" onClick={() => navigate.push('/')} style={{ marginTop: '20px' }}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
      <h2 style={{ marginBottom: '20px' }}>Checkout</h2>
      
      {!user && (
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0' }}>Have an account?</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Log in to quickly track your orders.</p>
          </div>
          <button className="primary-btn" onClick={loginWithGoogle}>Login with Google</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: '40px', gridTemplateColumns: '1fr 1fr' }} className="checkout-grid">
        <div>
          <form className="checkout-form" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 -4px 0' }}>Delivery details</h3>
            <input type="text" id="name" placeholder="Full name" required value={formData.name} onChange={handleInputChange} style={{ width: '100%' }} />
            <input type="email" id="email" placeholder="Email" required value={formData.email} onChange={handleInputChange} style={{ width: '100%' }} />
            <input type="tel" id="phone" placeholder="Phone number" required value={formData.phone} onChange={handleInputChange} style={{ width: '100%' }} />
            
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: '0 0 -4px 0', fontSize: '0.95rem' }}>Shipping Address (India only)</h4>
              <input type="text" id="addressStreet" placeholder="Street address" required value={formData.addressStreet} onChange={handleInputChange} style={{ width: '100%' }} />
              <input type="text" id="addressApt" placeholder="Apartment, suite, etc. (optional)" value={formData.addressApt} onChange={handleInputChange} style={{ width: '100%' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <input type="text" id="addressCity" placeholder="City" required value={formData.addressCity} onChange={handleInputChange} style={{ width: '100%' }} />
                <input type="text" id="addressState" placeholder="State / Province" required value={formData.addressState} onChange={handleInputChange} style={{ width: '100%' }} />
              </div>
              
              <input type="text" id="addressZip" placeholder="PIN code (6 digits)" required value={formData.addressZip} onChange={handleInputChange} style={{ width: '100%' }} />
            </div>

            <textarea id="notes" placeholder="Order notes (optional)" value={formData.notes} onChange={handleInputChange} rows={2} style={{ marginTop: '8px', width: '100%' }}></textarea>
            
            {error && <p className="error-text">{error}</p>}
            
            <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ marginTop: '20px', width: '100%', fontSize: '1.1rem', padding: '12px' }}>
              {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
          </form>
        </div>

        <div>
          <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Order Summary</h3>
              <button 
                type="button" 
                onClick={() => setIsEditingCart(!isEditingCart)}
                style={{ 
                  background: isEditingCart ? 'var(--primary)' : 'white', 
                  border: '1.5px solid var(--primary)', 
                  color: isEditingCart ? 'white' : 'var(--primary)', 
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  fontSize: '0.85rem',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {isEditingCart ? (
                  <>
                    <Check size={14} />
                    Done
                  </>
                ) : (
                  <>
                    <Edit2 size={14} />
                    Edit Order
                  </>
                )}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1.05rem', paddingRight: '12px', lineHeight: 1.3 }}>{item.name}</div>
                      {!isEditingCart && <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>Qty: {item.quantity}</div>}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                  
                  {isEditingCart && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-color)' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: '600', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-color)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '500' }}>
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <div className={`modal ${orderSuccessMsg && !showInvoice ? '' : 'hidden'}`}>
        <div className="modal-box" style={{ textAlign: 'center' }}>
          <h2>Thanks for your order!</h2>
          <p>{orderSuccessMsg}</p>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>Invoice Number</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-2)' }}>{completedOrder?.invoiceNumber}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="primary-btn" onClick={() => setShowInvoice(true)}>View Invoice</button>
            <button className="secondary-btn" onClick={resetSuccess}>Continue Shopping</button>
          </div>
        </div>
      </div>

      {showInvoice && completedOrder && (
        <InvoiceModal order={completedOrder} onClose={() => { setShowInvoice(false); resetSuccess(); }} />
      )}
    </div>
  );
};

export default Checkout;
