import { useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import ShareCard from '../../components/ShareCard.jsx';
import { calculateFinalScore, checkWinner } from './rules.js';
import config from './config.js';

const PHASES = {
  SETUP: 'setup',
  SCORING: 'scoring',
  GAME_OVER: 'game_over',
};

// Scoring fields shown per player, in rulebook tallying order
const SCORE_FIELDS = [
  { key: 'baseCardPoints',  emoji: '🃏', labelKey: 'everdell_baseCardPoints',  max: null },
  { key: 'pointTokens',     emoji: '⭐', labelKey: 'everdell_pointTokens',     max: null },
  { key: 'prosperityBonus', emoji: '💜', labelKey: 'everdell_prosperityBonus', max: null },
  { key: 'journeyPoints',   emoji: '🗺️', labelKey: 'everdell_journeyPoints',   max: 14  }, // max 4 workers × 5-pt journey each (generous cap)
  { key: 'eventPoints',     emoji: '🎪', labelKey: 'everdell_eventPoints',     max: null },
];

const EMPTY_PLAYER_DATA = {
  baseCardPoints: 0,
  pointTokens: 0,
  prosperityBonus: 0,
  journeyPoints: 0,
  eventPoints: 0,
  eventsAchieved: 0,
  leftoverResources: 0,
};

export default function EverdellCalculator() {
  const { t } = useI18n();
  const [phase, setPhase] = useSessionStorage('everdell-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('everdell-players', []);
  const [scoringData, setScoringData] = useSessionStorage('everdell-scoring-data', {});
  const [showShare, setShowShare] = useState(false);

  const handleStart = (playerList) => {
    setPlayers(playerList.map((p) => ({ ...p, totalScore: 0 })));
    const init = {};
    playerList.forEach((_, i) => { init[i] = { ...EMPTY_PLAYER_DATA }; });
    setScoringData(init);
    setPhase(PHASES.SCORING);
  };

  const updateField = (playerIdx, field, raw) => {
    const value = Math.max(0, parseInt(raw) || 0);
    setScoringData({ ...scoringData, [playerIdx]: { ...scoringData[playerIdx], [field]: value } });
  };

  const finishGame = () => {
    const updated = players.map((p, i) => {
      const d = scoringData[i] || EMPTY_PLAYER_DATA;
      return {
        ...p,
        totalScore: calculateFinalScore(d),
        eventsAchieved: d.eventsAchieved,
        leftoverResources: d.leftoverResources,
      };
    });
    setPlayers(updated);
    setPhase(PHASES.GAME_OVER);
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setScoringData({});
    setShowShare(false);
  };

  // ==================== SETUP ====================
  if (phase === PHASES.SETUP) {
    return <PlayerSetup minPlayers={config.minPlayers} maxPlayers={config.maxPlayers} onStart={handleStart} />;
  }

  // ==================== GAME OVER ====================
  if (phase === PHASES.GAME_OVER) {
    const winners = checkWinner(players);
    const sorted = [...players].sort((a, b) => {
      const aW = winners.includes(a.name), bW = winners.includes(b.name);
      if (aW && !bW) return -1;
      if (!aW && bW) return 1;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.eventsAchieved !== a.eventsAchieved) return b.eventsAchieved - a.eventsAchieved;
      return b.leftoverResources - a.leftoverResources;
    });

    const topScore = sorted[0]?.totalScore ?? 0;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-scale-in">🏆</div>
          <h2 className="font-heading text-2xl font-bold gradient-text">{t('gameOver')}</h2>
          <p className="text-accent-amber text-lg font-bold mt-2">{winners.join(' & ')} {t('winner')}</p>
        </div>

        <div className="space-y-2">
          {sorted.map((player, i) => {
            const isWinner = winners.includes(player.name);
            return (
              <div key={i} className={`glass-card p-4 flex items-center gap-3 ${isWinner ? 'border-accent-amber/30 animate-glow-pulse' : ''}`}>
                <span className="font-bold text-lg w-8 text-center">{isWinner ? '👑' : `#${i + 1}`}</span>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                <span className="flex-1 font-medium">{player.name}</span>
                <div className="text-right">
                  <div className="font-heading font-bold text-xl">{player.totalScore}</div>
                  <div className="text-text-muted text-xs">{player.eventsAchieved} {t('everdell_events')}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowShare(true)} className="btn btn-primary flex-1" id="btn-share-results">{t('shareResults')}</button>
          <button onClick={newGame} className="btn btn-secondary flex-1" id="btn-new-game">{t('playAgain')}</button>
        </div>

        {showShare && (
          <ShareCard
            gameName={config.name}
            gameIcon={config.icon}
            players={sorted.map((p) => ({ name: p.name, score: p.totalScore, color: p.color, isWinner: winners.includes(p.name) }))}
            funStat={`${winners.join(' & ')} | ${topScore} VP`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    );
  }

  // ==================== SCORING ====================
  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-text-primary">{t('everdell_calculateScores')}</h2>

      <div className="space-y-4">
        {players.map((player, playerIdx) => {
          const d = scoringData[playerIdx] || EMPTY_PLAYER_DATA;
          const total = calculateFinalScore(d);

          return (
            <div key={playerIdx} className="glass-card p-5 space-y-4" id={`player-card-${playerIdx}`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                  <span className="font-medium">{player.name || `${t('playerPlaceholder')} ${playerIdx + 1}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[10px] uppercase tracking-wide">Total:</span>
                  <span className="font-heading font-bold text-xl text-accent-purple">{total}</span>
                </div>
              </div>

              {/* Score fields */}
              <div className="grid grid-cols-2 gap-3 border-t border-border-glass pt-3">
                {SCORE_FIELDS.map(({ key, emoji, labelKey, max }) => (
                  <div key={key}>
                    <label className="text-text-muted text-[10px] block mb-1">
                      {emoji} {t(labelKey)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={max ?? undefined}
                      value={d[key] || ''}
                      onChange={(e) => updateField(playerIdx, key, e.target.value)}
                      placeholder="0"
                      className="input text-center text-sm py-1.5"
                      id={`${key}-${playerIdx}`}
                    />
                  </div>
                ))}
              </div>

              {/* Tiebreaker fields */}
              <div className="grid grid-cols-2 gap-3 border-t border-border-glass pt-3">
                <div>
                  <label className="text-text-muted text-[10px] block mb-1">🎪 {t('everdell_eventsAchieved')}</label>
                  <input
                    type="number"
                    min="0"
                    value={d.eventsAchieved || ''}
                    onChange={(e) => updateField(playerIdx, 'eventsAchieved', e.target.value)}
                    placeholder="0"
                    className="input text-center text-sm py-1.5"
                    id={`events-${playerIdx}`}
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] block mb-1">💎 {t('everdell_leftoverResources')}</label>
                  <input
                    type="number"
                    min="0"
                    value={d.leftoverResources || ''}
                    onChange={(e) => updateField(playerIdx, 'leftoverResources', e.target.value)}
                    placeholder="0"
                    className="input text-center text-sm py-1.5"
                    id={`resources-${playerIdx}`}
                  />
                </div>
              </div>
              <p className="text-text-muted text-[10px]">{t('everdell_tiebreakHint')}</p>
            </div>
          );
        })}
      </div>

      <button onClick={finishGame} className="btn btn-primary w-full text-base mt-2" id="btn-finish-game">
        {t('everdell_showResults')}
      </button>
    </div>
  );
}
