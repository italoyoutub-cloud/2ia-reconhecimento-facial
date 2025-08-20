import React from 'react';

interface SpinnerProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const Spinner: React.FC<SpinnerProps> = ({ className = '', size = 'medium' }) => {
  return (
    <div className={`spinner spinner-${size} ${className}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

export default Spinner;