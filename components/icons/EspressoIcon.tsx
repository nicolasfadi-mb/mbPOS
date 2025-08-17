import React from 'react';

export const EspressoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M17 8h1a2 2 0 0 1 0 4h-1" />
    <path d="M4 8h13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
    <line x1="6" y1="2" x2="6" y2="5" />
    <line x1="9" y1="2" x2="9" y2="5" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="4" y1="18" x2="18" y2="18" />
  </svg>
);