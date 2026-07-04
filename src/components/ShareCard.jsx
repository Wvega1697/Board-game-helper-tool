import { useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { captureAndShare } from '../utils/share.js';

/**
 * ShareCard — renders a styled score summary and allows sharing/downloading as an image.
 * @param {Object} props
 * @param {string} props.gameName - Name of the game
 * @param {string} props.gameIcon - Emoji icon for the game
 * @param {Array} props.players - Array of { name, score, color, isWinner, extras }
 * @param {string} [props.funStat] - Optional fun stat to display
 * @param {function} [props.onClose] - Close handler
 */
export default function ShareCard({ gameName, gameIcon, players, funStat, onClose }) {
  const { t } = useI18n();
  const cardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      await captureAndShare(cardRef.current, {
        fileName: `${gameName.toLowerCase().replace(/\s+/g, '-')}-results.png`,
        title: t('shareTitle', { game: gameName }),
        text: t('shareText', { game: gameName }),
      });
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm animate-scale-in">
        {/* The capturable card */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1a1a2e 0%, #0f0f1a 50%, #16213e 100%)',
            padding: '24px',
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">{gameIcon}</div>
            <h2 className="font-heading text-2xl font-bold gradient-text mb-1">
              {t('gameOver')}
            </h2>
            <p className="text-text-secondary text-sm">{gameName}</p>
            <p className="text-text-muted text-xs mt-1">{t('datePlayed')} {dateStr}</p>
          </div>

          {/* Rankings */}
          <div className="space-y-2 mb-5">
            {sortedPlayers.map((player, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  index === 0
                    ? 'bg-gradient-to-r from-accent-amber/20 to-transparent border border-accent-amber/30'
                    : 'bg-white/5'
                }`}
              >
                {/* Rank */}
                <span className={`text-lg font-bold w-7 text-center ${
                  index === 0 ? 'text-accent-amber' : 'text-text-muted'
                }`}>
                  {index === 0 ? '👑' : `#${index + 1}`}
                </span>

                {/* Color dot + Name */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                />
                <span className={`flex-1 font-medium truncate ${
                  index === 0 ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {player.name}
                </span>

                {/* Score */}
                <span className={`font-heading font-bold text-lg ${
                  index === 0 ? 'text-accent-amber' : 'text-text-primary'
                }`}>
                  {player.score}
                </span>
              </div>
            ))}
          </div>

          {/* Fun stat */}
          {funStat && (
            <div className="text-center text-text-muted text-xs italic border-t border-border-glass pt-3">
              {funStat}
            </div>
          )}

          {/* Branding */}
          <div className="text-center mt-4 text-text-muted/50 text-[10px]">
            🎲 Boardgame Helper
          </div>
        </div>

        {/* Action Buttons (outside the card so they aren't captured) */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="btn btn-primary flex-1 disabled:opacity-50"
            id="btn-share"
          >
            {isSharing ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
            {t('share')}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary"
              id="btn-close-share"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
