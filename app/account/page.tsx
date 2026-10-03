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
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', street: '', apt: '', city: '', state: '', zip: ''
  });

  const savedAddresses = user?.user_metadata?.savedAddresses || [];

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addressToSave = {
        id: crypto.randomUUID(),
        ...newAddress
      };
      await useAppStore.getState().updateUserAddresses([...savedAddresses, addressToSave]);
      setIsAddingAddress(false);
      setNewAddress({ name: '', phone: '', street: '', apt: '', city: '', state: '', zip: '' });
    } catch (err) {
      logger.error('Failed to save address:', err);
      alert('Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const newAddresses = savedAddresses.filter((a: any) => a.id !== id);
      await useAppStore.getState().updateUserAddresses(newAddresses);
    } catch (err) {
      logger.error('Failed to delete address:', err);
      alert('Failed to delete address.');
    }
  };

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
          
          {/* Address Book Section */}
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Address Book</h3>
              {!isAddingAddress && (
                <button className="secondary-btn" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setIsAddingAddress(true)}>+ Add</button>
              )}
            </div>

            {isAddingAddress ? (
              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Full Name" required value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                <input type="text" placeholder="Phone Number" required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                <input type="text" placeholder="Street Address" required value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                <input type="text" placeholder="Apt, Suite, etc. (optional)" value={newAddress.apt} onChange={e => setNewAddress({...newAddress, apt: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="City" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                  <input type="text" placeholder="State" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                </div>
                <input type="text" placeholder="PIN Code" required value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} className="form-input" style={{ padding: '8px', fontSize: '0.9rem' }} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button type="submit" className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}>Save</button>
                  <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }} onClick={() => setIsAddingAddress(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {savedAddresses.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>No addresses saved yet.</p>
                ) : (
                  savedAddresses.map((addr: any) => (
                    <div key={addr.id} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', position: 'relative' }}>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                        title="Delete address"
                      >&times;</button>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '0.9rem', paddingRight: '20px' }}>{addr.name}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: '#555' }}>{addr.street}{addr.apt ? `, ${addr.apt}` : ''}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: '#555' }}>{addr.city}, {addr.state} {addr.zip}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>{addr.phone}</p>
                    </div>
                  ))
                )}
              </div>
            )}
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
