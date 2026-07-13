
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import GameOverScreen from '../../components/GameOverScreen.jsx';
import { calculateFinalScore, checkWinner, hasTie } from './rules.js';
import config from './config.js';

const PHASES = {
  SETUP: 'setup',
  SCORING: 'scoring',
  GAME_OVER: 'game_over',
};

// Landscape scoring fields only (animal cards handled separately as a list)
const SCORE_FIELDS = [
  { key: 'treePoints',     emoji: '🌲', labelKey: 'harmonies_treePoints'     },
  { key: 'mountainPoints', emoji: '⛰️', labelKey: 'harmonies_mountainPoints' },
  { key: 'fieldPoints',    emoji: '🌾', labelKey: 'harmonies_fieldPoints'    },
  { key: 'buildingPoints', emoji: '🏠', labelKey: 'harmonies_buildingPoints' },
  { key: 'riverPoints',    emoji: '💧', labelKey: 'harmonies_riverPoints'    },
];

// Tiebreaker fields — only shown when a tie exists
const TIE_FIELDS = [
  { key: 'animalCubesPlaced', emoji: '🎲', labelKey: 'harmonies_animalCubesPlaced' },
  { key: 'completedCards',    emoji: '✅', labelKey: 'harmonies_completedCards'    },
  { key: 'unplacedCubes',     emoji: '⬜', labelKey: 'harmonies_unplacedCubes'    },
];

const EMPTY_PLAYER_DATA = {
  treePoints: 0,
  mountainPoints: 0,
  fieldPoints: 0,
  buildingPoints: 0,
  riverPoints: 0,
  animalCards: [],   // array of per-card VP values
  animalCubesPlaced: 0,
  completedCards: 0,
  unplacedCubes: 0,
};

/** Sum an animal cards array into a single animalPoints number for calculateFinalScore. */
const sumAnimalCards = (cards) => (cards || []).reduce((s, v) => s + (parseInt(v) || 0), 0);

