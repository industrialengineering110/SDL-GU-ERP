import React from 'react';

interface ZoomWrapperProps {
  children: React.ReactNode;
  referenceWidth?: number;
}

const ZoomWrapper: React.FC<ZoomWrapperProps> = ({ children, referenceWidth = 1200 }) => {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <div style={{ minWidth: referenceWidth }}>
        {children}
      </div>
    </div>
  );
};

export default ZoomWrapper;
