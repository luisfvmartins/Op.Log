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
import { Map, Users, Truck, Calendar, Menu, X, LogOut, Sun, Moon, BookOpen, Bell } from 'lucide-react';

function AppLayout({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'locais' | 'programacoes' | 'anotacoes' | 'motoristas' | 'veiculos'>('locais');

  const navItems = [
    { id: 'locais', label: 'Locais e Roteiros', icon: Map },
    { id: 'programacoes', label: 'Programações', icon: Calendar },
    { id: 'anotacoes', label: 'Anotações', icon: BookOpen },
    { id: 'motoristas', label: 'Motoristas', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Truck },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#09090B]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#09090B]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-slate-900 dark:text-white truncate">Op.Log</span>
          </div>
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#09090B]"></span>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 transition-colors text-sm font-medium"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Tema {theme === 'light' ? 'Escuro' : 'Claro'}
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#09090B]/50 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
             </div>
             <span className="font-semibold text-slate-900 dark:text-white">Op.Log</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500 dark:text-slate-300">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#09090B]"></span>
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
               {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 top-[73px] z-40 bg-white dark:bg-[#09090B] flex flex-col">
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
               <button 
                onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 transition-colors text-sm font-medium"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                Tema {theme === 'light' ? 'Escuro' : 'Claro'}
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto relative">
          {activeTab === 'locais' && <Dashboard theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'programacoes' && <SchedulesPage theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'anotacoes' && <OperationalNotesPage theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'motoristas' && <DriversPage theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'veiculos' && <VehiclesPage theme={theme} toggleTheme={toggleTheme} />}
        </main>
      </div>
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
