import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { getPlayerProfiles } from '../utils/playerProfiles.js';

/**
 * Modal shown when some players lack a BGG username at log time.
 * Resolved players show as read-only with a green ✓.
 * Unresolved players get a combobox (datalist) to pick or type a BGG username.
 *
 * @param {{ name:string, color:string, score?:number, bggUsername?:string }[]} props.players
 * @param {function} props.onConfirm - called with the final players array (all bggUsername filled/empty)
 * @param {function} props.onClose
 */
export default function BggPlayerMapModal({ players, onConfirm, onClose }) {
  const { t } = useI18n();
  const profiles = getPlayerProfiles();

  // Local editable state for unresolved usernames keyed by player index
  const [usernames, setUsernames] = useState(() => {
    const init = {};
    players.forEach((p, i) => { init[i] = p.bggUsername || ''; });
    return init;
  });

  const handleSelect = (index, value) => {
    // Value may be a full "Name (bggUsername)" option — parse out bggUsername
    const match = value.match(/^.+\s\((.+)\)$/);
    setUsernames((prev) => ({ ...prev, [index]: match ? match[1] : value }));
  };

  const handleConfirm = () => {
    const resolved = players.map((p, i) => ({ ...p, bggUsername: usernames[i] || '' }));
    onConfirm(resolved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-sm p-5 space-y-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-text-primary">🎲 {t('bggLinkPlayers')}</h3>
          <button onClick={onClose} className="btn-icon text-text-muted hover:text-danger" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Player list */}
        <div className="space-y-3">
          {players.map((player, i) => {
            const isResolved = Boolean(player.bggUsername);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                <span className="text-sm font-medium text-text-primary w-24 truncate flex-shrink-0">{player.name}</span>
                {isResolved ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-accent-teal text-xs font-bold">✓</span>
                    <span className="text-text-secondary text-sm">{player.bggUsername}</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={usernames[i]}
                      onChange={(e) => handleSelect(i, e.target.value)}
                      placeholder={t('bggUnresolved')}
                      className="input flex-1 text-sm"
                      list="bgg-map-profiles"
                      id={`bgg-map-input-${i}`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Shared datalist for all unresolved inputs */}
        <datalist id="bgg-map-profiles">
          {profiles.map((p) => (
            <option key={p.bggUsername} value={`${p.name} (${p.bggUsername})`} />
          ))}
        </datalist>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn btn-secondary flex-1" id="btn-bgg-map-cancel">
            {t('cancel')}
          </button>
          <button onClick={handleConfirm} className="btn btn-primary flex-1" id="btn-bgg-map-confirm">
            BGG →
          </button>
        </div>
      </div>
    </div>
  );
}
