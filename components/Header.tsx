import React from 'react';
import { LogoutIcon } from './icons';
import { Logo } from './Logo';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout }) => (
    <header className="py-4 px-8 w-full flex items-center justify-center relative">
        <div className="text-center">
            <Logo className="h-14 mx-auto" />
            <p className="text-accent-blue text-sm mt-1">AI Ad Generator</p>
        </div>
        {isLoggedIn && (
            <button 
              onClick={onLogout} 
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Logout"
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
        )}
    </header>
);