
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40, showText = true }) => {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 3x3 Green Grid */}
        <rect x="0" y="0" width="28" height="28" fill="#4CAF50" />
        <rect x="36" y="0" width="28" height="28" fill="#4CAF50" />
        <rect x="72" y="0" width="28" height="28" fill="#4CAF50" />
        
        <rect x="0" y="36" width="28" height="28" fill="#4CAF50" />
        <rect x="36" y="36" width="28" height="28" fill="#4CAF50" />
        <rect x="72" y="36" width="28" height="28" fill="#4CAF50" />
        
        <rect x="0" y="72" width="28" height="28" fill="#4CAF50" />
        <rect x="36" y="72" width="28" height="28" fill="#4CAF50" />
        <rect x="72" y="72" width="28" height="28" fill="#4CAF50" />
      </svg>
      {showText && (
        <span className="text-[#FF0000] font-[900] italic tracking-tight" style={{ fontSize: size * 0.35 }}>
          SQUARE
        </span>
      )}
    </div>
  );
};

export default Logo;
