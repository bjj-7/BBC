import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableChipsProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollableChips: React.FC<ScrollableChipsProps> = ({ children, className = '' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Use a 1px tolerance for left scroll check due to subpixel rendering rounding on mobile
      setCanScrollLeft(Math.ceil(scrollLeft) > 1);
      // Use a 1px tolerance for right scroll check due to subpixel rendering rounding
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    
    // Check on window resize
    window.addEventListener('resize', checkScroll);
    
    // Also use ResizeObserver to catch layout changes (e.g. chips changing)
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [children]);

  const scrollBy = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`scrollable-chips-wrapper ${className}`}>
      {canScrollLeft && (
        <button 
          className="scroll-arrow scroll-arrow-left" 
          onClick={() => scrollBy(-200)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} strokeWidth={3} />
        </button>
      )}
      
      <div 
        className="category-chips no-scrollbar" 
        ref={scrollContainerRef}
        onScroll={checkScroll}
      >
        {children}
      </div>

      {canScrollRight && (
        <button 
          className="scroll-arrow scroll-arrow-right" 
          onClick={() => scrollBy(200)}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};

export default ScrollableChips;
