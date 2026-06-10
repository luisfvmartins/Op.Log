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
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-slate-200 flex items-center justify-center p-4 selection:bg-blue-500/30 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Sobre"
        >
          <Info className="w-5 h-5" />
        </button>
        {toggleTheme && theme && (
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Locais e Roteiros</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Acesse para gerenciar seus locais de parada e organizar seus roteiros.
        </p>

        {error && (
          <div className="w-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 mb-6 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/20 transition-all px-4 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="p-2 sm:p-4 text-slate-600 dark:text-slate-300">
          <p className="text-sm sm:text-base leading-relaxed mb-6">
            O <strong>Locais e Roteiros</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente seus locais de parada e organizar seus roteiros de viagens.
          </p>
          
          <div className="bg-slate-100 dark:bg-black/40 p-5 rounded-xl border border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Criador</h4>
            <p className="text-base text-slate-900 dark:text-white font-medium mb-4">
              Desenvolvido por Luis Martins
            </p>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://instagram.com/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">@luisfvmartins</span>
              </a>
              <a 
                href="https://linkedin.com/in/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">/in/luisfvmartins</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
