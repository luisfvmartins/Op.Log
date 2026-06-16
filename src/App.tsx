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
import { Map, Users, Truck, Calendar, Menu, X, LogOut, Sun, Moon, BookOpen, Briefcase, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppLayout({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'locais' | 'programacoes' | 'anotacoes' | 'motoristas' | 'veiculos'>(() => {
    const saved = localStorage.getItem('oplog_activeTab');
    return (saved as any) || 'locais';
  });

  useEffect(() => {
    localStorage.setItem('oplog_activeTab', activeTab);
  }, [activeTab]);

  const navItems = [
    { id: 'locais', label: 'Destinos & Locais', icon: Map },
    { id: 'programacoes', label: 'Programações', icon: Calendar },
    { id: 'anotacoes', label: 'Diário Operacional', icon: BookOpen },
    { id: 'motoristas', label: 'Motoristas', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Truck },
  ] as const;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1 w-full px-3">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); onClick?.(); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all w-full
              ${isActive 
                ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }
            `}
          >
            <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`} strokeWidth={isActive ? 2 : 1.75} />
            <span className="tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
        
        {/* Workspace Brand / Selector */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)] shrink-0 mb-4">
          <div className="flex items-center gap-3 w-full group cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-[var(--accent-main)] text-[var(--bg-elevated)] flex items-center justify-center shrink-0 shadow-sm">
              <Briefcase className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight leading-tight truncate">Op.Log Command</span>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest truncate">Workspace</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="px-6 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-tertiary)] font-medium">Dashboard</span>
          </div>
          <NavLinks />
        </div>

        {/* Sidebar Footer (User & Settings) */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
           <div className="flex items-center gap-2 mb-3 px-2">
             <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center border border-[var(--border-subtle)] shrink-0">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {user?.email?.charAt(0).toUpperCase() || 'OP'}
                </span>
             </div>
             <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{user?.email?.split('@')[0]}</span>
                <span className="text-[11px] text-[var(--text-tertiary)] truncate">Operador</span>
             </div>
           </div>
           
           <div className="flex items-center justify-between px-2 w-full gap-2 mt-2">
             <button
               onClick={toggleTheme}
               className="flex-1 flex items-center justify-center gap-2 h-8 rounded text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors border border-transparent hover:border-[var(--border-subtle)]"
               title="Alternar Tema"
             >
               {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
               <span>Tema</span>
             </button>
             
             <button
               onClick={logout}
               className="flex-1 flex items-center justify-center gap-2 h-8 rounded text-[12px] font-medium text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
               title="Sair"
             >
               <LogOut className="w-3.5 h-3.5" />
               <span>Sair</span>
             </button>
           </div>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="md:hidden flex-none sticky top-0 z-50 bg-[var(--bg-elevated)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] h-14 flex items-center justify-between px-4 w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[var(--accent-main)] text-[var(--bg-elevated)] flex items-center justify-center">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Op.Log</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] rounded-md">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE FULLSCREEN MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-[60] bg-[var(--bg-base)] flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
               <span className="text-[13px] font-semibold text-[var(--text-primary)]">Menu Operacional</span>
               <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                 <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-tertiary)] font-medium mb-3 block px-3">Módulos</span>
              <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
            </div>

            <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
               <div className="flex flex-col gap-3">
                 <button
                   onClick={toggleTheme}
                   className="w-full flex items-center justify-center gap-2 h-10 rounded-md text-[13px] font-medium text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
                 >
                   {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                   Alternar Tema
                 </button>
                 <button
                   onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                   className="w-full flex items-center justify-center gap-2 h-10 rounded-md text-[13px] font-medium text-red-500 bg-red-500/10 border border-red-500/20"
                 >
                   <LogOut className="w-4 h-4" />
                   Desconectar
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEWPORT CONTEX */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-base)] relative overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full h-full pb-8">
          {activeTab === 'locais' && <Dashboard theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'programacoes' && <SchedulesPage theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'anotacoes' && <OperationalNotesPage theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'motoristas' && <DriversPage theme={theme} toggleTheme={toggleTheme} />}
          {activeTab === 'veiculos' && <VehiclesPage theme={theme} toggleTheme={toggleTheme} />}
        </div>
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--text-tertiary)] border-t-[var(--accent-main)] animate-spin" />
          <span className="text-[11px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase block">Carregando Workspace...</span>
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
