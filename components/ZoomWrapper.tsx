
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';

interface ZoomWrapperProps {
  children: React.ReactNode;
  referenceWidth?: number;
  className?: string;
}

const ZoomWrapper: React.FC<ZoomWrapperProps> = ({ 
  children, 
  referenceWidth = 1200,
  className = ""
}) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAutoFit = () => {
      if (window.innerWidth < 768 && containerRef.current) {
        // On mobile, we want to fit the reference width into the screen width
        const containerWidth = window.innerWidth - 32; // 16px padding on each side
        const scale = Math.min(1, containerWidth / referenceWidth);
        setZoom(scale);
      } else {
        setZoom(1);
      }
    };

    handleAutoFit();
    window.addEventListener('resize', handleAutoFit);
    return () => window.removeEventListener('resize', handleAutoFit);
  }, [referenceWidth]);

  const resetZoom = () => {
    if (window.innerWidth < 768) {
      const containerWidth = window.innerWidth - 32;
      setZoom(Math.min(1, containerWidth / referenceWidth));
    } else {
      setZoom(1);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Floating Zoom Controls for Mobile */}
      <div className="md:hidden fixed bottom-24 right-6 z-[1000] flex flex-col gap-3">
        <button 
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl flex items-center justify-center text-slate-900 hover:bg-slate-50 active:scale-90 transition-all"
          title="Zoom In"
        >
          <Maximize2 size={20} />
        </button>
        <button 
          onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
          className="w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl flex items-center justify-center text-slate-900 hover:bg-slate-50 active:scale-90 transition-all"
          title="Zoom Out"
        >
          <Minimize2 size={20} />
        </button>
        <button 
          onClick={resetZoom}
          className="w-12 h-12 bg-slate-900 border-2 border-slate-900 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:bg-black active:scale-90 transition-all"
          title="Reset Zoom"
        >
          <RotateCcw size={20} />
        </button>
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-black text-slate-900 text-center shadow-sm">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      <div className="overflow-hidden w-full">
        <div 
          ref={containerRef}
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ZoomWrapper;
