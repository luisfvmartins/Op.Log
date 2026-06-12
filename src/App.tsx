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
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Top Navigation */}
      <header className="flex-none bg-[var(--bg-base)] border-b border-[var(--border)] z-40 relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            
            {/* Left side: Logo & Desktop Nav */}
            <div className="flex items-center gap-8 h-full">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">Op.Log</span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span className="text-xs text-[var(--text-tertiary)]">Locais e Roteiros</span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 h-full">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-3 h-full border-b-2 text-sm font-medium transition-colors
                        ${isActive 
                          ? 'border-[#D4A843] text-[#F0EDE8]' 
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[#F0EDE8]'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Utilities */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
              
              <button
                onClick={logout}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-base)]">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors border-l-2
                      ${isActive 
                        ? 'border-[#D4A843] bg-[var(--accent-tint)] text-[var(--text-primary)]' 
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
              
              <div className="border-t border-[var(--border)] my-2"></div>
              
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>Alternar Tema</span>
              </button>
              
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-[#E05252] hover:bg-[#E05252]/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[var(--bg-base)]">
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
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <span className="text-sm font-mono text-[var(--text-tertiary)]">carregando...</span>
        </div>
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
