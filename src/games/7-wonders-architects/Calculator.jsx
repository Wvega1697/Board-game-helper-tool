import { useState, useCallback } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import ShareCard from '../../components/ShareCard.jsx';
import { calculateFinalScore, checkWinner } from './rules.js';
import config from './config.js';
import { wonders, getWonderName, getWonderEffect } from './data/wonders.js';

const PHASES = {
  SETUP: 'setup',
  WONDER_SELECT: 'wonder_select',
  SCORING: 'scoring',
  GAME_OVER: 'game_over',
};

// max = copies that exist in the box (Culture has 2)
const TOKENS = [
  { id: 'catPawn',   emoji: '🐱', labelKey: '7wa_catPawn',       max: 1,
    desc: { en: '+2 VP at end of game.',                                         es: '+2 PV al final de la partida.' } },
  { id: 'art',       emoji: '🏛️',  labelKey: '7wa_tokenDecor',    max: 1,
    desc: { en: '+4 VP if Wonder under construction, +6 VP if complete.',        es: '+4 PV si en construcción, +6 PV si completada.' } },
  { id: 'politics',  emoji: '🐾', labelKey: '7wa_tokenPolitics',  max: 1,
    desc: { en: '+1 VP per cat icon on your blue cards.',                        es: '+1 PV por icono de gato en cartas Azules.' } },
  { id: 'strategy',  emoji: '⚔️',  labelKey: '7wa_tokenStrategy', max: 1,
    desc: { en: '+1 VP per military victory token.',                             es: '+1 PV por marcador de victoria militar.' } },
  { id: 'education', emoji: '📗', labelKey: '7wa_tokenEducation', max: 1,
    desc: { en: '+2 VP per progress token you own.',                             es: '+2 PV por cada ficha de Progreso que tengas.' } },
  { id: 'culture',   emoji: '🎭', labelKey: '7wa_tokenCulture',   max: 2,
    desc: { en: '+4 VP for 1 token, +12 VP for both.',                          es: '+4 PV por 1 ficha, +12 PV por las dos.' } },
];

function tokenOwnerCount(tokenSelections, tokenId) {
  return Object.values(tokenSelections).filter((arr) => arr.includes(tokenId)).length;
}

/** Derive the boolean scoring fields from a player's token id array. */
function tokensToFields(tokenArr) {
  return {
    hasCatPawn:    tokenArr.includes('catPawn'),
    hasDecor:      tokenArr.includes('art'),
    hasPolitics:   tokenArr.includes('politics'),
    hasStrategy:   tokenArr.includes('strategy'),
    hasEducation:  tokenArr.includes('education'),
    cultureTokens: tokenArr.filter((t) => t === 'culture').length,
  };
}

