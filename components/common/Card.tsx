
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md transition-colors duration-200 ${className}`}>
      {title && <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-gray-100 p-6 pb-0">{title}</h2>}
      <div className={title ? 'p-6 pt-2' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
