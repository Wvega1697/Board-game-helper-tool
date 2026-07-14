import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { useBgg } from '../hooks/BggContext.jsx';
import { getStoredUsername } from '../utils/bggConfig.js';
import { showToast } from '../components/Toast.jsx';

export default function SettingsPage() {
  const { t } = useI18n();
  const { isLoggedIn, isLoggingIn, login, logout } = useBgg();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || !password.trim() || !pin.trim()) {
      showToast(t('bggFillAllFields'), 'error');
      return;
    }
    setSaving(true);
    try {
      await login(username.trim(), password, pin);
      showToast(t('bggLoginSuccess'), 'success');
      setUsername('');
      setPassword('');
      setPin('');
    } catch (err) {
      showToast(`${t('bggLoginError')}: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    logout();
    showToast(t('bggCredentialsCleared'), 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-heading text-xl font-bold text-text-primary">⚙️ {t('settings')}</h1>

      {/* BGG Account section */}
      <section className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-text-primary">🎲 {t('bggSettings')}</h2>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">
          {t('bggDisclaimer')}
        </p>

      {isLoggedIn ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-green-400 text-xl">✅</span>
              <div>
                <p className="text-text-primary font-medium">{t('bggConnected')}</p>
                <p className="text-text-muted text-sm">@{getStoredUsername()}</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="btn btn-secondary border-danger/30 text-danger hover:bg-danger/10 w-full"
              id="btn-clear-bgg"
            >
              🗑️ {t('bggClearCredentials')}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <input
                type="text"
                id="input-bgg-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('bggUsername')}
                className="input w-full"
                autoComplete="username"
              />
              <input
                type="password"
                id="input-bgg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('bggPassword')}
                className="input w-full"
                autoComplete="current-password"
              />
              <input
                type="password"
                id="input-bgg-pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t('bggPin')}
                className="input w-full"
                maxLength={12}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || isLoggingIn}
              className="btn btn-primary w-full disabled:opacity-50"
              id="btn-save-bgg"
            >
              {saving || isLoggingIn ? '⏳' : '💾'} {t('bggLogin')}
            </button>
          </>
        )}
      </section>

      {/* Attribution */}
      <p className="text-text-muted text-xs text-center px-4">
        {t('bggAttribution')}
      </p>
    </div>
  );
}
