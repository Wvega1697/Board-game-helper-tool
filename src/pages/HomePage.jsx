import { useState, useMemo } from 'react';
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
