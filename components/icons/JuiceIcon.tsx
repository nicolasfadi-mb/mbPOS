import React from 'react';

export const JuiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M18 3H6v14a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V3z" />
    <path d="M6 13h12" />
    <path d="M14 3s-1 1-1 3 1 3 1 3" />
    <path d="M21 8a4 4 0 0 0-4-4h-1" />
  </svg>
);