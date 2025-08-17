import React from 'react';

export const TeaCupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M18 8h1a2 2 0 0 1 0 4h-1" />
    <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
    <path d="M3 18h18" />
    <path d="M7 2v2" />
    <path d="M11 2v2" />
  </svg>
);