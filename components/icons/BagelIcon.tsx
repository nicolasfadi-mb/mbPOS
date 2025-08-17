import React from 'react';

export const BagelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M17.4 14.7a7.9 7.9 0 1 0-10.8 0" />
    <path d="M12 17.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
    <path d="M5.9 14.8c.2-.2.6-.3 1-.2" />
    <path d="M8 6.8c.3-.6.9-.9 1.5-1" />
    <path d="M13.2 5.5c.3.1.5.2.8.4" />
    <path d="M17.2 9c.2.3.3.6.3 1" />
    <path d="M17.9 12.8c0 .3-.1.6-.2.9" />
  </svg>
);