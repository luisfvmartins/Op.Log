import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, Info, Sun, Moon, Instagram, Linkedin } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export function Login({ theme, toggleTheme }: { theme?: 'light' | 'dark', toggleTheme?: () => void }) {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Adicione transmagna.vercel.app na seção "Authentication > Settings > Authorized domains" do seu console Firebase.');
      } else {
        setError(err.message || 'Erro inesperado ao fazer login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          title="Sobre"
        >
          <Info className="w-5 h-5" />
        </button>
        {toggleTheme && theme && (
          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] w-full max-w-[360px] p-8 flex flex-col items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">Op.Log</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 mb-6">Locais e Roteiros</p>

        {error && (
          <div className="w-full bg-[#E05252]/10 border border-[#E05252]/20 text-[#E05252] p-3 rounded-md flex items-start gap-2 mb-6 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors px-4 py-3 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {isLoading ? 'Entrando...' : 'Entrar com Google'}
        </button>
      </div>

      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="Sobre"
      >
        <div className="p-2 sm:p-4 text-[var(--text-secondary)]">
          <p className="text-sm leading-relaxed mb-6">
            O <strong>Op.Log</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente suas operações logísticas e viagens.
          </p>
          
          <div className="bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border)]">
            <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest mb-2 font-mono">Criador</h4>
            <p className="text-base text-[var(--text-primary)] font-medium mb-4">
              Desenvolvido por Luis Martins
            </p>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://instagram.com/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
              >
                <div className="p-2 bg-[var(--bg-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] rounded-md border border-[var(--border)] group-hover:border-[var(--border-hover)]">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">@luisfvmartins</span>
              </a>
              <a 
                href="https://linkedin.com/in/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
              >
                <div className="p-2 bg-[var(--bg-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] rounded-md border border-[var(--border)] group-hover:border-[var(--border-hover)]">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">/in/luisfvmartins</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="px-5 py-2.5 bg-transparent hover:bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] rounded-md text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
