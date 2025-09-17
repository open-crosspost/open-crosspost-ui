import React from "react";

interface ArchwayLogoProps {
  size?: number;
  className?: string;
}

export function ArchwayLogo({ size = 24, className = "" }: ArchwayLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left pillar with stepped base and capital */}
      <rect x="4" y="8" width="2" height="8" />
      <rect x="3" y="7" width="4" height="1" />
      <rect x="3" y="16" width="4" height="1" />
      
      {/* Right pillar with stepped base and capital */}
      <rect x="18" y="8" width="2" height="8" />
      <rect x="17" y="7" width="4" height="1" />
      <rect x="17" y="16" width="4" height="1" />
      
      {/* Horizontal beam */}
      <rect x="4" y="6" width="16" height="2" />
      
      {/* Semi-circular arch */}
      <path d="M6 8 A6 6 0 0 1 18 8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

