
import React from 'react';
import Logo from './common/Logo';

type View = 'dashboard' | 'live' | 'schools' | 'students' | 'reports' | 'settings';

interface SidebarProps {
    currentView: View;
    onSetView: (view: View) => void;
    userRole?: 'admin' | 'professor' | 'operador';
}

const NavLink: React.FC<{
    icon: JSX.Element;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md text-left transition-colors duration-200 ${
            isActive ? 'bg-orange-600 dark:bg-orange-700 text-white' : 'text-neutral-300 dark:text-gray-300 hover:bg-neutral-700 dark:hover:bg-gray-600 hover:text-white'
        }`}
    >
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onSetView, userRole = 'operador' }) => {
    // Definir permissões baseadas no papel do usuário
    const canAccessSchools = userRole === 'admin';
    const canAccessReports = userRole === 'admin' || userRole === 'professor';
    const canAccessSettings = userRole === 'admin';

    return (
        <aside className="w-64 bg-neutral-800 dark:bg-gray-900 text-white p-4 flex flex-col flex-shrink-0 transition-colors duration-200">
            <div className="px-2 mb-8">
                <Logo />
            </div>

            <nav className="flex-grow flex flex-col">
                <div>
                    <h3 className="px-4 text-sm font-semibold text-neutral-400 dark:text-gray-400 uppercase tracking-wider mb-2">Análise</h3>
                    <div className="space-y-2">
                        <NavLink 
                            label="Dashboard" 
                            isActive={currentView === 'dashboard'} 
                            onClick={() => onSetView('dashboard')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                        />
                         <NavLink 
                            label="Reconhecimento ao Vivo" 
                            isActive={currentView === 'live'} 
                            onClick={() => onSetView('live')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                        />
                        {canAccessReports && (
                            <NavLink 
                                label="Relatórios" 
                                isActive={currentView === 'reports'} 
                                onClick={() => onSetView('reports')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            />
                        )}
                    </div>
                </div>
                 <div className="mt-6">
                    <h3 className="px-4 text-sm font-semibold text-neutral-400 dark:text-gray-400 uppercase tracking-wider mb-2">Gerenciamento</h3>
                     <div className="space-y-2">
                        {canAccessSchools && (
                            <NavLink 
                                label="Escolas" 
                                isActive={currentView === 'schools'} 
                                onClick={() => onSetView('schools')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                            />
                        )}
                        <NavLink 
                            label="Alunos" 
                            isActive={currentView === 'students'} 
                            onClick={() => onSetView('students')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        />
                    </div>
                </div>
                {canAccessSettings && (
                    <div className="mt-6">
                        <h3 className="px-4 text-sm font-semibold text-neutral-400 dark:text-gray-400 uppercase tracking-wider mb-2">Sistema</h3>
                        <div className="space-y-2">
                            <NavLink 
                                label="Configurações" 
                                isActive={currentView === 'settings'} 
                                onClick={() => onSetView('settings')}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            />
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                    <div className="space-y-2">
                    </div>
                </div>
            </nav>

             <div className="border-t border-neutral-700 dark:border-gray-600 pt-4 mt-4 px-2">
                <div className="text-xs text-neutral-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} 2ia Tecnologia
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
