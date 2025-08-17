import React from 'react';

export const CroissantIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M20 8A7.78 7.78 0 0 0 12.22 3c-3.14 0-6.13 2.5-8.22 5" />
    <path d="M20 8c0 3.87-3.13 7-7 7a6.87 6.87 0 0 1-2.27-.42" />
    <path d="M4 8c0 3.87 3.13 7 7 7a6.87 6.87 0 0 0 2.27-.42" />
    <path d="M10.84 14.58C7.5 13.5 4 10.5 4 8" />
    <path d="M13.16 14.58c3.34-1 6.84-4 6.84-6.58" />
  </svg>
);