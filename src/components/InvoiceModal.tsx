import React from 'react';
import type { Order } from '../store/useAppStore';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal">
      <div className="modal-box" style={{ maxWidth: '650px', width: '95%' }}>
        
        {/* Actions - hidden during print */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Invoice</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={() => window.print()}>🖨️ Print</button>
            <button className="icon-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="invoice-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <img src="/logo.png" alt="Basement Buzz Corner Logo" style={{ height: '50px', marginBottom: '10px', mixBlendMode: 'multiply' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>INVOICE</h3>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{order.invoiceNumber}</p>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.85rem', textTransform: 'uppercase' }}>Billed To:</h4>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{order.name}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#444' }}>{order.email}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#444' }}>{order.phone}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', whiteSpace: 'pre-wrap' }}>{order.address}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.85rem', textTransform: 'uppercase' }}>Order Status:</h4>
              <span style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                fontSize: '0.9rem', 
                fontWeight: '600',
                textTransform: 'capitalize',
                background: order.status === 'complete' ? '#d4edda' : '#f8f9fa',
                color: order.status === 'complete' ? '#155724' : '#333',
                border: '1px solid var(--border)',
                display: 'inline-block'
              }}>
                {order.status}
              </span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.9rem', color: '#555' }}>Item Description</th>
                <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>Qty</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.9rem', color: '#555' }}>Price</th>
                <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.9rem', color: '#555' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px', fontSize: '0.95rem' }}>{item.name}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '0.95rem' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '0.95rem' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '0.95rem', fontWeight: '500' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '250px', background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--accent-2)' }}>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '40px', textAlign: 'center', color: '#777', fontSize: '0.85rem' }}>
            <p style={{ margin: 0 }}>Thank you for your business!</p>
            <p style={{ margin: '4px 0 0 0' }}>If you have any questions about this invoice, please contact us.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
