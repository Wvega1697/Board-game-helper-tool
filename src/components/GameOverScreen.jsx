import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { useBgg } from '../hooks/BggContext.jsx';
import { decryptCredentials } from '../utils/bggCredentials.js';
import { getStoredUsername } from '../utils/bggConfig.js';
import { findBggUsername, savePlayerProfile } from '../utils/playerProfiles.js';
import { showToast } from './Toast.jsx';
import ShareCard from './ShareCard.jsx';
import PinPromptModal from './PinPromptModal.jsx';
import BggPlayerMapModal from './BggPlayerMapModal.jsx';

/**
 * Shared game-over screen used by all calculators.
 *
 * @param {object} props
 * @param {object} props.config - game config: { name, icon, bggId }
 * @param {Array<{name:string, score:number, color:string, isWinner:boolean}>} props.players - sorted descending by score
 * @param {string} [props.funStat] - optional one-liner shown in ShareCard
 * @param {string} [props.comments] - score breakdown for BGG comments field
 * @param {function} props.onEditScores - go back to edit
 * @param {function} props.onNewGame - start fresh
 */
export default function GameOverScreen({ config, players, funStat, comments, onEditScores, onNewGame }) {
  const { t } = useI18n();
  const { isLoggedIn, isLoggingIn, isLogging, login, logPlay, getCachedPin, cachePin, clearCachedPin } = useBgg();
  const [showShare, setShowShare] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  // resolvedPlayers: players with bggUsername filled where possible
  const [resolvedPlayers, setResolvedPlayers] = useState(null);

  const hasCreds = Boolean(getStoredUsername());

  // Build play data from current game state — uses resolvedPlayers for bggUsername
  const buildPlayData = (playersWithUsernames) => {
    let rank = 1;
    const ranks = playersWithUsernames.map((p, i, arr) => {
      if (i > 0 && arr[i - 1].score !== p.score) rank = i + 1;
      return rank;
    });
    return {
      bggId: config.bggId,
      playDate: new Date().toISOString().slice(0, 10),
      quantity: 1,
      comments: comments || '',
      players: playersWithUsernames.map((p, i) => ({
        name: p.name,
        username: p.bggUsername || '',
        score: p.score,
        win: p.isWinner,
        position: String(ranks[i]),
      })),
    };
  };

  const doLogPlay = async (pin, playersWithUsernames) => {
    try {
      await logPlay(pin, buildPlayData(playersWithUsernames));
      // Auto-save new name→bggUsername mappings
      playersWithUsernames.forEach((p) => {
        if (p.bggUsername) savePlayerProfile(p.name, p.bggUsername);
      });
      showToast(t('bggPlayLogged'), 'success');
    } catch (err) {
      clearCachedPin();
      setShowPinPrompt(true);
      showToast(`${t('bggPlayError')}: ${err.message}`, 'error');
    }
  };

  const handleLogToBgg = async () => {
    if (!config.bggId) {
      showToast(t('bggNoGameId'), 'error');
      return;
    }
    if (!hasCreds) {
      showToast(t('bggNotConfigured'), 'info');
      return;
    }

    // Resolve BGG usernames from saved profiles
    const withUsernames = players.map((p) => ({
      ...p,
      bggUsername: findBggUsername(p.name) || '',
    }));

    const allResolved = withUsernames.every((p) => p.bggUsername);
    if (!allResolved) {
      // Show mapping modal for unresolved players
      setResolvedPlayers(withUsernames);
      setShowMapModal(true);
      return;
    }

    // All resolved — proceed directly
    setResolvedPlayers(withUsernames);
    const cached = getCachedPin();
    if (cached) {
      await doLogPlay(cached, withUsernames);
      return;
    }
    setShowPinPrompt(true);
  };

  const handlePinSubmit = async (pin) => {
    setPinError('');
    const creds = await decryptCredentials(pin);
    if (!creds) {
      setPinError(t('bggPinError'));
      return;
    }
    setShowPinPrompt(false);
    try {
      await login(creds.username, creds.password, pin);
      cachePin(pin);
      await doLogPlay(pin, resolvedPlayers || players);
    } catch (err) {
      showToast(`${t('bggLoginError')}: ${err.message}`, 'error');
    }
  };

  const handleMapConfirm = async (finalPlayers) => {
    setShowMapModal(false);
    setResolvedPlayers(finalPlayers);
    const cached = getCachedPin();
    if (cached) {
      await doLogPlay(cached, finalPlayers);
      return;
    }
    setShowPinPrompt(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-2">{config.icon}</div>
        <h2 className="font-heading text-2xl font-bold text-text-primary">{t('gameOver')}</h2>
        <p className="text-text-secondary text-sm">{config.name}</p>
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {players.map((player, index) => (
          <div
            key={index}
            className={`glass-card p-4 flex items-center gap-3 animate-slide-up ${
              index === 0 ? 'border border-accent-amber/30 bg-accent-amber/5' : ''
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className={`text-lg font-bold w-8 text-center flex-shrink-0 ${
              index === 0 ? 'text-accent-amber' : 'text-text-muted'
            }`}>
              {index === 0 ? '👑' : `#${index + 1}`}
            </span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: player.color }}
            />
            <span className={`flex-1 font-medium truncate ${
              index === 0 ? 'text-text-primary' : 'text-text-secondary'
            }`}>
              {player.name}
            </span>
            <span className={`font-heading font-bold text-xl flex-shrink-0 ${
              index === 0 ? 'text-accent-amber' : 'text-text-primary'
            }`}>
              {player.score}
            </span>
          </div>
        ))}
      </div>

      {/* Primary actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowShare(true)}
          className="btn btn-primary flex-1"
          id="btn-share-results"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {t('shareResults')}
        </button>

        {config.bggId && (
          <button
            onClick={handleLogToBgg}
            disabled={isLoggingIn || isLogging}
            className="btn btn-secondary flex-1 disabled:opacity-50"
            id="btn-log-to-bgg"
            title={!hasCreds ? t('bggNotConfigured') : t('logToBgg')}
          >
            {isLoggingIn || isLogging ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span className="text-base">🎲</span>
            )}
            BGG
          </button>
        )}
      </div>

      {/* Secondary actions */}
      <div className="flex gap-3">
        <button onClick={onNewGame} className="btn btn-secondary flex-1" id="btn-new-game">
          {t('playAgain')}
        </button>
        {onEditScores && (
          <button onClick={onEditScores} className="btn btn-secondary flex-1" id="btn-edit-scores">
            {t('editScores')}
          </button>
        )}
      </div>

      {/* PIN prompt modal */}
      <PinPromptModal
        open={showPinPrompt}
        onSubmit={handlePinSubmit}
        onClose={() => { setShowPinPrompt(false); setPinError(''); }}
        error={pinError}
      />

      {/* BGG player mapping modal — shown when some players have no saved profile */}
      {showMapModal && resolvedPlayers && (
        <BggPlayerMapModal
          players={resolvedPlayers}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMapModal(false)}
        />
      )}

      {/* Share card modal */}
      {showShare && (
        <ShareCard
          gameName={config.name}
          gameIcon={config.icon}
          players={players}
          funStat={funStat}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
