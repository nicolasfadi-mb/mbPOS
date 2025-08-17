import React from 'react';

export const BuildingOfficeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 22h16" />
    <path d="M10 12H8" />
    <path d="M16 12h-2" />
    <path d="M10 8H8" />
    <path d="M16 8h-2" />
    <path d="M10 4H8" />
    <path d="M16 4h-2" />
    <path d="M12 22V4" />
    <path d="M4 22V4a2 2 0 0 1 2-2h4" />
    <path d="M20 22V4a2 2 0 0 0-2-2h-4" />
  </svg>
);