/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { DriversPage } from './pages/DriversPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { OperationalNotesPage } from './pages/OperationalNotesPage';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Map, Users, Truck, Calendar, Menu, X, LogOut, Sun, Moon, BookOpen } from 'lucide-react';

function AppLayout({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'locais' | 'programacoes' | 'anotacoes' | 'motoristas' | 'veiculos'>('locais');

  const navItems = [
    { id: 'locais', label: 'Locais', icon: Map },
    { id: 'programacoes', label: 'Programações', icon: Calendar },
    { id: 'anotacoes', label: 'Anotações', icon: BookOpen },
    { id: 'motoristas', label: 'Motoristas', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Truck },
  ] as const;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#09090B]">
      {/* Top Navigation */}
      <header className="flex-none bg-white dark:bg-[#09090B] border-b border-slate-200 dark:border-white/10 z-40 relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">Op.Log</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 mx-8 relative top-[1px]">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-5 border-b-2 text-sm font-medium transition-colors
                      ${isActive 
                        ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Utilities */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex flex-col items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2"></div>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sair</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#09090B]">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
              
              <div className="border-t border-slate-200 dark:border-white/10 my-2"></div>
              
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>Alternar Tema</span>
              </button>
              
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-[#09090B]">
        {activeTab === 'locais' && <Dashboard theme={theme} toggleTheme={toggleTheme} />}
        {activeTab === 'programacoes' && <SchedulesPage theme={theme} toggleTheme={toggleTheme} />}
        {activeTab === 'anotacoes' && <OperationalNotesPage theme={theme} toggleTheme={toggleTheme} />}
        {activeTab === 'motoristas' && <DriversPage theme={theme} toggleTheme={toggleTheme} />}
        {activeTab === 'veiculos' && <VehiclesPage theme={theme} toggleTheme={toggleTheme} />}
      </main>
    </div>
  );
}

function MainApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login theme={theme} toggleTheme={toggleTheme} />;
  }

  return <AppLayout theme={theme} toggleTheme={toggleTheme} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
