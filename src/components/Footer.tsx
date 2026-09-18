'use client';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--text-dark)', color: 'white', padding: '4rem 0 2rem 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          
          {/* Brand & Newsletter */}
          <div>
            <div className="nav-brand" style={{ color: 'white', textAlign: 'left', marginBottom: '1rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#a0aab2' }}>BASEMENT</span>
              BUZZ CORNER
            </div>
            <p style={{ fontSize: '0.85rem', color: '#a0aab2', marginBottom: '1.5rem', lineHeight: 1.8 }}>
              We only have quality stationary for you here. Sign up for our newsletter to receive promos and updates.
            </p>
            <div style={{ fontSize: '0.85rem', color: '#a0aab2', marginBottom: '1.5rem', lineHeight: 1.8 }}>
              <p>G block Casagrand Savoye, Kuppuswamy Street, Karappakam, Chennai, Tamil Nadu - 600097</p>
              <p>Premalatha - +91 9094063923</p>
            </div>
            <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email Address" 
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '4px',
                  flexGrow: 1,
                  outline: 'none',
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }}
              />
              <button className="btn btn-pink" style={{ borderRadius: '4px', padding: '0.75rem 1.5rem', fontSize: '0.8rem' }}>
                Subscribe
              </button>
            </form>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: '#a0aab2', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><Link href="#">About Us</Link></li>
              <li><Link href="#">Affiliate Links</Link></li>
              <li><Link href="#">Testimonials</Link></li>
              <li><Link href="#">Contact</Link></li>
            </ul>
          </div>

          {/* Shop Links */}
          <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Shop</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: '#a0aab2', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><Link href="#">Products</Link></li>
              <li><Link href="#">Shipping</Link></li>
              <li><Link href="#">Return Policy</Link></li>
              <li><Link href="#">FAQ</Link></li>
              <li><Link href="#">Bulk Orders</Link></li>
            </ul>
          </div>

          {/* Contact Links */}
          <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Contact</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: '#a0aab2', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><Link href="#">Phone Numbers</Link></li>
              <li><Link href="#">Email Address</Link></li>
              <li><Link href="#">Social Media</Link></li>
              <li><Link href="#">Message Form</Link></li>
              <li><Link href="#">Customer Support</Link></li>
            </ul>
          </div>

        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0aab2' }}>
          <p>Copyright © 2026. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms & Condition</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
