import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';

export default function GameCard({ game, index = 0 }) {
  const { t } = useI18n();

  return (
    <Link
      to={`/game/${game.id}`}
      className="glass-card block p-5 group cursor-pointer animate-slide-up hover:shadow-lg hover:shadow-accent-purple/10"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
      id={`game-card-${game.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Game Icon */}
        <div className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ animation: 'float 3s ease-in-out infinite', animationDelay: `${index * 200}ms` }}>
          {game.icon}
        </div>

        {/* Game Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg text-text-primary group-hover:text-accent-purple transition-colors">
            {game.name}
          </h3>
          <p className="text-text-secondary text-sm mt-1 line-clamp-2">
            {game.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {game.minPlayers}–{game.maxPlayers} {t('players')}
            </span>
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {game.estimatedTime}
            </span>
          </div>

          {/* Tags */}
          {game.tags && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-text-muted group-hover:text-accent-teal group-hover:translate-x-1 transition-all duration-300 mt-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
