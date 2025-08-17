import React from 'react';

export const MochaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M17 5v12a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V5" />
    <path d="M17 5h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
    <path d="M3 15h14" />
    <path d="M5 2c2 1 2 3 0 4" />
    <path d="M8 2c2 1 2 3 0 4" />
  </svg>
);