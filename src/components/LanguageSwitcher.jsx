import { useI18n } from '../i18n/index.jsx';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-secondary/50 border border-border-glass">
      <button
        onClick={() => setLocale('es')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          locale === 'es'
            ? 'bg-accent-purple/20 text-accent-purple'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          locale === 'en'
            ? 'bg-accent-purple/20 text-accent-purple'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
