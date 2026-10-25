import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import GameOverScreen from '../../components/GameOverScreen.jsx';
import { B2C_ID, calculateRoundScore, calculateTotal, checkWinner } from './rules.js';
import { realms, getRealm, getRealmScoreHint } from './data/realms.js';
import config from './config.js';

const PHASES = {
  SETUP: 'setup',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
};

const EMPTY_ROUND = { realms: [], entries: {} };

export default function RollingRealmsCalculator() {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useSessionStorage('rolling-realms-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('rolling-realms-players', []);
  const [rounds, setRounds] = useSessionStorage('rolling-realms-rounds', [EMPTY_ROUND]);
  const [roundIdx, setRoundIdx] = useSessionStorage('rolling-realms-round-idx', 0);

  const round = rounds[roundIdx] || EMPTY_ROUND;
  const usedElsewhere = new Set(rounds.flatMap((r, i) => (i === roundIdx ? [] : r.realms)));
  const roundReady = round.realms.length === config.realmsPerRound;
  const isLastRound = roundIdx === config.rounds - 1;
  const playerName = (p, i) => p.name || `${config.playerNoun?.[locale] ?? t('playerPlaceholder')} ${i + 1}`;

  // Per-player round scores, padded to config.rounds so tiebreaks always see 3 entries
  const roundScoresFor = (playerIdx) =>
    Array.from({ length: config.rounds }, (_, r) =>
      rounds[r] ? calculateRoundScore(rounds[r].realms, rounds[r].entries[playerIdx]) : 0);

  const updateRound = (patch) => setRounds(rounds.map((r, i) => (i === roundIdx ? { ...r, ...patch } : r)));

  const toggleRealm = (id) => {
    const selected = round.realms.includes(id);
    if (!selected && round.realms.length >= config.realmsPerRound) return;
    updateRound({ realms: selected ? round.realms.filter((r) => r !== id) : [...round.realms, id] });
  };

  // ponytail: sort-shuffle is slightly biased; fine for picking 3 of 11 realms
  const randomRealms = () => {
    const pool = realms.filter((r) => !usedElsewhere.has(r.id)).sort(() => Math.random() - 0.5);
    updateRound({ realms: pool.slice(0, config.realmsPerRound).map((r) => r.id) });
  };

  const updateField = (playerIdx, field, raw) => {
    const value = Math.max(0, parseInt(raw) || 0);
    updateRound({ entries: { ...round.entries, [playerIdx]: { ...round.entries[playerIdx], [field]: value } } });
  };

  const handleStart = (playerList) => {
    setPlayers(playerList);
    setRounds([EMPTY_ROUND]);
    setRoundIdx(0);
    setPhase(PHASES.PLAYING);
  };

  const nextRound = () => {
    if (isLastRound) return setPhase(PHASES.GAME_OVER);
    if (!rounds[roundIdx + 1]) setRounds([...rounds, EMPTY_ROUND]);
    setRoundIdx(roundIdx + 1);
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setRounds([EMPTY_ROUND]);
    setRoundIdx(0);
  };

  // ==================== SETUP ====================
  if (phase === PHASES.SETUP) {
    return <PlayerSetup minPlayers={config.minPlayers} maxPlayers={config.maxPlayers} onStart={handleStart} playerNoun={config.playerNoun?.[locale]} />;
  }

  // ==================== GAME OVER ====================
  if (phase === PHASES.GAME_OVER) {
    const standings = players.map((p, i) => {
      const roundScores = roundScoresFor(i);
      return { ...p, name: playerName(p, i), roundScores, totalScore: calculateTotal(roundScores) };
    });
    const winners = new Set(checkWinner(standings));
    const sorted = standings
      .map((p, i) => ({ ...p, isWinner: winners.has(i) }))
      .sort((a, b) => (b.isWinner - a.isWinner) || (b.totalScore - a.totalScore));
    return (
      <GameOverScreen
        config={config}
        players={sorted.map((p) => ({ name: p.name, score: p.totalScore, color: p.color, isWinner: p.isWinner }))}
        funStat={`${sorted.filter((p) => p.isWinner).map((p) => p.name).join(' & ')} | ${sorted[0]?.totalScore ?? 0} ★`}
        comments={sorted.map((p) => `${p.name}: ${p.roundScores.join(' / ')}`).join('\n')}
        onEditScores={() => setPhase(PHASES.PLAYING)}
        onNewGame={newGame}
      />
    );
  }

  // ==================== PLAYING ====================
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Round tabs — only rounds already reached, so earlier scores can be corrected */}
      <div className="flex gap-2">
        {rounds.map((_, i) => (
          <button
            key={i}
            onClick={() => setRoundIdx(i)}
            className={`btn flex-1 ${i === roundIdx ? 'btn-primary' : 'btn-secondary'}`}
            id={`btn-round-${i}`}
          >
            {t('round')} {i + 1}
          </button>
        ))}
      </div>

      {/* Realm picker */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            {t('rr_pickRealms')} ({round.realms.length}/{config.realmsPerRound})
          </h2>
          <button onClick={randomRealms} className="btn btn-secondary text-xs py-1.5 px-3" id="btn-random-realms">
            🎲 {t('rr_random')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {realms.map((realm) => {
            const selected = round.realms.includes(realm.id);
            const disabled = usedElsewhere.has(realm.id) || (!selected && roundReady);
            return (
              <button
                key={realm.id}
                onClick={() => toggleRealm(realm.id)}
                disabled={disabled}
                aria-pressed={selected}
                className={`btn text-xs py-1.5 px-3 disabled:opacity-30 ${selected ? 'btn-primary' : 'btn-secondary'}`}
                id={`btn-realm-${realm.id}`}
              >
                {realm.name}
              </button>
            );
          })}
        </div>
        {round.realms.map((id) => (
          <p key={id} className="text-text-muted text-[10px]">
            <span className="font-medium text-text-secondary">{getRealm(id).name}:</span> {getRealmScoreHint(getRealm(id), locale)}
          </p>
        ))}
      </div>

      {/* Per-player entry */}
      {roundReady && players.map((player, playerIdx) => {
        const entry = round.entries[playerIdx] || {};
        const roundScore = calculateRoundScore(round.realms, entry);
        const total = calculateTotal(roundScoresFor(playerIdx));
        return (
          <div key={playerIdx} className="glass-card p-5 space-y-4" id={`player-card-${playerIdx}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                <span className="font-medium">{playerName(player, playerIdx)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-muted text-xs">{t('round')}: {roundScore} ★</span>
                <span className="font-heading font-bold text-xl text-accent-purple">{total} ★</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border-glass pt-3">
              {round.realms.map((id) => (
                <div key={id}>
                  <label htmlFor={`${id}-${playerIdx}`} className="text-text-muted text-[10px] block mb-1">
                    {getRealm(id).name} {id === B2C_ID ? `(${t('rr_filledSquares')})` : '★'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={entry[id] || ''}
                    onChange={(e) => updateField(playerIdx, id, e.target.value)}
                    placeholder="0"
                    className="input text-center text-sm py-1.5"
                    id={`${id}-${playerIdx}`}
                  />
                </div>
              ))}
              <div>
                <label htmlFor={`resources-${playerIdx}`} className="text-text-muted text-[10px] block mb-1">
                  🎃❤️🪙 {t('rr_unspentResources')}
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={entry.resources || ''}
                  onChange={(e) => updateField(playerIdx, 'resources', e.target.value)}
                  placeholder="0"
                  className="input text-center text-sm py-1.5"
                  id={`resources-${playerIdx}`}
                />
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-text-muted text-[10px]">{t('rr_tiebreakHint')}</p>

      <button
        onClick={nextRound}
        disabled={!roundReady}
        className="btn btn-primary w-full text-base mt-2 disabled:opacity-50"
        id={isLastRound ? 'btn-finish-game' : 'btn-next-round'}
      >
        {isLastRound ? t('rr_showResults') : t('nextRound')}
      </button>
    </div>
  );
}
