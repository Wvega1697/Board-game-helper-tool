import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { games } from '../games/index.js';
import GameCard from '../components/GameCard.jsx';

export default function HomePage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        t(g.description).toLowerCase().includes(q)
    );
  }, [search, t]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="text-center py-4">
        <h1 className="font-heading text-3xl font-extrabold gradient-text mb-2">
          {t('appName')}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('appTagline')}
        </p>
      </div>

      {/* Log a Play card */}
      <Link
        to="/log-play"
        className="glass-card block p-5 group cursor-pointer animate-slide-up hover:shadow-lg hover:shadow-accent-teal/10 border border-accent-teal/20 hover:border-accent-teal/40 transition-all"
        style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        id="log-play-card"
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">📝</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-lg text-accent-teal group-hover:text-accent-teal/80 transition-colors">
              {t('logPlayTitle')}
            </h3>
            <p className="text-text-secondary text-sm mt-1">{t('logPlayDescription')}</p>
          </div>
          <div className="flex-shrink-0 text-text-muted group-hover:text-accent-teal group-hover:translate-x-1 transition-all duration-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="input pl-11"
          id="search-games"
        />
      </div>

      {/* Game List */}
      <div>
        <h2 className="text-text-secondary text-xs uppercase tracking-wider font-medium mb-3">
          {t('allGames')} ({filteredGames.length})
        </h2>

        {filteredGames.length > 0 ? (
          <div className="space-y-3">
            {filteredGames.map((game, index) => (
              <GameCard key={game.id} game={{ ...game, description: t(game.description) }} index={index} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-text-muted animate-fade-in">
            <div className="text-4xl mb-3">🔍</div>
            <p>{t('noGamesFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
