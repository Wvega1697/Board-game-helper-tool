import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';

const PLAYER_COLORS = [
  '#a855f7', // purple
  '#2dd4bf', // teal
  '#ec4899', // pink
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#f97316', // orange
];

/**
 * Reusable player setup component.
 * @param {Object} props
 * @param {number} props.minPlayers - Minimum players required
 * @param {number} props.maxPlayers - Maximum players allowed
 * @param {function} props.onStart - Callback with player array: [{name, color}]
 * @param {React.ReactNode} [props.extraContent] - Optional extra content per player (e.g. dinosaur picker)
 * @param {function} [props.renderPlayerExtra] - Render function for extra player config: (playerIndex) => JSX
 */
export default function PlayerSetup({ minPlayers = 2, maxPlayers = 6, onStart, renderPlayerExtra }) {
  const { t } = useI18n();
  const [players, setPlayers] = useState(
    Array.from({ length: minPlayers }, (_, i) => ({
      name: '',
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    }))
  );

  const addPlayer = () => {
    if (players.length < maxPlayers) {
      setPlayers([
        ...players,
        {
          name: '',
          color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
        },
      ]);
    }
  };

  const removePlayer = (index) => {
    if (players.length > minPlayers) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updateName = (index, name) => {
    setPlayers(players.map((p, i) => (i === index ? { ...p, name } : p)));
  };

  const handleStart = () => {
    const finalPlayers = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `${t('playerPlaceholder')} ${i + 1}`,
    }));
    onStart(finalPlayers);
  };

  const canStart = players.length >= minPlayers;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-text-primary">
        {t('playerSetup')}
      </h2>

      {/* Player List */}
      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={index} className="glass-card p-4 animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center gap-3">
              {/* Color indicator */}
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg"
                style={{ backgroundColor: player.color, boxShadow: `0 0 10px ${player.color}40` }}
              />

              {/* Name input */}
              <input
                type="text"
                value={player.name}
                onChange={(e) => updateName(index, e.target.value)}
                placeholder={`${t('playerPlaceholder')} ${index + 1}`}
                className="input flex-1"
                maxLength={20}
                id={`player-name-${index}`}
              />

              {/* Remove button */}
              {players.length > minPlayers && (
                <button
                  onClick={() => removePlayer(index)}
                  className="btn-icon text-danger hover:bg-danger/10"
                  aria-label={t('removePlayer')}
                  id={`remove-player-${index}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Extra content per player (e.g., dinosaur selection) */}
            {renderPlayerExtra && (
              <div className="mt-3 pt-3 border-t border-border-glass">
                {renderPlayerExtra(index)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Player Button */}
      {players.length < maxPlayers && (
        <button
          onClick={addPlayer}
          className="btn btn-secondary w-full"
          id="btn-add-player"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('addPlayer')}
        </button>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="btn btn-primary w-full text-base mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        id="btn-start-game"
      >
        {t('startGame')}
      </button>
    </div>
  );
}

export { PLAYER_COLORS };
