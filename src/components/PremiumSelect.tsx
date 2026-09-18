import React, { useState, useRef, useEffect } from 'react';
import { ListFilter } from 'lucide-react';
import './PremiumSelect.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface PremiumSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const PremiumSelect: React.FC<PremiumSelectProps> = ({ options, value, onChange, className = '', style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={wrapperRef} className={`premium-select-wrapper ${className}`} style={{ position: 'relative', ...style }}>
      <div 
        className={`premium-select-trigger circle-btn ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={selectedOption?.label}
      >
        <ListFilter size={18} />
      </div>

      {isOpen && (
        <div className="premium-select-popup" style={{ 
          position: 'absolute', 
          top: '100%', 
          right: 0, 
          marginTop: '8px',
          background: 'white', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          minWidth: '100%',
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          whiteSpace: 'nowrap'
        }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ 
                padding: '10px 16px', 
                cursor: 'pointer', 
                fontSize: '0.85rem', 
                color: opt.value === value ? 'var(--primary)' : 'var(--text)',
                fontWeight: opt.value === value ? 600 : 400,
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                whiteSpace: 'nowrap',
                gap: '12px'
              }}
            >
              {opt.label}
              {opt.value === value && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumSelect;
