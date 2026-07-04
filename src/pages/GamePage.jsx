import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { getGame, loadCalculator } from '../games/index.js';

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [Calculator, setCalculator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const game = getGame(gameId);

  useEffect(() => {
    if (!game) {
      setError('Game not found');
      setLoading(false);
      return;
    }

    loadCalculator(gameId)
      .then((module) => {
        setCalculator(() => module.default);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load game:', err);
        setError('Failed to load game');
        setLoading(false);
      });
  }, [gameId, game]);

  if (error || !game) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="text-5xl mb-4">😵</div>
        <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
          {error || 'Game not found'}
        </h2>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          {t('home')}
        </button>
      </div>
    );
  }

  if (loading || !Calculator) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Loading skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">{game.icon}</div>
          <div>
            <div className="h-6 w-40 bg-bg-secondary rounded animate-pulse" />
            <div className="h-4 w-24 bg-bg-secondary rounded animate-pulse mt-2" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="h-4 w-3/4 bg-bg-secondary rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Game Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl">{game.icon}</div>
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">{game.name}</h2>
          <p className="text-text-secondary text-sm">{t(game.description)}</p>
        </div>
      </div>

      {/* Calculator */}
      <Calculator />
    </div>
  );
}
