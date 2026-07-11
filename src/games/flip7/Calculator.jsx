import { useState, useCallback } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import ShareCard from '../../components/ShareCard.jsx';
import { calculateRoundScore, checkBust, checkWinner } from './rules.js';
import config from './config.js';

const PHASES = {
  SETUP: 'setup',
  PLAYING: 'playing',
  ROUND_RESULT: 'round_result',
  GAME_OVER: 'game_over',
};

export default function Flip7Calculator() {
  const { t } = useI18n();
  const [phase, setPhase] = useSessionStorage('flip7-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('flip7-players', []);
  const [roundNum, setRoundNum] = useSessionStorage('flip7-round', 1);
  const [roundData, setRoundData] = useSessionStorage('flip7-round-data', {});
  const [showShare, setShowShare] = useState(false);

  // Initialize round data for all players
  const initRoundData = useCallback((playerList) => {
    const data = {};
    playerList.forEach((_, i) => {
      data[i] = {
        numberCards: [],
        multiplierCount: 0,
        modifierTotal: 0,
        isBust: false,
        isStaying: false,
      };
    });
    return data;
  }, []);

  // PlayerSetup passes (players, enabledRules) — Flip7 has no house rules, ignore second arg
  const handleStartGame = (playerList) => {
    const gamePlayers = playerList.map((p) => ({
      ...p,
      totalScore: 0,
      roundScores: [],
    }));
    setPlayers(gamePlayers);
    setRoundNum(1);
    setRoundData(initRoundData(gamePlayers));
    setPhase(PHASES.PLAYING);
  };

  const addNumberCard = (playerIdx, value) => {
    const pd = { ...roundData[playerIdx] };
    const newCards = [...pd.numberCards, value];

    // Check for bust
    if (checkBust(newCards)) {
      pd.numberCards = newCards;
      pd.isBust = true;
      setRoundData({ ...roundData, [playerIdx]: pd });
      return;
    }

    pd.numberCards = newCards;

    // Auto-stay if 7 unique cards
    if (new Set(newCards).size >= 7) {
      pd.isStaying = true;
    }

    setRoundData({ ...roundData, [playerIdx]: pd });
  };

  const removeLastCard = (playerIdx) => {
    const pd = { ...roundData[playerIdx] };
    if (pd.numberCards.length === 0) return;
    pd.numberCards = pd.numberCards.slice(0, -1);
    pd.isBust = false; // Reset bust if undoing
    pd.isStaying = false;
    setRoundData({ ...roundData, [playerIdx]: pd });
  };

  const toggleMultiplier = (playerIdx) => {
    const pd = { ...roundData[playerIdx] };
    pd.multiplierCount = pd.multiplierCount >= 2 ? 0 : pd.multiplierCount + 1;
    setRoundData({ ...roundData, [playerIdx]: pd });
  };

  const updateModifier = (playerIdx, value) => {
    const pd = { ...roundData[playerIdx] };
    pd.modifierTotal = parseInt(value) || 0;
    setRoundData({ ...roundData, [playerIdx]: pd });
  };

  const stayPlayer = (playerIdx) => {
    const pd = { ...roundData[playerIdx] };
    pd.isStaying = true;
    setRoundData({ ...roundData, [playerIdx]: pd });
  };

  const finishRound = () => {
    const updatedPlayers = players.map((player, i) => {
      const pd = roundData[i];
      const { score } = calculateRoundScore(pd);
      return {
        ...player,
        totalScore: player.totalScore + score,
        roundScores: [...player.roundScores, score],
      };
    });

    setPlayers(updatedPlayers);
    setPhase(PHASES.ROUND_RESULT);
  };

  const nextRound = () => {
    const result = checkWinner(
      players.map((p) => ({ name: p.name, totalScore: p.totalScore })),
      config.targetScore
    );

    if (result.isOver) {
      setPhase(PHASES.GAME_OVER);
    } else {
      setRoundNum(roundNum + 1);
      setRoundData(initRoundData(players));
      setPhase(PHASES.PLAYING);
    }
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setRoundNum(1);
    setRoundData({});
    setShowShare(false);
  };

  // Undo finishRound: strip the last baked round score so players can re-enter
  const backToPlaying = () => {
    setPlayers(players.map((p) => ({
      ...p,
      totalScore: p.totalScore - (p.roundScores.at(-1) ?? 0),
      roundScores: p.roundScores.slice(0, -1),
    })));
    setPhase(PHASES.PLAYING);
  };

  const updatePlayerName = (idx, name) =>
    setPlayers(players.map((p, i) => (i === idx ? { ...p, name } : p)));

  const allDone = players.every((_, i) => {
    const pd = roundData[i];
    return pd?.isBust || pd?.isStaying;
  });

  // ==================== RENDER ====================

  if (phase === PHASES.SETUP) {
    return (
      <PlayerSetup
        minPlayers={config.minPlayers}
        maxPlayers={config.maxPlayers}
        onStart={handleStartGame}
      />
    );
  }

  if (phase === PHASES.GAME_OVER) {
    const sortedPlayers = players
      .map((p, i) => ({ ...p, _origIdx: i }))
      .sort((a, b) => b.totalScore - a.totalScore);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-scale-in">🏆</div>
          <h2 className="font-heading text-2xl font-bold gradient-text">{t('gameOver')}</h2>
          <p className="text-accent-amber text-lg font-bold mt-2">{sortedPlayers[0]?.name} {t('winner')}</p>
        </div>

        {/* Final Standings */}
        <div className="space-y-2">
          {sortedPlayers.map((player, i) => (
            <div key={i} className={`glass-card p-4 flex items-center gap-3 ${i === 0 ? 'border-accent-amber/30 animate-glow-pulse' : ''}`}>
              <span className="font-bold text-lg w-8 text-center">
                {i === 0 ? '👑' : `#${i + 1}`}
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
              <span className="font-heading font-bold text-xl">{player.totalScore}</span>
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
              score: p.totalScore,
              color: p.color,
              isWinner: i === 0,
            }))}
            funStat={`${roundNum} ${t('round').toLowerCase()}${roundNum !== 1 ? 's' : ''} | ${t('flip7_targetScore', { target: config.targetScore })}`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    );
  }

  if (phase === PHASES.ROUND_RESULT) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {t('round')} {roundNum} — {t('flip7_roundScore')}
          </h2>
        </div>

        <div className="space-y-2">
          {players.map((player, i) => {
            const pd = roundData[i];
            const { score, hasBonus } = calculateRoundScore(pd);
            return (
              <div key={i} className="glass-card p-4 flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="flex-1 font-medium">{player.name}</span>
                {pd.isBust && (
                  <span className="text-danger text-sm font-medium px-2 py-0.5 rounded bg-danger/10">
                    {t('flip7_bust')}
                  </span>
                )}
                {hasBonus && (
                  <span className="text-accent-amber text-xs font-medium px-2 py-0.5 rounded bg-accent-amber/10">
                    +15 bonus
                  </span>
                )}
                <div className="text-right">
                  <div className="font-heading font-bold text-lg" style={{ animation: 'count-up 0.5s ease-out' }}>
                    +{score}
                  </div>
                  <div className="text-text-muted text-xs">
                    Total: {player.totalScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={backToPlaying} className="btn btn-secondary w-full" id="btn-edit-scores">
          {t('editScores')}
        </button>
        <button onClick={nextRound} className="btn btn-primary w-full" id="btn-next-round">
          {t('nextRound')}
        </button>
      </div>
    );
  }

  // PLAYING phase
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {t('round')} {roundNum}
        </h2>
        <span className="text-text-muted text-sm">
          {t('flip7_targetScore', { target: config.targetScore })}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {players.map((player, i) => (
          <div
            key={i}
            className="glass-card px-4 py-3 flex-shrink-0 text-center min-w-[76px]"
          >
            <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: player.color }} />
            <div className="text-xs text-text-secondary truncate max-w-[60px]">{player.name}</div>
            <div className="font-heading font-bold text-sm mt-0.5">{player.totalScore}</div>
          </div>
        ))}
      </div>

      {/* Player Cards */}
      <div className="space-y-4">
        {players.map((player, playerIdx) => {
          const pd = roundData[playerIdx];
          if (!pd) return null;
          const { score } = calculateRoundScore(pd);
          const isDone = pd.isBust || pd.isStaying;

          return (
            <div
              key={playerIdx}
              className={`glass-card p-5 space-y-4 transition-opacity ${isDone ? 'opacity-60' : ''}`}
              id={`player-card-${playerIdx}`}
            >
              {/* Player Name + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {pd.isBust && (
                    <span className="text-danger text-sm font-bold">{t('flip7_bust')}</span>
                  )}
                  {pd.isStaying && !pd.isBust && (
                    <span className="text-accent-teal text-sm font-medium">{t('flip7_stay')}</span>
                  )}
                  <span className="font-heading font-bold text-accent-purple">{score}</span>
                </div>
              </div>

              {/* Cards display */}
              {pd.numberCards.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pd.numberCards.map((card, ci) => (
                    <span
                      key={ci}
                      className="w-9 h-12 rounded-lg bg-bg-secondary border border-border-glass flex items-center justify-center font-heading font-bold text-sm"
                    >
                      {card}
                    </span>
                  ))}
                  {pd.multiplierCount > 0 && (
                    <span className="w-9 h-12 rounded-lg bg-accent-amber/20 border border-accent-amber/30 flex items-center justify-center font-heading font-bold text-xs text-accent-amber">
                      x{Math.pow(2, pd.multiplierCount)}
                    </span>
                  )}
                </div>
              )}

              {/* Controls */}
              {!isDone && (
                <div className="space-y-3">
                  {/* Number buttons */}
                  <div>
                    <div className="text-text-muted text-xs mb-1.5">{t('flip7_numberCards')}</div>
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => addNumberCard(playerIdx, num)}
                          className="btn-icon text-sm font-heading font-bold hover:bg-accent-purple/20 hover:text-accent-purple"
                          id={`btn-card-${playerIdx}-${num}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modifiers row */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMultiplier(playerIdx)}
                      className={`btn text-xs flex-1 ${
                        pd.multiplierCount > 0
                          ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                          : 'btn-secondary'
                      }`}
                      id={`btn-multiplier-${playerIdx}`}
                    >
                      x2 {pd.multiplierCount > 0 ? `(×${pd.multiplierCount})` : ''}
                    </button>

                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-text-muted text-xs">+</span>
                      <input
                        type="number"
                        value={pd.modifierTotal || ''}
                        onChange={(e) => updateModifier(playerIdx, e.target.value)}
                        placeholder="0"
                        className="input text-center text-sm py-1.5"
                        id={`input-modifier-${playerIdx}`}
                      />
                    </div>

                    <button
                      onClick={() => removeLastCard(playerIdx)}
                      className="btn-icon text-text-muted hover:text-danger"
                      aria-label="Undo"
                      id={`btn-undo-${playerIdx}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                      </svg>
                    </button>
                  </div>

                  {/* Stay button */}
                  <button
                    onClick={() => stayPlayer(playerIdx)}
                    className="btn btn-secondary w-full text-accent-teal"
                    id={`btn-stay-${playerIdx}`}
                  >
                    {t('flip7_stay')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish Round */}
      {allDone && (
        <button
          onClick={finishRound}
          className="btn btn-primary w-full text-base animate-scale-in"
          id="btn-finish-round"
        >
          {t('finishRound')}
        </button>
      )}
    </div>
  );
}
