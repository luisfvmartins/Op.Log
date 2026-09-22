/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Map, Menu, X, LogOut, Sun, Moon, Info, Instagram, History, Mail } from 'lucide-react';
import { SystemLogsModal } from './components/ui/SystemLogsModal';
import { DomainMigrationModal } from './components/ui/DomainMigrationModal';

function AppLayout({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const navItems = [
    { id: 'locais', label: 'Locais', icon: Map, disabled: false },
  ] as const;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      <header className="flex-none bg-[var(--bg-base)] border-b border-[var(--border)] z-40 relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-8 h-full">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">Op.Log</span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span className="text-xs text-[var(--text-tertiary)]">Locais e Roteiros</span>
              </div>
              <nav className="hidden md:flex items-center gap-1 h-full">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} className="flex items-center gap-2 px-3 h-full border-b-2 text-sm font-medium transition-colors border-[#D4A843] text-[#F0EDE8]">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]" title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsInfoModalOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]" title="Informações do App">
                <Info className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
              <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]" title="Sair">
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button onClick={() => setIsInfoModalOpen(true)} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md" title="Informações do App"><Info className="w-5 h-5" /></button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md">{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-base)]">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors border-l-2 border-[#D4A843] bg-[var(--accent-tint)] text-[var(--text-primary)]"><Icon className="w-5 h-5" />{item.label}</button> })}
              <div className="border-t border-[var(--border)] my-2"></div>
              <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}<span>Alternar Tema</span></button>
              <button onClick={() => { setIsInfoModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"><Info className="w-5 h-5" /><span>Sobre o App</span></button>
              <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-[#E05252] hover:bg-[#E05252]/10 transition-colors"><LogOut className="w-5 h-5" /><span>Sair</span></button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 overflow-auto bg-[var(--bg-base)]"><Dashboard theme={theme} toggleTheme={toggleTheme} /></main>
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-tint)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-bold text-lg font-mono">Op</div>
              <div><h3 className="text-base font-semibold text-[var(--text-primary)]">Op.Log</h3><p className="text-xs text-[var(--text-tertiary)] font-mono">Gestão de Locais e Roteiros</p></div>
            </div>
            <div className="space-y-4 text-sm text-[var(--text-secondary)] border-t border-[var(--border)] pt-4">
              <p className="leading-relaxed">Sistema inteligente para gerenciamento de locais, cadastro de fornecedores/clientes e montagem rápida de roteiros de viagem e mensagens padronizadas.</p>
              <div className="bg-[var(--bg-base)] p-4 rounded-lg border border-[var(--border)] space-y-3">
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Créditos</p>
                <p className="font-medium text-[var(--text-primary)] text-sm">(criado por Luís Martins)</p>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <Instagram className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-[var(--text-secondary)] font-medium">Instagram:</span>
                  <a href="https://instagram.com/luisfvmartins" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline font-mono font-medium">@luisfvmartins</a>
                </div>
              </div>
              <div className="bg-[var(--bg-base)] p-4 rounded-lg border border-[var(--border)] space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Suporte e sugestões</p>
                <a href="mailto:suporte.oplog@luisfvmartins.com" className="flex items-center gap-2 text-xs group">
                  <Mail className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-[var(--accent)] group-hover:underline font-mono font-medium break-all">suporte.oplog@luisfvmartins.com</span>
                </a>
                <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">Encontrou um problema ou tem uma sugestão para melhorar o Op.Log? Entre em contato conosco.</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <button onClick={() => { setIsInfoModalOpen(false); setIsLogModalOpen(true); }} className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors py-1 px-2.5 rounded-md hover:bg-[var(--bg-base)]" title="Exibir Log de Atividades do Sistema"><History className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /><span>Log do Sistema</span></button>
              <button onClick={() => setIsInfoModalOpen(false)} className="px-5 py-2 bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-md text-sm font-medium transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
      <SystemLogsModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
    </div>
  );
}

function MainApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [isDomainMigrationOpen, setIsDomainMigrationOpen] = useState(false);
  useEffect(() => { if (window.location.hostname === 'transmagna.vercel.app') setIsDomainMigrationOpen(true); }, []);
  useEffect(() => { if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); localStorage.setItem('theme', theme); }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" /><span className="text-sm font-mono text-[var(--text-tertiary)]">carregando...</span></div></div>;
  if (!user) return <><Login theme={theme} toggleTheme={toggleTheme} /><DomainMigrationModal isOpen={isDomainMigrationOpen} onClose={() => setIsDomainMigrationOpen(false)} /></>;
  return <><AppLayout theme={theme} toggleTheme={toggleTheme} /><DomainMigrationModal isOpen={isDomainMigrationOpen} onClose={() => setIsDomainMigrationOpen(false)} /></>;
}

export default function App() { return <AuthProvider><MainApp /></AuthProvider>; }
