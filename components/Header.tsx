import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './common/Logo';
import Button from './common/Button';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './common/ThemeToggle';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'professor': return 'Professor';
      case 'operador': return 'Operador';
      default: return role;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 px-6 py-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-gray-100">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationCenter />
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-neutral-800 dark:text-gray-100">{user.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-gray-400">{getRoleLabel(user.role)}</div>
                </div>
                <svg className="w-4 h-4 text-neutral-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-neutral-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100 dark:border-gray-700">
                    <div className="text-sm font-medium text-neutral-800 dark:text-gray-100">{user.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;