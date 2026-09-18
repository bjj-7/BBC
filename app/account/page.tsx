'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, type Order } from '../../src/store/useAppStore';
import InvoiceModal from '../../src/components/InvoiceModal';
import { logger } from '../../src/utils/logger';

const Account = () => {
  const { user, loginWithGoogle, logout, getUserOrders, updateOrderStatus } = useAppStore();
  const navigate = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getUserOrders(user.id)
        .then(fetchedOrders => {
          setOrders(fetchedOrders);
        })
        .catch(err => {
          logger.error('Failed to fetch orders:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, getUserOrders]);

  if (!user) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', minHeight: '60vh' }}>
        <h2 style={{ marginBottom: '20px' }}>My Account</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>Please log in to view your account details and order history.</p>
        <button className="primary-btn" onClick={loginWithGoogle}>Login with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>My Account</h2>
        <button className="secondary-btn" onClick={() => { logout(); navigate.push('/'); }}>Logout</button>
      </div>

      <div style={{ display: 'grid', gap: '40px', gridTemplateColumns: '1fr 2fr' }} className="account-grid">
        {/* Profile Section */}
        <div>
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ccc' }}></div>
              )}
              <div>
                <h3 style={{ margin: 0 }}>{user?.user_metadata?.full_name || 'Customer'}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order History Section */}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Order History</h3>
          
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 15px 0', color: '#666' }}>You haven't placed any orders yet.</p>
              <button className="primary-btn" onClick={() => navigate.push('/')}>Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(order => (
                <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f5f5f5', padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Order Placed</span>
                      <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Total</span>
                      <strong>₹{order.total.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Invoice No.</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{order.invoiceNumber}</span>
                    </div>
                    <div>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.85rem', 
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: order.status === 'complete' ? '#d4edda' : '#fff3cd',
                        color: order.status === 'complete' ? '#155724' : '#856404'
                      }}>
                        {order.status}
                      </span>
                      <button 
                        className="secondary-btn" 
                        style={{ padding: '4px 10px', fontSize: '0.8rem', marginLeft: '10px' }}
                        onClick={() => setSelectedOrderForInvoice(order)}
                      >
                        View Invoice
                      </button>
                    </div>
                  </div>
                  
                  {order.status === 'shipped' && (
                    <div style={{ background: '#e8f4fd', padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ color: '#0056b3', fontSize: '0.9rem', flex: 1 }}>
                        <strong>Your order is on the way!</strong> Please mark this order as complete once you have received it in your hands.
                      </div>
                      <button 
                        className="primary-btn" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={async () => {
                          try {
                            await updateOrderStatus(order.id as string, 'complete');
                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'complete' } : o));
                          } catch (err) {
                            logger.error('Failed to update status:', err);
                            alert('Failed to mark order as complete.');
                          }
                        }}
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>Items</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span>{item.quantity} x {item.name}</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '0.9rem', color: '#555' }}>
                      <strong>Delivery to:</strong> {order.name}, {order.address} ({order.phone})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedOrderForInvoice && (
        <InvoiceModal order={selectedOrderForInvoice} onClose={() => setSelectedOrderForInvoice(null)} />
      )}
    </div>
  );
};

export default Account;
