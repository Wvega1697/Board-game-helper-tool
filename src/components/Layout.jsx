import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-dvh flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className="btn-icon"
                aria-label={t('back')}
                id="btn-back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              id="btn-home"
            >
              <span className="text-2xl">🎲</span>
              <h1 className="font-heading text-lg font-bold gradient-text">
                {t('appName')}
              </h1>
            </button>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer (minimal) */}
      <footer className="py-4 text-center text-text-muted text-xs">
        <p>Boardgame Helper © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
