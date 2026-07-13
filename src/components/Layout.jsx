import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { getGame } from '../games/index.js';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const isHome = location.pathname === '/';
  const [sessionVer, setSessionVer] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setSessionVer((v) => v + 1);
    window.addEventListener('session-storage-update', handleUpdate);
    return () => window.removeEventListener('session-storage-update', handleUpdate);
  }, []);

  // Resolve the active game from the URL, then read its phase from sessionStorage.
  // storagePrefix comes from each game's config (e.g. 'hld', 'flip7').
  const gameId = location.pathname.startsWith('/game/') ? location.pathname.split('/game/')[1] : null;
  const gameConfig = gameId ? getGame(gameId) : null;
  const storagePrefix = gameConfig?.storagePrefix;

  // useSessionStorage JSON.stringifies values, so the raw value includes quotes: '"playing"'
  const rawPhase = storagePrefix ? sessionStorage.getItem(`${storagePrefix}-phase`) : null;
  // Show restart when we're in a real game phase (anything except setup/game_over/absent)
  const INACTIVE_PHASES = new Set([null, '"setup"', '"game_over"']);
  const isActiveGame = !INACTIVE_PHASES.has(rawPhase);

  const handleRestart = () => {
    if (!storagePrefix) return;
    if (!window.confirm(t('confirmRestart'))) return;
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(`${storagePrefix}-`))
      .forEach((key) => sessionStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="min-h-dvh flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-5 py-3.5">
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

          <div className="flex items-center gap-2">
            {/* Restart button — only visible when a game is in progress */}
            {isActiveGame && (
              <button
                onClick={handleRestart}
                className="btn-icon text-text-muted hover:text-danger hover:border-danger/30"
                aria-label={t('restartGame')}
                id="btn-restart-game"
                title={t('restartGame')}
              >
                {/* Circular arrow / restart icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="btn-icon"
              aria-label="Settings"
              id="btn-settings"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-6 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer (minimal) */}
      <footer className="py-4 text-center text-text-muted text-xs">
        <p>Boardgame Helper © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
