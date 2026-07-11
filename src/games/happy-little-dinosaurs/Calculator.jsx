import { useState, useMemo } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import ShareCard from '../../components/ShareCard.jsx';
import { dinosaurs, getDinosaurName, getTraitDesc } from './data/dinosaurs.js';
import { instantCards, getCardName, getCardEffect } from './data/instantCards.js';
import { hazardCards, getHazardName, getHazardEffect } from './data/hazardCards.js';
import {
  DISASTER_TYPES,
  calculateRoundScore,
  applyScoreInversion,
  checkElimination,
  advanceEscapeRoute,
  checkWin,
  determineRoundOutcome,
} from './rules.js';
import config from './config.js';

const PHASES = {
  SETUP: 'setup',
  DINO_SELECT: 'dino_select',
  PLAYING: 'playing',
  ROUND_RESULT: 'round_result',
  GAME_OVER: 'game_over',
};

const DISASTER_COLORS = {
  natural: '#22c55e',
  predator: '#ef4444',
  emotional: '#3b82f6',
  meteor: '#f59e0b',
};

const DISASTER_ICONS = {
  natural: '🌋',
  predator: '🦖',
  emotional: '💔',
  meteor: '☄️',
};

export default function HLDCalculator() {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useSessionStorage('hld-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('hld-players', []);
  const [roundNum, setRoundNum] = useSessionStorage('hld-round', 1);
  const [roundData, setRoundData] = useSessionStorage('hld-round-data', {});
  const [dinoSelections, setDinoSelections] = useSessionStorage('hld-dino-selections', {});
  // House rules: Set of enabled rule IDs, stored as array in sessionStorage
  const [enabledRulesArr, setEnabledRulesArr] = useSessionStorage('hld-house-rules', []);
  const enabledRules = new Set(enabledRulesArr);
  const [showShare, setShowShare] = useState(false);
  const [cardSearch, setCardSearch] = useState('');

  // Available (unselected) dinosaurs
  const availableDinos = useMemo(() => {
    const selected = new Set(Object.values(dinoSelections));
    return dinosaurs.filter((d) => !selected.has(d.id));
  }, [dinoSelections]);

  const handleStartSetup = (playerList, selectedRules) => {
    // selectedRules is a Set from PlayerSetup
    setEnabledRulesArr([...selectedRules]);
    const gamePlayers = playerList.map((p) => ({
      ...p,
      escapeRoute: 0,
      disasterArea: [],
      hazardCards: [],
      eliminated: false,
    }));
    setPlayers(gamePlayers);
    setDinoSelections({});
    setPhase(PHASES.DINO_SELECT);
  };

  const selectDino = (playerIdx, dinoId) => {
    setDinoSelections({ ...dinoSelections, [playerIdx]: dinoId });
  };

  const startPlaying = () => {
    // Update player colors to match dinosaur colors
    const updatedPlayers = players.map((p, i) => {
      const dino = dinosaurs.find((d) => d.id === dinoSelections[i]);
      return { ...p, color: dino?.color || p.color, dinosaurId: dinoSelections[i] };
    });
    setPlayers(updatedPlayers);
    initRound(updatedPlayers);
  };

  const initRound = (playerList) => {
    const data = {};
    playerList.forEach((p, i) => {
      if (!p.eliminated) {
        data[i] = {
          pointCard: '',
          disasterType: '',
          additionalPoints: 0,
          scoreBoosterTotal: 0,
          scoreSapperTotal: 0,
          hasStarFruit: false,
          hasRockCandy: false,
          hasScoreInversion: false,
          hasSwissShears: false,
          playedInstants: [],
        };
      }
    });
    setRoundData(data);
    setPhase(PHASES.PLAYING);
  };

  const updateRoundField = (playerIdx, field, value) => {
    setRoundData({
      ...roundData,
      [playerIdx]: { ...roundData[playerIdx], [field]: value },
    });
  };

  const toggleInstantCard = (playerIdx, cardId) => {
    const pd = roundData[playerIdx];
    const played = pd.playedInstants.includes(cardId)
      ? pd.playedInstants.filter((id) => id !== cardId)
      : [...pd.playedInstants, cardId];
    updateRoundField(playerIdx, 'playedInstants', played);
  };

  const finishRound = () => {
    const disasterType = Object.values(roundData).find((d) => d.disasterType)?.disasterType || 'natural';

    // Determine which players have Swiss Shears active (affects OTHER players)
    const swissShearsPlayers = new Set(
      players
        .map((_, i) => i)
        .filter((i) => roundData[i]?.hasSwissShears)
    );

    // Calculate scores
    let scores = players.map((player, i) => {
      if (player.eliminated || !roundData[i]) {
        return { name: player.name, score: 0, idx: i };
      }
      const pd = roundData[i];
      // Swiss Shears: if ANY other player activated it, this player's boosters/sappers are halved
      const otherHasSwissShears = [...swissShearsPlayers].some((idx) => idx !== i);
      const { score } = calculateRoundScore({
        baseCardValue: parseInt(pd.pointCard) || 0,
        dinosaurId: player.dinosaurId,
        disasterType,
        additionalPoints: pd.additionalPoints,
        scoreBoosterTotal: pd.scoreBoosterTotal,
        scoreSapperTotal: pd.scoreSapperTotal,
        hasStarFruit: pd.hasStarFruit,
        hasSwissShears: otherHasSwissShears,
        hazardModifiers: (player.hazardCards || []).map((h) => h.scoringModifier),
        hazardCardCount: (player.disasterArea || []).length,
        hasRockCandy: pd.hasRockCandy,
      });
      return { name: player.name, score, idx: i };
    });

    // Apply score inversion if any player played it
    const hasInversion = Object.values(roundData).some(
      (pd) => pd.hasScoreInversion || pd.playedInstants.includes('score-inversion') || pd.playedInstants.includes('mouth-trap')
    );
    if (hasInversion) {
      const activeScores = scores.filter((s) => !players[s.idx].eliminated);
      const inverted = applyScoreInversion(activeScores);
      scores = scores.map((s) => {
        const inv = inverted.find((i) => i.name === s.name);
        return inv ? { ...s, score: inv.score } : s;
      });
    }

    // Determine winner/loser
    const activeScores = scores.filter((s) => !players[s.idx].eliminated);
    const outcome = determineRoundOutcome(activeScores);

    // Update players
    const updatedPlayers = players.map((player, i) => {
      if (player.eliminated) return player;

      const playerScore = scores.find((s) => s.idx === i);
      let newPlayer = { ...player };

      // Winner advances: by final score (house rule) or by point card value (official)
      if (outcome.winner === player.name && playerScore) {
        const useScoreMovement = enabledRules.has('scoreBasedMovement');
        const pointsToAdd = useScoreMovement
          ? (playerScore.score || 0)
          : (parseInt(roundData[i]?.pointCard) || 0);
        newPlayer.escapeRoute = advanceEscapeRoute(
          player.escapeRoute,
          pointsToAdd,
          0,
          (player.hazardCards || []).some((h) => h.scoringModifier === 'move-back')
        );
      }

      // Everyone advances by disaster count
      newPlayer.escapeRoute = advanceEscapeRoute(
        newPlayer.escapeRoute,
        0,
        (player.disasterArea || []).length,
        false
      );

      // Slippery Slope
      if ((player.hazardCards || []).some((h) => h.scoringModifier === 'move-back')) {
        newPlayer.escapeRoute = Math.max(0, newPlayer.escapeRoute - 1);
      }

      // Loser takes disaster
      if (outcome.loser === player.name) {
        newPlayer.disasterArea = [...(player.disasterArea || []), { type: disasterType }];

        // Check elimination
        const elim = checkElimination(newPlayer.disasterArea);
        if (elim.eliminated) {
          newPlayer.eliminated = true;
        }
      }

      return newPlayer;
    });

    setPlayers(updatedPlayers);
    setRoundData({ ...roundData, _outcome: outcome, _scores: scores, _disasterType: disasterType });
    setPhase(PHASES.ROUND_RESULT);
  };

  const nextRound = () => {
    // Check win conditions
    const winner = players.find((p) => !p.eliminated && checkWin(p.escapeRoute));
    const activePlayers = players.filter((p) => !p.eliminated);

    if (winner || activePlayers.length <= 1) {
      setPhase(PHASES.GAME_OVER);
    } else {
      setRoundNum(roundNum + 1);
      initRound(players);
    }
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setRoundNum(1);
    setRoundData({});
    setDinoSelections({});
    setEnabledRulesArr([]);
    setShowShare(false);
  };

  const updatePlayerName = (idx, name) =>
    setPlayers(players.map((p, i) => (i === idx ? { ...p, name } : p)));

  // Filtered instant cards for search
  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return instantCards;
    const q = cardSearch.toLowerCase();
    return instantCards.filter(
      (c) =>
        c.nameEN.toLowerCase().includes(q) ||
        c.effectES.toLowerCase().includes(q) ||
        (c.effectEN && c.effectEN.toLowerCase().includes(q))
    );
  }, [cardSearch]);

  // ==================== RENDER ====================

  if (phase === PHASES.SETUP) {
    return (
      <PlayerSetup
        minPlayers={config.minPlayers}
        maxPlayers={config.maxPlayers}
        onStart={handleStartSetup}
        houseRulesConfig={config.houseRules}
        playerNoun={config.playerNoun?.[locale]}
      />
    );
  }

  if (phase === PHASES.DINO_SELECT) {
    const allSelected = players.every((_, i) => dinoSelections[i]);
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {t('hld_chooseDinosaur')}
        </h2>

        {players.map((player, playerIdx) => (
          <div key={playerIdx} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
              <span className="font-medium">{player.name || `${config.playerNoun?.[locale] ?? t('playerPlaceholder')} ${playerIdx + 1}`}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {dinosaurs.map((dino) => {
                const isSelected = dinoSelections[playerIdx] === dino.id;
                const isTaken = Object.entries(dinoSelections).some(
                  ([idx, id]) => id === dino.id && parseInt(idx) !== playerIdx
                );

                return (
                  <button
                    key={dino.id}
                    onClick={() => !isTaken && selectDino(playerIdx, dino.id)}
                    disabled={isTaken}
                    className={`p-3.5 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'border-2 shadow-lg'
                        : isTaken
                        ? 'opacity-30 cursor-not-allowed bg-bg-secondary'
                        : 'bg-bg-secondary/50 border border-border-glass hover:border-border-glass-hover'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: dino.color, boxShadow: `0 0 15px ${dino.color}30` }
                        : {}
                    }
                    id={`dino-${playerIdx}-${dino.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dino.color }}
                      />
                      <span className="font-heading font-bold text-sm">
                        {getDinosaurName(dino, locale)}
                      </span>
                      {dino.source === 'expansion' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-amber/15 text-accent-amber">
                          EXP
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-[10px] leading-snug">
                      {getTraitDesc(dino, locale)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={startPlaying}
          disabled={!allSelected}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          id="btn-start-playing"
        >
          {t('startGame')}
        </button>
      </div>
    );
  }

  if (phase === PHASES.GAME_OVER) {
    const activePlayers = players.filter((p) => !p.eliminated);
    const winner = activePlayers.find((p) => checkWin(p.escapeRoute)) || activePlayers[0];
    const sortedPlayers = players
      .map((p, i) => ({ ...p, _origIdx: i }))
      .sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1;
        if (!a.eliminated && b.eliminated) return -1;
        return b.escapeRoute - a.escapeRoute;
      });
    const winnerIdx = winner ? players.indexOf(winner) : -1;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-scale-in">🏆</div>
          <h2 className="font-heading text-2xl font-bold gradient-text">{t('gameOver')}</h2>
          {winner && (
            <p className="text-accent-amber text-lg font-bold mt-2">
              {t('hld_wins', { player: winner.name })}
            </p>
          )}
          <p className="text-text-secondary text-sm mt-1">
            {checkWin(winner?.escapeRoute) ? t('hld_reached50') : t('hld_lastStanding')}
          </p>
        </div>

        <div className="space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={i}
              className={`glass-card p-4 flex items-center gap-3 ${
                player._origIdx === winnerIdx ? 'border-accent-amber/30 animate-glow-pulse' : ''
              } ${player.eliminated ? 'opacity-50' : ''}`}
            >
              <span className="font-bold text-lg w-8 text-center">
                {player._origIdx === winnerIdx ? '👑' : player.eliminated ? '💀' : `#${i + 1}`}
              </span>
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
                <div className="font-heading font-bold text-xl">{player.escapeRoute}/50</div>
                <div className="text-text-muted text-xs">
                  {player.disasterArea?.length || 0} 💀
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowShare(true)} className="btn btn-primary flex-1" id="btn-share-results">
            {t('shareResults')}
          </button>
          <button onClick={() => setPhase(PHASES.ROUND_RESULT)} className="btn btn-secondary flex-1" id="btn-edit-scores">
            {t('editScores')}
          </button>
          <button onClick={newGame} className="btn btn-secondary flex-1" id="btn-new-game">
            {t('playAgain')}
          </button>
        </div>

        {showShare && (
          <ShareCard
            gameName={config.name}
            gameIcon={config.icon}
            players={sortedPlayers.map((p, i) => ({
              name: p.name,
              score: p.escapeRoute,
              color: p.color,
              isWinner: p.name === winner?.name,
            }))}
            funStat={`${roundNum} ${t('round').toLowerCase()}${roundNum !== 1 ? 's' : ''} | ${players.filter((p) => p.eliminated).length} ${t('hld_eliminated').toLowerCase()}`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    );
  }

  if (phase === PHASES.ROUND_RESULT) {
    const outcome = roundData._outcome || {};
    const scores = roundData._scores || [];
    const disasterType = roundData._disasterType || 'natural';

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {t('round')} {roundNum} — {t('hld_scoringPhase')}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span style={{ color: DISASTER_COLORS[disasterType] }}>
              {DISASTER_ICONS[disasterType]}
            </span>
            <span className="text-text-secondary text-sm">{t(`hld_${disasterType}`)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {scores.filter((s) => !players[s.idx]?.eliminated || s.score > 0).map((s, i) => {
            const player = players[s.idx];
            const isWinner = outcome.winner === s.name;
            const isLoser = outcome.loser === s.name;

            return (
              <div key={i} className={`glass-card p-4 flex items-center gap-3 animate-slide-up ${
                isWinner ? 'border-success/30' : isLoser ? 'border-danger/30' : ''
              }`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player?.color }} />
                <span className="flex-1 font-medium">{s.name}</span>
                {isWinner && <span className="text-success text-xs font-medium">🏆 {t('hld_roundWinner')}</span>}
                {isLoser && <span className="text-danger text-xs font-medium">💀 {t('hld_takesDisaster')}</span>}
                <span className="font-heading font-bold text-lg">{s.score}</span>
              </div>
            );
          })}
        </div>

        {/* Escape Route Overview */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">{t('hld_escapeRoute')}</h3>
          <div className="space-y-2">
            {players.filter((p) => !p.eliminated).map((player, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-20 truncate">{player.name}</span>
                <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(100, (player.escapeRoute / 50) * 100)}%`,
                      backgroundColor: player.color,
                      boxShadow: `0 0 8px ${player.color}60`,
                    }}
                  />
                </div>
                <span className="text-xs font-heading font-bold w-10 text-right">{player.escapeRoute}/50</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={nextRound} className="btn btn-primary w-full" id="btn-next-round">
          {t('nextRound')}
        </button>
      </div>
    );
  }

  // ==================== PLAYING PHASE ====================
  const activePlayers = players.map((p, i) => ({ ...p, idx: i })).filter((p) => !p.eliminated);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {t('round')} {roundNum}
        </h2>
      </div>

      {/* Escape Route Mini */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {players.map((player, i) => (
          <div
            key={i}
            className={`glass-card px-4 py-3 flex-shrink-0 text-center min-w-[76px] ${player.eliminated ? 'opacity-30' : ''}`}
          >
            <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: player.color }} />
            <div className="text-[10px] text-text-secondary truncate max-w-[60px]">{player.name}</div>
            <div className="font-heading font-bold text-sm mt-0.5">{player.escapeRoute}/50</div>
            {player.disasterArea?.length > 0 && (
              <div className="text-[9px] text-text-muted mt-0.5">{player.disasterArea.length}💀</div>
            )}
          </div>
        ))}
      </div>

      {/* Disaster Type Selector (once for the round) */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-2">{t('hld_disasterType')}</h3>
        <div className="grid grid-cols-4 gap-2.5">
          {DISASTER_TYPES.map((type) => {
            const isSelected = roundData[activePlayers[0]?.idx]?.disasterType === type;
            return (
              <button
                key={type}
                onClick={() => {
                  // Set disaster type for all active players
                  const updated = { ...roundData };
                  activePlayers.forEach((p) => {
                    if (updated[p.idx]) {
                      updated[p.idx] = { ...updated[p.idx], disasterType: type };
                    }
                  });
                  setRoundData(updated);
                }}
                className={`p-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'border-2 shadow-lg'
                    : 'bg-bg-secondary/50 border border-border-glass hover:border-border-glass-hover'
                }`}
                style={isSelected ? { borderColor: DISASTER_COLORS[type], boxShadow: `0 0 10px ${DISASTER_COLORS[type]}30` } : {}}
                id={`disaster-${type}`}
              >
                <div className="text-2xl mb-1">{DISASTER_ICONS[type]}</div>
                <div className="text-xs">{t(`hld_${type}`)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Player Cards */}
      {activePlayers.map((player) => {
        const pd = roundData[player.idx];
        if (!pd) return null;
        
        const disasterType = roundData[activePlayers[0]?.idx]?.disasterType || 'natural';
        const dino = dinosaurs.find((d) => d.id === player.dinosaurId);
        
        // Live score: reflect Swiss Shears from other players
        const otherHasShearsLive = activePlayers.some(
          (op) => op.idx !== player.idx && roundData[op.idx]?.hasSwissShears
        );
        const { score: currentLiveScore, traitBonus } = calculateRoundScore({
          baseCardValue: parseInt(pd.pointCard) || 0,
          dinosaurId: player.dinosaurId,
          disasterType,
          additionalPoints: pd.additionalPoints,
          scoreBoosterTotal: pd.scoreBoosterTotal,
          scoreSapperTotal: pd.scoreSapperTotal,
          hasStarFruit: pd.hasStarFruit,
          hasSwissShears: otherHasShearsLive,
          hazardModifiers: (player.hazardCards || []).map((h) => h.scoringModifier),
          hazardCardCount: (player.disasterArea || []).length,
          hasRockCandy: pd.hasRockCandy,
        });

        return (
          <div key={player.idx} className="glass-card p-5 space-y-4" id={`player-card-${player.idx}`}>
            {/* Player header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                <span className="font-medium truncate">{player.name}</span>
                {dino && (
                  <span className="text-text-muted text-xs hidden sm:inline-block truncate">
                    {getDinosaurName(dino, locale)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-text-muted text-[10px] uppercase tracking-wide whitespace-nowrap">Score:</span>
                <span className="font-heading font-bold text-xl text-accent-purple">{currentLiveScore}</span>
              </div>
            </div>

            {/* Point Card */}
            <div>
              <label className="text-text-muted text-xs mb-1.5 block">{t('hld_pointCard')} (0–9)</label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateRoundField(player.idx, 'pointCard', num.toString())}
                    className={`btn-icon text-sm font-heading font-bold ${
                      pd.pointCard === num.toString()
                        ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/40'
                        : 'hover:bg-accent-purple/10'
                    }`}
                    id={`point-${player.idx}-${num}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Trait Bonus display */}
            {traitBonus !== 0 && (
              <div className={`text-xs px-2 py-1 rounded inline-block ${
                traitBonus > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                {t('hld_traitBonus')}: {traitBonus > 0 ? '+' : ''}{traitBonus}
              </div>
            )}

            {/* Quick Modifiers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted text-[10px] mb-1.5 block">Score Booster (+2)</label>
                <input
                  type="number"
                  value={pd.scoreBoosterTotal || ''}
                  onChange={(e) => updateRoundField(player.idx, 'scoreBoosterTotal', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="input text-center text-sm py-1.5"
                  id={`booster-${player.idx}`}
                />
              </div>
              <div>
                <label className="text-text-muted text-[10px] mb-1.5 block">Score Sapper (-2)</label>
                <input
                  type="number"
                  value={pd.scoreSapperTotal || ''}
                  onChange={(e) => updateRoundField(player.idx, 'scoreSapperTotal', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="input text-center text-sm py-1.5"
                  id={`sapper-${player.idx}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={pd.hasRockCandy}
                  onChange={(e) => updateRoundField(player.idx, 'hasRockCandy', e.target.checked)}
                  className="accent-accent-purple"
                />
                Rock Candy
              </label>
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={pd.hasStarFruit}
                  onChange={(e) => updateRoundField(player.idx, 'hasStarFruit', e.target.checked)}
                  className="accent-accent-purple"
                />
                Star Fruit
              </label>
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={pd.hasScoreInversion}
                  onChange={(e) => updateRoundField(player.idx, 'hasScoreInversion', e.target.checked)}
                  className="accent-accent-purple"
                />
                Inversion
              </label>
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer" title={t('hld_swissShears')}>
                <input
                  type="checkbox"
                  checked={pd.hasSwissShears}
                  onChange={(e) => updateRoundField(player.idx, 'hasSwissShears', e.target.checked)}
                  className="accent-accent-purple"
                  id={`swiss-shears-${player.idx}`}
                />
                {t('hld_swissShears')}
              </label>
            </div>

            {/* Extra points */}
            <div>
              <label className="text-text-muted text-[10px] mb-1.5 block">
                {t('hld_instantCards')} (+/- pts)
              </label>
              <input
                type="number"
                value={pd.additionalPoints || ''}
                onChange={(e) => updateRoundField(player.idx, 'additionalPoints', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="input text-center text-sm py-1.5"
                id={`extra-${player.idx}`}
              />
            </div>
          </div>
        );
      })}

      {/* Finish Round */}
      <button
        onClick={finishRound}
        className="btn btn-primary w-full text-base"
        id="btn-finish-round"
        disabled={!activePlayers.every((p) => roundData[p.idx]?.pointCard !== '' && roundData[p.idx]?.disasterType)}
      >
        {t('finishRound')}
      </button>
    </div>
  );
}