export default function ArchitectsCalculator() {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useSessionStorage('7wa-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('7wa-players', []);
  const [wonderSelections, setWonderSelections] = useSessionStorage('7wa-wonder-selections', {});
  // { [playerIdx]: tokenId[] }
  const [tokenSelections, setTokenSelections] = useSessionStorage('7wa-token-selections', {});
  // Only numeric inputs; boolean fields are derived live from tokenSelections
  const [scoringData, setScoringData] = useSessionStorage('7wa-scoring-data', {});
  const [showShare, setShowShare] = useState(false);

  const initScoringData = useCallback((playerList) => {
    const data = {};
    playerList.forEach((_, i) => {
      data[i] = { stagesConstructed: 0, wonderPoints: 0, bluePoints: 0, blueCatIcons: 0, militaryTokens: 0, progressTokens: 0 };
    });
    return data;
  }, []);

  const handleStartSetup = (playerList) => {
    const gamePlayers = playerList.map((p) => ({ ...p, totalScore: 0 }));
    setPlayers(gamePlayers);
    setWonderSelections({});
    setTokenSelections({});
    setPhase(PHASES.WONDER_SELECT);
  };

  const selectWonder = (playerIdx, wonderId) => {
    setWonderSelections({ ...wonderSelections, [playerIdx]: wonderId });
  };

  const startScoring = () => {
    const updatedPlayers = players.map((p, i) => ({ ...p, wonderId: wonderSelections[i] }));
    setPlayers(updatedPlayers);
    const initTokens = {};
    updatedPlayers.forEach((_, i) => { initTokens[i] = []; });
    setTokenSelections(initTokens);
    setScoringData(initScoringData(updatedPlayers));
    setPhase(PHASES.SCORING);
  };

  const toggleToken = (playerIdx, tokenId, tokenMax) => {
    const current = tokenSelections[playerIdx] || [];
    const playerCount = current.filter((t) => t === tokenId).length;
    const globalCount = tokenOwnerCount(tokenSelections, tokenId);

    if (playerCount >= tokenMax) {
      // x2 → x0: drop all copies this player holds
      setTokenSelections({ ...tokenSelections, [playerIdx]: current.filter((t) => t !== tokenId) });
    } else if (globalCount < tokenMax) {
      // x0 → x1, or x1 → x2: add one
      setTokenSelections({ ...tokenSelections, [playerIdx]: [...current, tokenId] });
    } else if (playerCount > 0) {
      // Can't increment (global pool full, other player holds rest) → reset to x0
      setTokenSelections({ ...tokenSelections, [playerIdx]: current.filter((t) => t !== tokenId) });
    }
    // playerCount=0 && globalCount=max → button is disabled (isTaken), nothing happens
  };

  const updateScoringField = (playerIdx, field, value) => {
    setScoringData({ ...scoringData, [playerIdx]: { ...scoringData[playerIdx], [field]: value } });
  };

  const finishGame = () => {
    const updatedPlayers = players.map((player, i) => {
      const pd = { ...scoringData[i], ...tokensToFields(tokenSelections[i] || []) };
      const score = calculateFinalScore(pd);
      return { ...player, totalScore: score, stagesConstructed: pd.stagesConstructed || 0 };
    });
    setPlayers(updatedPlayers);
    setPhase(PHASES.GAME_OVER);
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setWonderSelections({});
    setTokenSelections({});
    setScoringData({});
    setShowShare(false);
  };

  const updatePlayerName = (idx, name) =>
    setPlayers(players.map((p, i) => (i === idx ? { ...p, name } : p)));

  // ==================== RENDER ====================

  if (phase === PHASES.SETUP) {
    return <PlayerSetup minPlayers={config.minPlayers} maxPlayers={config.maxPlayers} onStart={handleStartSetup} />;
  }

  if (phase === PHASES.WONDER_SELECT) {
    const allSelected = players.every((_, i) => wonderSelections[i]);
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="font-heading text-xl font-bold text-text-primary">{t('7wa_chooseWonder')}</h2>

        {players.map((player, playerIdx) => (
          <div key={playerIdx} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
              <span className="font-medium">{player.name || `${t('playerPlaceholder')} ${playerIdx + 1}`}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {wonders.map((wonder) => {
                const isSelected = wonderSelections[playerIdx] === wonder.id;
                const isTaken = Object.entries(wonderSelections).some(
                  ([idx, id]) => id === wonder.id && parseInt(idx) !== playerIdx
                );
                return (
                  <button
                    key={wonder.id}
                    onClick={() => !isTaken && selectWonder(playerIdx, wonder.id)}
                    disabled={isTaken}
                    className={`p-3.5 rounded-2xl text-left transition-all ${
                      isSelected ? 'border-2 shadow-lg border-accent-purple'
                      : isTaken ? 'opacity-30 cursor-not-allowed bg-bg-secondary'
                      : 'bg-bg-secondary/50 border border-border-glass hover:border-border-glass-hover'
                    }`}
                    id={`wonder-${playerIdx}-${wonder.id}`}
                  >
                    <div className="font-heading font-bold text-sm mb-1.5 text-accent-purple">{getWonderName(wonder, locale)}</div>
                    <p className="text-text-muted text-[10px] leading-snug">{getWonderEffect(wonder, locale)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={startScoring}
          disabled={!allSelected}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          id="btn-start-scoring"
        >
          {t('7wa_startScoring')}
        </button>
      </div>
    );
  }

  if (phase === PHASES.GAME_OVER) {
    const winners = checkWinner(players);
    const sortedPlayers = players
      .map((p, i) => ({ ...p, _origIdx: i }))
      .sort((a, b) => {
      const aW = winners.includes(a.name), bW = winners.includes(b.name);
      if (aW && !bW) return -1;
      if (!aW && bW) return 1;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.stagesConstructed - a.stagesConstructed;
    });
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-scale-in">🏆</div>
          <h2 className="font-heading text-2xl font-bold gradient-text">{t('gameOver')}</h2>
          <p className="text-accent-amber text-lg font-bold mt-2">{winners.join(' & ')} {t('winner')}</p>
        </div>

        <div className="space-y-2">
          {sortedPlayers.map((player, i) => {
            const isWinner = winners.includes(player.name);
            return (
              <div key={i} className={`glass-card p-4 flex items-center gap-3 ${isWinner ? 'border-accent-amber/30 animate-glow-pulse' : ''}`}>
                <span className="font-bold text-lg w-8 text-center">{isWinner ? '👑' : `#${i + 1}`}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="flex-1 font-medium">
                {player.nameWasEmpty ? (
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName(player._origIdx, e.target.value)}
                    className="input w-full text-sm py-1"
                    maxLength={20}
                    id={`edit-name-${player._origIdx}`}
                  />
                ) : player.name}
              </span>
                <div className="text-right">
                  <div className="font-heading font-bold text-xl">{player.totalScore}</div>
                  <div className="text-text-muted text-xs">{player.stagesConstructed} {t('7wa_stages')}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowShare(true)} className="btn btn-primary flex-1" id="btn-share-results">{t('shareResults')}</button>
          <button onClick={() => setPhase(PHASES.SCORING)} className="btn btn-secondary flex-1" id="btn-edit-scores">{t('editScores')}</button>
          <button onClick={newGame} className="btn btn-secondary flex-1" id="btn-new-game">{t('playAgain')}</button>
        </div>

        {showShare && (
          <ShareCard
            gameName={config.name}
            gameIcon={config.icon}
            players={sortedPlayers.map((p) => ({ name: p.name, score: p.totalScore, color: p.color, isWinner: winners.includes(p.name) }))}
            funStat={`${winners.join(' & ')} | ${Math.max(...sortedPlayers.map(p => p.stagesConstructed))} ${t('7wa_stages').toLowerCase()}`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    );
  }

  // SCORING phase
  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-text-primary">{t('7wa_calculateScores')}</h2>

      <div className="space-y-4">
        {players.map((player, playerIdx) => {
          const pd = scoringData[playerIdx];
          if (!pd) return null;

          const playerTokens = tokenSelections[playerIdx] || [];
          const derivedFields = tokensToFields(playerTokens);
          const currentScore = calculateFinalScore({ ...pd, ...derivedFields });
          const wonder = wonders.find(w => w.id === player.wonderId);

          return (
            <div key={playerIdx} className="glass-card p-5 space-y-4" id={`player-card-${playerIdx}`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <div>
                    <div className="font-medium">{player.name}</div>
                    {wonder && <div className="text-text-muted text-xs">{getWonderName(wonder, locale)}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[10px] uppercase tracking-wide">Total:</span>
                  <span className="font-heading font-bold text-xl text-accent-purple">{currentScore}</span>
                </div>
              </div>

              {/* Token picker */}
              <div className="border-t border-border-glass pt-3">
                <div className="grid grid-cols-3 gap-2">
                  {TOKENS.map((token) => {
                    const playerCount = playerTokens.filter((t) => t === token.id).length;
                    const isSelected = playerCount > 0;
                    const globalCount = tokenOwnerCount(tokenSelections, token.id);
                    const isTaken = playerCount === 0 && globalCount >= token.max;

                    return (
                      <button
                        key={token.id}
                        onClick={() => !isTaken && toggleToken(playerIdx, token.id, token.max)}
                        disabled={isTaken}
                        className={`p-2.5 rounded-xl text-left transition-all ${
                          isSelected ? 'border-2 shadow-md'
                          : isTaken ? 'opacity-30 cursor-not-allowed bg-bg-secondary'
                          : 'bg-bg-secondary/50 border border-border-glass hover:border-border-glass-hover'
                        }`}
                        style={isSelected ? { borderColor: player.color, boxShadow: `0 0 12px ${player.color}25` } : {}}
                        id={`token-${playerIdx}-${token.id}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base leading-none">{token.emoji}</span>
                          <span className="font-heading font-bold text-[11px] leading-tight">
                            {t(token.labelKey)}
                            {playerCount === 2 && <span className="ml-1 text-[9px] opacity-60">×2</span>}
                          </span>
                        </div>
                        <p className="text-text-muted text-[10px] leading-snug">{token.desc[locale] || token.desc.en}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numeric inputs */}
              <div className="grid grid-cols-2 gap-3 border-t border-border-glass pt-3">
                <div>
                  <label className="text-text-muted text-[10px] block mb-1">{t('7wa_wonderPoints')} (VP)</label>
                  <input type="number" min="0" value={pd.wonderPoints || ''} onChange={(e) => updateScoringField(playerIdx, 'wonderPoints', parseInt(e.target.value) || 0)} placeholder="0" className="input text-center text-sm py-1.5" id={`wonder-pts-${playerIdx}`} />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] block mb-1">{t('7wa_stagesConstructed')} (0-5)</label>
                  <input type="number" min="0" max="5" value={pd.stagesConstructed || ''} onChange={(e) => updateScoringField(playerIdx, 'stagesConstructed', parseInt(e.target.value) || 0)} placeholder="0" className="input text-center text-sm py-1.5" id={`stages-${playerIdx}`} />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] block mb-1">🟦 {t('7wa_bluePoints')} (VP)</label>
                  <input type="number" min="0" value={pd.bluePoints || ''} onChange={(e) => updateScoringField(playerIdx, 'bluePoints', parseInt(e.target.value) || 0)} placeholder="0" className="input text-center text-sm py-1.5" id={`blue-pts-${playerIdx}`} />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] block mb-1">🛡️ {t('7wa_militaryTokensCount')}</label>
                  <input type="number" min="0" value={pd.militaryTokens || ''} onChange={(e) => updateScoringField(playerIdx, 'militaryTokens', parseInt(e.target.value) || 0)} placeholder="0" className="input text-center text-sm py-1.5" id={`mil-count-${playerIdx}`} />
                </div>

                {/* Conditional: Politics → cat icons */}
                {derivedFields.hasPolitics && (
                  <div>
                    <label className="text-text-muted text-[10px] block mb-1">🐱 {t('7wa_blueCatIcons')}</label>
                    <input type="number" min="0" value={pd.blueCatIcons || ''} onChange={(e) => updateScoringField(playerIdx, 'blueCatIcons', parseInt(e.target.value) || 0)} placeholder="0" className="input text-center text-sm py-1.5" id={`blue-cats-${playerIdx}`} />
                  </div>
                )}
                {/* Conditional: Education → progress token count */}
                {derivedFields.hasEducation && (
                  <div>
                    <label className="text-text-muted text-[10px] block mb-1">{t('7wa_progressTokensCount')}</label>
                    <input type="number" min="0" value={pd.progressTokens || ''} onChange={(e) => updateScoringField(playerIdx, 'progressTokens', parseInt(e.target.value) || 0)} placeholder="0" className="input text-center text-sm py-1.5" id={`prog-count-${playerIdx}`} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={finishGame} className="btn btn-primary w-full text-base mt-2" id="btn-finish-game">
        {t('7wa_showResults')}
      </button>
    </div>
  );
}
