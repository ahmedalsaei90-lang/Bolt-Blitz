import React from 'react';

interface LightningLogoProps {
  className?: string;
  size?: number;
}

export const LightningLogo: React.FC<LightningLogoProps> = ({ 
  className = "", 
  size = 64 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main Lightning Gradient */}
        <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFF00" />
          <stop offset="25%" stopColor="#FF6B00" />
          <stop offset="50%" stopColor="#FF0000" />
          <stop offset="75%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        
        {/* Glow Effect Gradient */}
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFF00" stopOpacity="0.8" />
          <stop offset="30%" stopColor="#FF6B00" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#0066FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </radialGradient>
        
        {/* Inner Highlight Gradient */}
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="20%" stopColor="#FFFF00" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#FF6B00" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#FF0000" stopOpacity="0.3" />
          <stop offset="80%" stopColor="#0066FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
        
        {/* Drop Shadow Filter */}
        <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2" result="offset"/>
          <feFlood floodColor="#000000" floodOpacity="0.3"/>
          <feComposite in2="offset" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Glow Filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer Glow */}
      <path
        d="M32 4 L20 28 L28 28 L16 60 L44 24 L36 24 L48 4 Z"
        fill="url(#glowGradient)"
        filter="url(#glow)"
        opacity="0.6"
      />
      
      {/* Main Lightning Bolt */}
      <path
        d="M32 6 L22 26 L30 26 L20 56 L42 26 L34 26 L44 6 Z"
        fill="url(#lightningGradient)"
        filter="url(#dropShadow)"
        stroke="url(#highlightGradient)"
        strokeWidth="1"
      />
      
      {/* Inner Highlight */}
      <path
        d="M32 8 L24 24 L30 24 L22 52 L40 28 L34 28 L42 8 Z"
        fill="url(#highlightGradient)"
        opacity="0.4"
      />
      
      {/* Energy Sparks */}
      <circle cx="18" cy="30" r="1.5" fill="#FFFF00" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="46" cy="22" r="1" fill="#FF6B00" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="38" cy="45" r="1.2" fill="#0066FF" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="28" cy="18" r="0.8" fill="#FF0000" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
};

export default LightningLogo;