export default function HarmoniesCalculator() {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useSessionStorage('harmonies-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('harmonies-players', []);
  const [scoringData, setScoringData] = useSessionStorage('harmonies-scoring-data', {});

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

  const addAnimalCard = (playerIdx) => {
    const cards = [...(scoringData[playerIdx]?.animalCards || []), 0];
    setScoringData({ ...scoringData, [playerIdx]: { ...scoringData[playerIdx], animalCards: cards } });
  };

  const updateAnimalCard = (playerIdx, cardIdx, raw) => {
    const cards = [...(scoringData[playerIdx]?.animalCards || [])];
    cards[cardIdx] = Math.max(0, parseInt(raw) || 0);
    setScoringData({ ...scoringData, [playerIdx]: { ...scoringData[playerIdx], animalCards: cards } });
  };

  const removeAnimalCard = (playerIdx, cardIdx) => {
    const cards = (scoringData[playerIdx]?.animalCards || []).filter((_, i) => i !== cardIdx);
    setScoringData({ ...scoringData, [playerIdx]: { ...scoringData[playerIdx], animalCards: cards } });
  };

  const finishGame = () => {
    const updated = players.map((p, i) => {
      const d = scoringData[i] || EMPTY_PLAYER_DATA;
      return {
        ...p,
        totalScore: calculateFinalScore({ ...d, animalPoints: sumAnimalCards(d.animalCards) }),
        animalCubesPlaced: d.animalCubesPlaced,
        completedCards: d.completedCards,
        unplacedCubes: d.unplacedCubes,
      };
    });
    setPlayers(updated);
    setPhase(PHASES.GAME_OVER);
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setScoringData({});
  };

  const updatePlayerName = (idx, name) =>
    setPlayers(players.map((p, i) => (i === idx ? { ...p, name } : p)));

  // ==================== SETUP ====================
  if (phase === PHASES.SETUP) {
    return <PlayerSetup minPlayers={config.minPlayers} maxPlayers={config.maxPlayers} onStart={handleStart} playerNoun={config.playerNoun?.[locale]} />;
  }

  // ==================== GAME OVER ====================
  if (phase === PHASES.GAME_OVER) {
    const isTied = hasTie(players);
    const winners = checkWinner(players);
    const sorted = players
      .map((p, i) => ({ ...p, _origIdx: i }))
      .sort((a, b) => {
        const aW = winners.includes(a.name), bW = winners.includes(b.name);
        if (aW && !bW) return -1;
        if (!aW && bW) return 1;
        return b.totalScore - a.totalScore;
      });
    const topScore = sorted[0]?.totalScore ?? 0;
    const tieNote = isTied ? ` (tie)` : '';
    return (
      <GameOverScreen
        config={config}
        players={sorted.map((p) => ({ name: p.name, score: p.totalScore, color: p.color, isWinner: winners.includes(p.name) }))}
        funStat={`${winners.join(' & ')} | ${topScore} VP${tieNote}`}
        onEditScores={() => setPhase(PHASES.SCORING)}
        onNewGame={newGame}
      />
    );
  }


  // ==================== SCORING ====================
  // Detect whether any score tie exists in the current draft (live preview)
  const draftPlayers = players.map((p, i) => {
    const d = scoringData[i] || EMPTY_PLAYER_DATA;
    return { ...p, totalScore: calculateFinalScore({ ...d, animalPoints: sumAnimalCards(d.animalCards) }) };
  });
  const showTiebreakers = hasTie(draftPlayers);

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-text-primary">{t('harmonies_calculateScores')}</h2>

      {/* Scoring reference — collapsible */}
      <details className="glass-card text-sm" id="scoring-reference">
        <summary className="p-3 cursor-pointer font-semibold text-text-muted text-xs uppercase tracking-wide select-none">
          📖 {t('harmonies_scoringRef')}
        </summary>
        <div className="px-3 pb-3 space-y-1.5 border-t border-border-glass pt-2">
          {[
            { emoji: '🌲', label: t('harmonies_treePoints'),     rule: t('harmonies_ref_trees')     },
            { emoji: '⛰️', label: t('harmonies_mountainPoints'), rule: t('harmonies_ref_mountains') },
            { emoji: '🌾', label: t('harmonies_fieldPoints'),    rule: t('harmonies_ref_fields')    },
            { emoji: '🏠', label: t('harmonies_buildingPoints'), rule: t('harmonies_ref_buildings') },
            { emoji: '💧', label: t('harmonies_riverPoints'),    rule: t('harmonies_ref_rivers')    },
            { emoji: '🐾', label: t('harmonies_animalPoints'),   rule: t('harmonies_ref_animals')   },
          ].map(({ emoji, label, rule }) => (
            <div key={label} className="grid grid-cols-[6rem_1fr] gap-2 py-1.5 border-b border-border-glass last:border-0">
              <span className="text-text-muted text-[11px] font-medium">{emoji} {label}</span>
              <span className="text-text-primary text-[11px]">{rule}</span>
            </div>
          ))}
        </div>
      </details>

      <div className="space-y-4">
        {players.map((player, playerIdx) => {
          const d = scoringData[playerIdx] || EMPTY_PLAYER_DATA;
          const animalCards = d.animalCards || [];
          const total = calculateFinalScore({ ...d, animalPoints: sumAnimalCards(animalCards) });

          return (
            <div key={playerIdx} className="glass-card p-5 space-y-4" id={`player-card-${playerIdx}`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                  <span className="font-medium">{player.name || `${config.playerNoun?.[locale] ?? t('playerPlaceholder')} ${playerIdx + 1}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[10px] uppercase tracking-wide">Total:</span>
                  <span className="font-heading font-bold text-xl text-accent-purple">{total}</span>
                </div>
              </div>

              {/* Landscape score fields */}
              <div className="grid grid-cols-2 gap-3 border-t border-border-glass pt-3">
                {SCORE_FIELDS.map(({ key, emoji, labelKey }) => (
                  <div key={key}>
                    <label className="text-text-muted text-[10px] block mb-1">
                      {emoji} {t(labelKey)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={d[key] || ''}
                      onChange={(e) => updateField(playerIdx, key, e.target.value)}
                      placeholder="0"
                      className="input text-center text-sm py-1.5"
                      id={`${key}-${playerIdx}`}
                    />
                  </div>
                ))}
              </div>

              {/* Animal cards — one row per card */}
              <div className="border-t border-border-glass pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-[10px] uppercase tracking-wide">
                    🐾 {t('harmonies_animalPoints')} ({sumAnimalCards(animalCards)} pts)
                  </span>
                  <button
                    onClick={() => addAnimalCard(playerIdx)}
                    className="text-accent-purple text-xs font-semibold hover:opacity-80 transition-opacity"
                    id={`btn-add-animal-${playerIdx}`}
                  >
                    + {t('harmonies_addCard')}
                  </button>
                </div>
                {animalCards.length === 0 && (
                  <p className="text-text-muted text-[11px] italic">{t('harmonies_noCards')}</p>
                )}
                {animalCards.map((val, cardIdx) => (
                  <div key={cardIdx} className="flex items-center gap-2">
                    <span className="text-text-muted text-[11px] w-16 shrink-0">
                      {t('harmonies_cardLabel')} {cardIdx + 1}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={val || ''}
                      onChange={(e) => updateAnimalCard(playerIdx, cardIdx, e.target.value)}
                      placeholder="0"
                      className="input text-center text-sm py-1 flex-1"
                      id={`animalCard-${playerIdx}-${cardIdx}`}
                    />
                    <button
                      onClick={() => removeAnimalCard(playerIdx, cardIdx)}
                      className="text-text-muted hover:text-red-400 transition-colors text-sm leading-none"
                      id={`btn-remove-animal-${playerIdx}-${cardIdx}`}
                      aria-label="Remove card"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Tiebreaker fields — only when a tie exists */}
              {showTiebreakers && (
                <div className="border-t border-border-glass pt-3 space-y-2">
                  <p className="text-accent-amber text-[10px] uppercase tracking-wide font-semibold">
                    {t('harmonies_tiebreakTitle')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIE_FIELDS.map(({ key, emoji, labelKey }) => (
                      <div key={key}>
                        <label className="text-text-muted text-[10px] block mb-1">
                          {emoji} {t(labelKey)}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={d[key] || ''}
                          onChange={(e) => updateField(playerIdx, key, e.target.value)}
                          placeholder="0"
                          className="input text-center text-sm py-1.5"
                          id={`${key}-${playerIdx}`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-text-muted text-[10px]">{t('harmonies_tiebreakHint')}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={finishGame} className="btn btn-primary w-full text-base mt-2" id="btn-finish-game">
        {t('harmonies_showResults')}
      </button>
    </div>
  );
}
