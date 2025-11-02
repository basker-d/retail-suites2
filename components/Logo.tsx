import React from 'react';

export const Logo = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 320 100" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        aria-label="DP Artifacts Logo"
    >
        <text 
            x="160" 
            y="65" 
            fontFamily="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" 
            fontSize="80" 
            fill="white" 
            textAnchor="middle"
            letterSpacing="-4"
        >
            DP
        </text>
        
        <text 
            x="160" 
            y="95" 
            fontFamily="'Brush Script MT', 'Brush Script Std', cursive" 
            fontSize="50" 
            fill="white" 
            textAnchor="middle"
        >
            Artifacts
        </text>

        {/* Left swish/sparkle */}
        <path d="M60,75 C70,65 85,65 95,75" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M57 72 l 6 6 M63 72 l -6 6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Right swish */}
        <path d="M225,75 C235,85 250,85 260,75" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);