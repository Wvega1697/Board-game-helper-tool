import { useState, useMemo, useCallback } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import ShareCard from '../../components/ShareCard.jsx';
import { guests as allGuests, themes as allThemes } from './data/cards.js';
import {
  ATTRIBUTES,
  resolveThemeTypes,
  resolveHypnotist,
  calculateRoundScore,
  checkWinner,
} from './rules.js';
import config from './config.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES = {
  SETUP: 'setup',
  PLAYING: 'playing',
  ROUND_RESULT: 'round_result',
  GAME_OVER: 'game_over',
};

const TYPE_COLORS = {
  'Family-Friendly': '#f1c314',
  Political: '#38b4e5',
  Raid: '#ef483e',
  Costume: '#a67cb8',
  gray: '#6b7280',
  dual: '#8b8b8b',
  rainbow: '#e879f9',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyPlayerArea() {
  return {
    guestCards: [], // array of guest card objects + optional declaredType
    influencerAttribute: null, // string | null
    plannerDeclaredType: null, // string | null (single planner per player for simplicity)
    // ponytail: garbage-collector / killer-clown / last-minute-invite effects
    // are represented simply by the final card list — no extra state needed.
  };
}

// Build a guest card entry enriched with a declaredType slot for dual/rainbow
function makeGuestEntry(cardId, declaredType = null) {
  const card = allGuests.find((g) => g.id === cardId);
  if (!card) return null;
  return { ...card, declaredType: declaredType || card.type };
}

// ─── Card Search Dropdown ─────────────────────────────────────────────────────

function CardSearch({ onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allGuests.filter(
      (c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="input text-sm py-2"
        id="input-card-search"
      />
      {filtered.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 glass-card border border-border-glass rounded-xl overflow-hidden shadow-xl">
          {filtered.map((card) => (
            <button
              key={card.id}
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 flex items-center gap-2 transition-colors"
              onClick={() => {
                onSelect(card.id);
                setQuery('');
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: TYPE_COLORS[card.type] || '#6b7280' }}
              />
              <span className="font-medium">{card.name}</span>
              <span className="text-text-muted text-xs ml-auto">{card.basePoints}pt</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini guest card chip ─────────────────────────────────────────────────────

function GuestChip({ card, onRemove, onDeclareType }) {
  const isDual = card.type === 'dual' && !card.isPartyPlanner;
  const needsDeclare = isDual && (!card.declaredType || card.declaredType === 'dual');
  const chipColor = TYPE_COLORS[card.declaredType || card.type] || '#6b7280';

  return (
    <div
      className="glass-card p-3 space-y-2 rounded-xl border"
      style={{ borderColor: `${chipColor}33` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: chipColor }}
        />
        <span className="text-sm font-medium flex-1 truncate">{card.name}</span>
        <span className="text-text-muted text-xs font-heading">{card.basePoints}pt</span>
        <button
          onClick={onRemove}
          className="text-text-muted hover:text-danger transition-colors text-xs ml-1"
          aria-label={`Remove ${card.name}`}
        >
          ✕
        </button>
      </div>
      {isDual && (
        <select
          value={card.declaredType || ''}
          onChange={(e) => onDeclareType(e.target.value)}
          className="input text-xs py-1"
          style={needsDeclare ? { borderColor: '#f59e0b' } : {}}
        >
          <option value="">Declare type…</option>
          {(card.effect.includes('Political') ? ['Political', 'Costume', 'Family-Friendly', 'Raid'] : ['Political', 'Costume', 'Family-Friendly', 'Raid']).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
      {card.isPartyPlanner && (
        <div className="text-xs text-accent-amber px-1">🎨 Party Planner — declare theme type via global controls above</div>
      )}
      {card.isInfluencer && (
        <div className="text-xs text-accent-purple px-1">📣 Influencer — declare attribute via player controls below</div>
      )}
      {card.effect && !card.isPartyPlanner && !card.isInfluencer && card.type === 'gray' && (
        <p className="text-xs text-text-muted leading-relaxed px-1">{card.effect.replace('</u> ', '')}</p>
      )}
    </div>
  );
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export default function WrongPartyCalculator() {
  const { t } = useI18n();

  const [phase, setPhase] = useSessionStorage('wp-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('wp-players', []);
  const [roundNum, setRoundNum] = useSessionStorage('wp-round', 1);
  const [enabledRulesArr, setEnabledRulesArr] = useSessionStorage('wp-house-rules', []);
  const enabledRules = new Set(enabledRulesArr);

  // Theme selection
  const [activeThemeId, setActiveThemeId] = useSessionStorage('wp-theme', '');
  // Per-player area data: { [playerIdx]: { guestCards, influencerAttribute, plannerDeclaredType } }
  const [areas, setAreas] = useSessionStorage('wp-areas', {});
  // Round scores stored per player
  const [roundScores, setRoundScores] = useSessionStorage('wp-round-scores', {});

  const [showShare, setShowShare] = useState(false);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState({});

  const toggleBreakdown = useCallback((idx) => {
    setExpandedBreakdowns((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const maxPlayers = enabledRules.has('morePlayers') ? 8 : config.maxPlayers;

  // Active theme object
  const activeTheme = useMemo(
    () => allThemes.find((t) => t.id === activeThemeId) || null,
    [activeThemeId]
  );

  // Collect all Party Planner declared types from all players' areas
  const plannerDeclaredTypes = useMemo(() => {
    return Object.values(areas)
      .map((a) => a?.plannerDeclaredType)
      .filter(Boolean);
  }, [areas]);

  // Resolve effective theme types
  const effectiveThemeTypes = useMemo(() => {
    if (!activeTheme) return [];
    return resolveThemeTypes(
      activeTheme.type,
      plannerDeclaredTypes,
      enabledRules.has('combinePlanners')
    );
  }, [activeTheme, plannerDeclaredTypes, enabledRules]);

  // Whether likes/dislikes are globally swapped (Hypnotist)
  const swapLikesDislikes = useMemo(() => {
    const playerAreas = Object.values(areas).map((a) => ({ guestCards: a?.guestCards || [] }));
    return resolveHypnotist(playerAreas, enabledRules.has('hypnotistStack'));
  }, [areas, enabledRules]);

  // ── Area mutations ──────────────────────────────────────────────────────────

  const patchArea = useCallback(
    (playerIdx, patch) => {
      setAreas((prev) => ({
        ...prev,
        [playerIdx]: { ...emptyPlayerArea(), ...prev[playerIdx], ...patch },
      }));
    },
    [setAreas]
  );

  const addGuest = (playerIdx, cardId) => {
    const entry = makeGuestEntry(cardId);
    if (!entry) return;
    const prev = areas[playerIdx] || emptyPlayerArea();
    patchArea(playerIdx, { guestCards: [...prev.guestCards, entry] });

    // If it's a Party Planner, prime plannerDeclaredType slot if not set yet
    if (entry.isPartyPlanner && !prev.plannerDeclaredType) {
      patchArea(playerIdx, { guestCards: [...prev.guestCards, entry], plannerDeclaredType: '' });
    }
  };

  const removeGuest = (playerIdx, guestIdx) => {
    const prev = areas[playerIdx] || emptyPlayerArea();
    const updated = prev.guestCards.filter((_, i) => i !== guestIdx);
    const hasPlanner = updated.some((g) => g.isPartyPlanner);
    const hasInfluencer = updated.some((g) => g.isInfluencer);
    patchArea(playerIdx, {
      guestCards: updated,
      plannerDeclaredType: hasPlanner ? prev.plannerDeclaredType : null,
      influencerAttribute: hasInfluencer ? prev.influencerAttribute : null,
    });
  };

  const setGuestDeclaredType = (playerIdx, guestIdx, type) => {
    const prev = areas[playerIdx] || emptyPlayerArea();
    const updated = prev.guestCards.map((g, i) =>
      i === guestIdx ? { ...g, declaredType: type } : g
    );
    patchArea(playerIdx, { guestCards: updated });
  };

  // ── Round flow ──────────────────────────────────────────────────────────────

  const handleStartGame = (playerList, selectedRules) => {
    setEnabledRulesArr([...selectedRules]);
    const gamePlayers = playerList.map((p) => ({ ...p, totalScore: 0, roundScores: [] }));
    setPlayers(gamePlayers);
    setRoundNum(1);
    setAreas({});
    setRoundScores({});
    setActiveThemeId('');
    setPhase(PHASES.PLAYING);
  };

  const finishRound = () => {
    const updatedScores = {};
    const updatedPlayers = players.map((player, i) => {
      const area = areas[i] || emptyPlayerArea();
      const { score } = calculateRoundScore({
        guestCards: area.guestCards,
        effectiveThemeTypes,
        themeAttributes: activeTheme?.attributes || [],
        swapLikesDislikes,
        influencerAttribute: area.influencerAttribute || null,
      });
      updatedScores[i] = score;
      return {
        ...player,
        totalScore: player.totalScore + score,
        roundScores: [...player.roundScores, score],
      };
    });
    setRoundScores(updatedScores);
    setPlayers(updatedPlayers);
    setPhase(PHASES.ROUND_RESULT);
  };

  const nextRound = () => {
    if (roundNum >= 3) {
      setPhase(PHASES.GAME_OVER);
    } else {
      setRoundNum(roundNum + 1);
      setAreas({});
      setRoundScores({});
      setActiveThemeId('');
      setPhase(PHASES.PLAYING);
    }
  };

  const newGame = () => {
    setPhase(PHASES.SETUP);
    setPlayers([]);
    setRoundNum(1);
    setAreas({});
    setRoundScores({});
    setActiveThemeId('');
    setShowShare(false);
  };

  // ── Derived live scores ─────────────────────────────────────────────────────

  const liveTotals = useMemo(() => {
    return players.map((_, i) => {
      const area = areas[i] || emptyPlayerArea();
      const { score } = calculateRoundScore({
        guestCards: area.guestCards,
        effectiveThemeTypes,
        themeAttributes: activeTheme?.attributes || [],
        swapLikesDislikes,
        influencerAttribute: area.influencerAttribute || null,
      });
      return score;
    });
  }, [players, areas, effectiveThemeTypes, activeTheme, swapLikesDislikes]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === PHASES.SETUP) {
    return (
      <PlayerSetup
        minPlayers={config.minPlayers}
        maxPlayers={maxPlayers}
        houseRulesConfig={config.houseRules}
        onStart={handleStartGame}
      />
    );
  }

  if (phase === PHASES.GAME_OVER) {
    const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
    const maxScore = Math.max(...players.map((p) => p.totalScore));
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-3 animate-scale-in">🎉</div>
          <h2 className="font-heading text-2xl font-bold gradient-text">{t('gameOver')}</h2>
          <p className="text-accent-amber text-lg font-bold mt-2">
            {sorted[0]?.name} {t('winner')}
          </p>
        </div>

        <div className="space-y-2">
          {sorted.map((player, i) => (
            <div
              key={i}
              className={`glass-card p-4 flex items-center gap-3 ${
                player.totalScore === maxScore ? 'border-accent-amber/30 animate-glow-pulse' : ''
              }`}
            >
              <span className="font-bold text-lg w-8 text-center">
                {player.totalScore === maxScore ? '👑' : `#${i + 1}`}
              </span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
              <span className="flex-1 font-medium">{player.name}</span>
              <span className="font-heading font-bold text-xl">{player.totalScore}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowShare(true)} className="btn btn-primary flex-1" id="btn-share-results">
            {t('shareResults')}
          </button>
          <button onClick={newGame} className="btn btn-secondary flex-1" id="btn-new-game">
            {t('playAgain')}
          </button>
        </div>

        {showShare && (
          <ShareCard
            gameName={config.name}
            gameIcon={config.icon}
            players={sorted.map((p) => ({
              name: p.name,
              score: p.totalScore,
              color: p.color,
              isWinner: p.totalScore === maxScore,
            }))}
            funStat={`${roundNum} ${t('round').toLowerCase()}${roundNum !== 1 ? 's' : ''} played`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    );
  }

  if (phase === PHASES.ROUND_RESULT) {
    const sorted = [...players]
      .map((p, i) => ({ ...p, roundScore: roundScores[i] ?? 0 }))
      .sort((a, b) => b.roundScore - a.roundScore);

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {t('round')} {roundNum} — {t('wp_roundResult')}
          </h2>
          {activeTheme && (
            <p className="text-text-muted text-sm mt-1">
              {t('wp_theme')}: <strong>{activeTheme.name}</strong>
            </p>
          )}
        </div>

        <div className="space-y-2">
          {sorted.map((player, i) => (
            <div
              key={player.name}
              className="glass-card p-4 flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-bold text-lg w-8 text-center text-text-muted">#{i + 1}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
              <span className="flex-1 font-medium">{player.name}</span>
              <div className="text-right">
                <div className="font-heading font-bold text-lg text-accent-purple">+{player.roundScore}</div>
                <div className="text-text-muted text-xs">{t('totalScore')}: {player.totalScore}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={nextRound} className="btn btn-primary w-full" id="btn-next-round">
          {t('nextRound')}
        </button>
      </div>
    );
  }

  // ── PLAYING phase ───────────────────────────────────────────────────────────

  const hasAnyPlanner = Object.values(areas).some((a) =>
    a?.guestCards?.some((g) => g.isPartyPlanner)
  );
  const totalHypnotists = Object.values(areas).reduce(
    (sum, a) => sum + (a?.guestCards?.filter((g) => g.isHypnotist).length || 0),
    0
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {t('round')} {roundNum}
        </h2>
        <span className="text-text-muted text-sm">{t('wp_targetScore')}</span>
      </div>

      {/* Scoreboard */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {players.map((player, i) => (
          <div key={i} className="glass-card px-4 py-3 flex-shrink-0 text-center min-w-[76px]">
            <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: player.color }} />
            <div className="text-xs text-text-secondary truncate max-w-[60px]">{player.name}</div>
            <div className="font-heading font-bold text-sm mt-0.5">{player.totalScore}</div>
          </div>
        ))}
      </div>

      {/* Theme selector */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎭</span>
          <span className="font-medium text-sm">{t('wp_activeTheme')}</span>
          {swapLikesDislikes && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple font-medium">
              🌀 {t('wp_hypnotistActive')} ({totalHypnotists})
            </span>
          )}
        </div>
        <select
          value={activeThemeId}
          onChange={(e) => setActiveThemeId(e.target.value)}
          className="input text-sm py-2"
          id="select-theme"
        >
          <option value="">{t('wp_selectTheme')}</option>
          {allThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} ({theme.type.join(' & ')})
            </option>
          ))}
        </select>

        {activeTheme && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted">{t('wp_themeType')}:</span>
              {effectiveThemeTypes.map((type) => (
                <span
                  key={type}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${TYPE_COLORS[type]}22`, color: TYPE_COLORS[type] }}
                >
                  {type}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted">{t('wp_themeAttributes')}:</span>
              {activeTheme.attributes.map((attr) => (
                <span key={attr} className="text-xs px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary">
                  {attr}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Party Planner global overrides */}
      {hasAnyPlanner && (
        <div className="glass-card p-4 space-y-3 border border-accent-amber/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <span className="font-medium text-sm">{t('wp_partyPlannerOverride')}</span>
          </div>
          {players.map((player, i) => {
            const area = areas[i] || emptyPlayerArea();
            const hasPlanner = area.guestCards?.some((g) => g.isPartyPlanner);
            if (!hasPlanner) return null;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                <span className="text-sm flex-shrink-0">{player.name}:</span>
                <select
                  value={area.plannerDeclaredType || ''}
                  onChange={(e) => patchArea(i, { plannerDeclaredType: e.target.value })}
                  className="input text-sm py-1 flex-1"
                  id={`select-planner-type-${i}`}
                >
                  <option value="">{t('wp_declarePlannerType')}</option>
                  {['Family-Friendly', 'Political', 'Raid', 'Costume'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {/* Player areas */}
      <div className="space-y-4">
        {players.map((player, playerIdx) => {
          const area = areas[playerIdx] || emptyPlayerArea();
          const { score: liveScore, breakdown } = calculateRoundScore({
            guestCards: area.guestCards,
            effectiveThemeTypes,
            themeAttributes: activeTheme?.attributes || [],
            swapLikesDislikes,
            influencerAttribute: area.influencerAttribute || null,
          });
          const hasInfluencer = area.guestCards?.some((g) => g.isInfluencer);
          const isExpanded = !!expandedBreakdowns[playerIdx];

          return (
            <div
              key={playerIdx}
              className="glass-card p-5 space-y-4 relative focus-within:z-10"
              id={`player-card-${playerIdx}`}
            >
              {/* Player header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {area.guestCards.length > 0 && (
                    <button
                      onClick={() => toggleBreakdown(playerIdx)}
                      className="text-[10px] uppercase tracking-wider font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                      id={`btn-toggle-breakdown-${playerIdx}`}
                    >
                      {isExpanded ? t('wp_hideDetails') : t('wp_showDetails')}
                    </button>
                  )}
                  <span className="font-heading font-bold text-accent-purple text-lg">{liveScore}</span>
                </div>
              </div>

              {/* Point Breakdown Details */}
              {isExpanded && area.guestCards.length > 0 && (
                <div className="p-3 bg-bg-secondary/40 border border-border-glass rounded-xl text-xs space-y-1.5 animate-slide-up">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('wp_bd_basePoints')}:</span>
                    <span className="font-medium">+{breakdown.basePoints}</span>
                  </div>
                  {breakdown.themeBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{t('wp_bd_themeBonus')}:</span>
                      <span className="font-medium text-accent-teal">+{breakdown.themeBonus}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('wp_bd_likesPoints')}:</span>
                    <span className={`font-medium ${breakdown.likePoints > 0 ? 'text-accent-teal' : breakdown.likePoints < 0 ? 'text-danger' : ''}`}>
                      {breakdown.likePoints > 0 ? '+' : ''}{breakdown.likePoints}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('wp_bd_dislikesPoints')}:</span>
                    <span className={`font-medium ${breakdown.dislikePoints > 0 ? 'text-accent-teal' : breakdown.dislikePoints < 0 ? 'text-danger' : ''}`}>
                      {breakdown.dislikePoints > 0 ? '+' : ''}{breakdown.dislikePoints}
                    </span>
                  </div>
                  {breakdown.typeBoostPoints > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{t('wp_bd_boosterBonus')}:</span>
                      <span className="font-medium text-accent-teal">+{breakdown.typeBoostPoints}</span>
                    </div>
                  )}
                  {breakdown.synergyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{t('wp_bd_synergyBonus')}:</span>
                      <span className="font-medium text-accent-teal">+{breakdown.synergyBonus}</span>
                    </div>
                  )}
                  {breakdown.rainbowBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{t('wp_bd_rainbowBonus')}:</span>
                      <span className="font-medium text-accent-teal">+{breakdown.rainbowBonus}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Influencer attribute picker */}
              {hasInfluencer && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted flex-shrink-0">📣 {t('wp_influencerAttr')}:</span>
                  <select
                    value={area.influencerAttribute || ''}
                    onChange={(e) => patchArea(playerIdx, { influencerAttribute: e.target.value || null })}
                    className="input text-xs py-1 flex-1"
                    id={`select-influencer-attr-${playerIdx}`}
                  >
                    <option value="">— {t('wp_selectAttribute')} —</option>
                    {ATTRIBUTES.map((attr) => (
                      <option key={attr} value={attr}>{attr}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Guest cards */}
              <div className="space-y-2">
                {(area.guestCards || []).map((card, guestIdx) => (
                  <GuestChip
                    key={guestIdx}
                    card={card}
                    onRemove={() => removeGuest(playerIdx, guestIdx)}
                    onDeclareType={(type) => setGuestDeclaredType(playerIdx, guestIdx, type)}
                  />
                ))}
              </div>

              {/* Add guest card search */}
              <CardSearch
                placeholder={t('wp_searchGuest')}
                onSelect={(cardId) => addGuest(playerIdx, cardId)}
              />
            </div>
          );
        })}
      </div>

      {/* Finish round */}
      <button
        onClick={finishRound}
        className="btn btn-primary w-full text-base"
        id="btn-finish-round"
        disabled={!activeThemeId}
      >
        {t('finishRound')}
      </button>
      {!activeThemeId && (
        <p className="text-center text-text-muted text-xs">{t('wp_selectThemeFirst')}</p>
      )}
    </div>
  );
}
