import React from 'react';

export const LatteArtIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M19 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M3 8h14v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
    <path d="M12 13a3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3z" />
    <path d="M12 10v6" />
    <path d="M15 13a3 3 0 0 0-3-3" />
  </svg>
);