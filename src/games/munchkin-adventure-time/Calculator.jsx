import { useState, useMemo } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import GameOverScreen from '../../components/GameOverScreen.jsx';
import { characters, getCharacterName, getCharacterPower } from './data/characters.js';
import { applyLevelDelta, checkWinner, calculateCombat } from './rules.js';
import config from './config.js';

const PHASES = {
  SETUP: 'setup',
  CHARACTER_SELECT: 'character_select',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
};

const CLASSES = ['human', 'hero', 'musician', 'royalty', 'wizard'];
const CLASS_LABEL = { human: 'Human', hero: 'Hero', musician: 'Musician', royalty: 'Royalty', wizard: 'Wizard' };
const CLASS_COLOR = {
  human: 'text-text-secondary border-border-glass bg-bg-secondary/50',
  hero: 'text-[#ca8a04] border-[#ca8a04]/30 bg-[#ca8a04]/10',
  musician: 'text-green-400 border-green-400/30 bg-green-400/10',
  royalty: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  wizard: 'text-[#f87171] border-[#5c1212]/60 bg-[#5c1212]/40',
};
const GENDER_ICON = { male: '♂', female: '♀' };

function cycleClass(current, otherClass = null) {
  let idx = (CLASSES.indexOf(current) + 1) % CLASSES.length;
  if (otherClass && CLASSES[idx] === otherClass) idx = (idx + 1) % CLASSES.length;
  return CLASSES[idx];
}

function initBattle(playerIdx) {
  return { playerIdx, equipment: 0, modifiers: 0, helperIdx: null, helperEquipment: 0, monsters: [{ level: 0, modifiers: 0 }], levelsGained: 1, levelsLost: 0, showBadStuff: false };
}

export default function MunchkinCalculator() {
  const { t, locale } = useI18n();
  const maxPlayers = characters.length;

  const [phase, setPhase] = useSessionStorage('munchkin-phase', PHASES.SETUP);
  const [players, setPlayers] = useSessionStorage('munchkin-players', []);
  const [charSelections, setCharSelections] = useSessionStorage('munchkin-char-selections', {});
  const [battle, setBattle] = useState(null);
  const [openSetLevel, setOpenSetLevel] = useState(null);
  const [setLevelInputs, setSetLevelInputs] = useState({});

  const handleStartSetup = (playerList) => {
    setPlayers(playerList.map((p) => ({ ...p, level: 1, class1: 'human', class2: null, isSuperMunchkin: false, characterId: null, gender: null })));
    setCharSelections({});
    setPhase(PHASES.CHARACTER_SELECT);
  };

  const selectChar = (playerIdx, characterId) => {
    const char = characters.find((c) => c.id === characterId);
    const gender = char?.noGender ? null : (charSelections[playerIdx]?.gender ?? 'male');
    setCharSelections({ ...charSelections, [playerIdx]: { characterId, gender } });
  };

  const selectGender = (playerIdx, gender) => {
    const sel = charSelections[playerIdx];
    if (sel?.characterId) setCharSelections({ ...charSelections, [playerIdx]: { ...sel, gender } });
  };

  const startPlaying = () => {
    setPlayers(players.map((p, i) => { const sel = charSelections[i] || {}; return { ...p, characterId: sel.characterId, gender: sel.gender ?? null }; }));
    setPhase(PHASES.PLAYING);
  };

  const updatePlayer = (idx, updates) => setPlayers(players.map((p, i) => (i === idx ? { ...p, ...updates } : p)));

  const applyDelta = (playerIdx, delta, source) => {
    const currentLvl = players[playerIdx].level;
    const newLevel = applyLevelDelta(currentLvl, delta);
    if (currentLvl === 9 && newLevel >= 10) {
      const char = characters.find((c) => c.id === players[playerIdx].characterId);
      const charName = getCharacterName(char, players[playerIdx].gender, locale) || players[playerIdx].name;
      if (!window.confirm(t('munchkin_confirmWin', { player: charName }))) {
        return;
      }
    }
    const updated = players.map((p, i) => (i === playerIdx ? { ...p, level: newLevel } : p));
    setPlayers(updated);
    if (source === 'kill') {
      const result = checkWinner(updated.map((p) => ({ name: p.name, level: p.level })), config.targetLevel, 'kill');
      if (result.isOver) setPhase(PHASES.GAME_OVER);
    }
  };

  const confirmSetLevel = (playerIdx) => {
    const val = parseInt(setLevelInputs[playerIdx]);
    if (!isNaN(val)) {
      const targetLvl = Math.max(1, Math.min(9, val));
      updatePlayer(playerIdx, { level: targetLvl });
    }
    setOpenSetLevel(null);
    setSetLevelInputs((prev) => { const n = { ...prev }; delete n[playerIdx]; return n; });
  };

  const toggleGender = (playerIdx) => {
    const p = players[playerIdx];
    const char = characters.find((c) => c.id === p.characterId);
    if (!char || char.noGender) return;
    updatePlayer(playerIdx, { gender: p.gender === 'male' ? 'female' : 'male' });
  };

  const toggleClass1 = (playerIdx) => {
    const p = players[playerIdx];
    updatePlayer(playerIdx, { class1: cycleClass(p.class1, p.class2) });
  };

  const toggleClass2 = (playerIdx) => {
    const p = players[playerIdx];
    updatePlayer(playerIdx, { class2: cycleClass(p.class2 ?? 'human', p.class1) });
  };

  const toggleSuperMunchkin = (playerIdx) => {
    const p = players[playerIdx];
    const next = !p.isSuperMunchkin;
    updatePlayer(playerIdx, { isSuperMunchkin: next, class2: next ? cycleClass('human', p.class1) : null });
  };

  const openBattleFor = (playerIdx) => { setOpenSetLevel(null); setBattle(initBattle(playerIdx)); };
  const cancelBattle = () => setBattle(null);
  const updateBattle = (updates) => setBattle((b) => ({ ...b, ...updates }));
  const updateBattleMonster = (mi, updates) => setBattle((b) => ({ ...b, monsters: b.monsters.map((m, i) => (i === mi ? { ...m, ...updates } : m)) }));
  const addMonster = () => setBattle((b) => ({ ...b, monsters: [...b.monsters, { level: 0, modifiers: 0 }] }));

  const applyBattleReward = () => {
    const { playerIdx, levelsGained } = battle;
    const currentLvl = players[playerIdx].level;
    const newLevel = applyLevelDelta(currentLvl, levelsGained);
    if (currentLvl === 9 && newLevel >= 10) {
      const char = characters.find((c) => c.id === players[playerIdx].characterId);
      const charName = getCharacterName(char, players[playerIdx].gender, locale) || players[playerIdx].name;
      if (!window.confirm(t('munchkin_confirmWin', { player: charName }))) {
        return;
      }
    }
    const updated = players.map((p, i) => (i === playerIdx ? { ...p, level: newLevel } : p));
    setBattle(null);
    setPlayers(updated);
    const result = checkWinner(updated.map((p) => ({ name: p.name, level: p.level })), config.targetLevel, 'kill');
    if (result.isOver) setPhase(PHASES.GAME_OVER);
  };

  const applyBadStuff = () => {
    const { playerIdx, levelsLost } = battle;
    if (levelsLost > 0) {
      const newLevel = applyLevelDelta(players[playerIdx].level, -levelsLost);
      setPlayers(players.map((p, i) => (i === playerIdx ? { ...p, level: newLevel } : p)));
    }
    setBattle(null);
  };

  const newGame = () => { setPhase(PHASES.SETUP); setPlayers([]); setCharSelections({}); setBattle(null); setOpenSetLevel(null); };

  const updatePlayerName = (idx, name) =>
    setPlayers(players.map((p, i) => (i === idx ? { ...p, name } : p)));

  const allCharSelected = useMemo(() =>
    players.every((_, i) => { const sel = charSelections[i]; if (!sel?.characterId) return false; const char = characters.find((c) => c.id === sel.characterId); return char?.noGender || sel.gender === 'male' || sel.gender === 'female'; }),
    [players, charSelections]
  );

  const minLevel = useMemo(() => (players.length ? Math.min(...players.map((p) => p.level)) : null), [players]);

  const battleResult = useMemo(() => {
    if (!battle) return null;
    const player = players[battle.playerIdx];
    if (!player) return null;
    const helperLevel = battle.helperIdx !== null ? (players[battle.helperIdx]?.level ?? 0) : 0;
    return calculateCombat({ playerLevel: player.level, equipment: battle.equipment || 0, modifiers: battle.modifiers || 0, helperLevel, helperEquipment: battle.helperEquipment || 0 }, { monsters: battle.monsters });
  }, [battle, players]);

  if (phase === PHASES.SETUP) {
    return <PlayerSetup minPlayers={config.minPlayers} maxPlayers={maxPlayers} onStart={handleStartSetup} playerNoun={config.playerNoun?.[locale]} />;
  }

  if (phase === PHASES.CHARACTER_SELECT) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="font-heading text-xl font-bold text-text-primary">{t('munchkin_chooseCharacter')}</h2>
        {players.map((player, playerIdx) => {
          const sel = charSelections[playerIdx] || {};
          const selectedChar = characters.find((c) => c.id === sel.characterId);
          return (
            <div key={playerIdx} className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="font-medium">{player.name || `${config.playerNoun?.[locale] ?? t('playerPlaceholder')} ${playerIdx + 1}`}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {characters.map((char) => {
                  const isSelected = sel.characterId === char.id;
                  const isTaken = Object.entries(charSelections).some(([idx, s]) => s.characterId === char.id && parseInt(idx) !== playerIdx);
                  return (
                    <button key={char.id} onClick={() => !isTaken && selectChar(playerIdx, char.id)} disabled={isTaken}
                      className={`p-3 rounded-xl text-left transition-all ${isSelected ? 'border-2 border-accent-purple shadow-lg' : isTaken ? 'opacity-30 cursor-not-allowed bg-bg-secondary' : 'bg-bg-secondary/50 border border-border-glass hover:border-border-glass-hover'}`}
                      id={`char-${playerIdx}-${char.id}`}>
                      {char.noGender
                        ? <div className="font-heading font-bold text-sm">BMO <span className="text-text-muted font-normal">⚪</span></div>
                        : <div className="font-heading font-bold text-xs leading-snug">♂ {char.maleNameEN}<br /><span className="text-text-muted">♀ {char.femaleNameEN}</span></div>
                      }
                      <p className="text-text-muted text-[10px] leading-snug mt-1">{getCharacterPower(char, locale)}</p>
                    </button>
                  );
                })}
              </div>
              {selectedChar && !selectedChar.noGender && (
                <div>
                  <div className="text-text-muted text-xs mb-2">{t('munchkin_chooseGender')}</div>
                  <div className="flex gap-2">
                    {['male', 'female'].map((g) => (
                      <button key={g} onClick={() => selectGender(playerIdx, g)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${sel.gender === g ? 'border-accent-purple bg-accent-purple/20 text-accent-purple' : 'border-border-glass bg-bg-secondary/50 text-text-secondary hover:border-border-glass-hover'}`}
                        id={`gender-${playerIdx}-${g}`}>
                        {GENDER_ICON[g]} {g === 'male' ? t('munchkin_male') : t('munchkin_female')} — <span className="font-bold">{g === 'male' ? selectedChar.maleNameEN : selectedChar.femaleNameEN}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedChar?.noGender && <div className="text-center text-text-muted text-xs py-1">⚪ BMO — {t('munchkin_noGender')}</div>}
            </div>
          );
        })}
        <button onClick={startPlaying} disabled={!allCharSelected} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" id="btn-start-adventure">{t('startGame')}</button>
      </div>
    );
  }

  if (phase === PHASES.GAME_OVER) {
    const sortedPlayers = players
      .map((p, i) => ({ ...p, _origIdx: i }))
      .sort((a, b) => b.level - a.level);
    const winner = sortedPlayers[0];
    const winnerCharName = getCharacterName(characters.find((c) => c.id === winner?.characterId), winner?.gender, locale) || winner?.name;
    return (
      <GameOverScreen
        config={config}
        players={sortedPlayers.map((p, i) => ({ name: p.name, score: p.level, color: p.color, isWinner: i === 0 }))}
        funStat={`${players.length} ${t('munchkin_adventurers')} · ⚔️ ${t('munchkin_wins', { player: winnerCharName })}`}
        onEditScores={() => setPhase(PHASES.PLAYING)}
        onNewGame={newGame}
      />
    );
  }

  // PLAYING phase
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {players.map((player, i) => {
          const char = characters.find((c) => c.id === player.characterId);
          const charName = getCharacterName(char, player.gender, locale) || player.name;
          const isLowest = player.level === minLevel;
          const nameParts = charName.split(' ');
          return (
            <div key={i} className={`glass-card px-3 py-2.5 flex-shrink-0 text-center min-w-[80px] transition-all ${isLowest ? 'border border-accent-amber/60 bg-accent-amber/8' : ''}`}>
              <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: player.color }} />
              <div className="text-[10px] text-text-secondary leading-tight flex flex-col items-center justify-center min-h-[24px]">
                {nameParts.map((word, wIdx) => (
                  <span key={wIdx} className="truncate max-w-[68px]">{word}</span>
                ))}
              </div>
              <div className={`font-heading font-bold text-sm mt-0.5 ${isLowest ? 'text-accent-amber' : ''}`}>Lv.{player.level}</div>
              {isLowest && <div className="text-[8px] text-accent-amber font-medium">▼ {t('munchkin_lowestLevel').toUpperCase()}</div>}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {players.map((player, playerIdx) => {
          const char = characters.find((c) => c.id === player.characterId);
          const charName = getCharacterName(char, player.gender, locale) || player.name;
          const isLowest = player.level === minLevel;
          const isBattleOpen = battle?.playerIdx === playerIdx;
          const wouldHitCap = player.level >= config.targetLevel - 1;

          return (
            <div key={playerIdx} className="glass-card p-5 space-y-4" id={`player-card-${playerIdx}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.color }} />
                  <span className="font-heading font-semibold text-text-primary truncate">{charName}</span>
                  <span className="text-text-secondary text-xs truncate">({player.name})</span>
                  {char && !char.noGender ? (
                    <span className="text-xs text-text-muted">{player.gender === 'female' ? '♀' : '♂'}</span>
                  ) : char?.noGender ? (
                    <span className="text-xs text-text-muted">⚪</span>
                  ) : null}
                </div>
                {isLowest && <span className="text-[10px] text-accent-amber font-semibold flex-shrink-0">▼ {t('munchkin_lowestLevel').toUpperCase()}</span>}
              </div>
              {char && (
                <p className="text-text-muted text-xs leading-snug -mt-1">{getCharacterPower(char, locale)}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => toggleClass1(playerIdx)} className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${CLASS_COLOR[player.class1]}`} id={`btn-class1-${playerIdx}`}>{CLASS_LABEL[player.class1]}</button>
                {player.isSuperMunchkin && player.class2 && (
                  <button onClick={() => toggleClass2(playerIdx)} className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${CLASS_COLOR[player.class2]}`} id={`btn-class2-${playerIdx}`}>{CLASS_LABEL[player.class2]}</button>
                )}
                <button onClick={() => toggleSuperMunchkin(playerIdx)}
                  className={`text-xs px-2.5 py-1 rounded border transition-all ${player.isSuperMunchkin ? 'border-accent-amber/50 bg-accent-amber/10 text-accent-amber' : 'border-border-glass text-text-muted hover:border-border-glass-hover'}`}
                  id={`btn-super-${playerIdx}`}>{t('munchkin_superMunchkin')}</button>
              </div>

              <div className="text-center py-2">
                <div className={`font-heading font-black text-6xl leading-none transition-all ${isLowest ? 'text-accent-amber' : 'gradient-text'}`}>{player.level}</div>
                <div className="text-text-muted text-xs mt-1.5">{t('munchkin_level')} / {config.targetLevel}</div>
                <div className="mt-2 h-1.5 bg-bg-secondary rounded-full overflow-hidden mx-4">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(player.level / config.targetLevel) * 100}%`, backgroundColor: isLowest ? 'var(--color-accent-amber)' : 'var(--color-accent-purple)' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => applyDelta(playerIdx, 1, 'kill')} className="btn text-sm font-semibold bg-success/15 text-success border border-success/30 hover:bg-success/25" id={`btn-kill-${playerIdx}`}>💀 {t('munchkin_kill')}</button>
                <button onClick={() => applyDelta(playerIdx, 1, 'sell')} disabled={wouldHitCap} title={wouldHitCap ? t('munchkin_cantWinBySelling') : undefined} className="btn text-sm font-semibold bg-accent-amber/15 text-accent-amber border border-accent-amber/30 hover:bg-accent-amber/25 disabled:opacity-40 disabled:cursor-not-allowed" id={`btn-sell-${playerIdx}`}>💰 {t('munchkin_sell')}</button>
                <button onClick={() => applyDelta(playerIdx, 1, 'card')} disabled={wouldHitCap} title={wouldHitCap ? t('munchkin_cantWinBySelling') : undefined} className="btn text-sm font-semibold bg-accent-purple/15 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/25 disabled:opacity-40 disabled:cursor-not-allowed" id={`btn-card-${playerIdx}`}>🃏 {t('munchkin_levelCard')}</button>
                <button onClick={() => applyDelta(playerIdx, -1, 'curse')} disabled={player.level <= 1} className="btn text-sm font-semibold bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 disabled:opacity-40 disabled:cursor-not-allowed" id={`btn-curse-${playerIdx}`}>👻 {t('munchkin_curse')}</button>
              </div>

              <div className="flex gap-2">
                {openSetLevel === playerIdx ? (
                  <div className="flex items-center gap-2 w-full">
                    <input type="number" min={1} max={9} value={setLevelInputs[playerIdx] ?? player.level}
                      onChange={(e) => setSetLevelInputs({ ...setLevelInputs, [playerIdx]: e.target.value })}
                      className="input text-center text-sm py-1.5 w-20" id={`input-set-level-${playerIdx}`} />
                    <button onClick={() => confirmSetLevel(playerIdx)} className="btn btn-primary text-xs flex-1" id={`btn-confirm-set-${playerIdx}`}>{t('confirm')}</button>
                    <button onClick={() => setOpenSetLevel(null)} className="btn btn-secondary text-xs" id={`btn-cancel-set-${playerIdx}`}>{t('cancel')}</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => { setOpenSetLevel(playerIdx); setSetLevelInputs({ ...setLevelInputs, [playerIdx]: player.level.toString() }); }}
                      className="btn btn-secondary flex-1 text-xs" id={`btn-set-level-${playerIdx}`}>{t('munchkin_setLevel')}</button>
                    {char && !char.noGender && (
                      <button onClick={() => toggleGender(playerIdx)}
                        className={`btn text-xs px-4 flex items-center justify-center gap-1 min-w-[85px] whitespace-nowrap border font-medium transition-all ${
                          player.gender === 'female'
                            ? 'text-pink-400 border-pink-400/40 bg-pink-400/10 hover:bg-pink-400/20'
                            : 'text-blue-400 border-blue-400/40 bg-blue-400/10 hover:bg-blue-400/20'
                        }`}
                        id={`btn-gender-${playerIdx}`}>
                        <span>{GENDER_ICON[player.gender ?? 'male']}</span>
                        <span>{player.gender === 'female' ? t('munchkin_female') : t('munchkin_male')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {!isBattleOpen
                ? <button onClick={() => openBattleFor(playerIdx)} className="btn btn-primary w-full font-semibold" id={`btn-battle-${playerIdx}`}>⚔️ {t('munchkin_battle')}</button>
                : <BattlePanel battle={battle} battleResult={battleResult} player={player} players={players} playerIdx={playerIdx} updateBattle={updateBattle} updateBattleMonster={updateBattleMonster} addMonster={addMonster} applyBattleReward={applyBattleReward} applyBadStuff={applyBadStuff} cancelBattle={cancelBattle} t={t} />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// BattlePanel — kept in same file (single usage, no reason for a separate module)
function BattlePanel({ battle, battleResult, player, players, playerIdx, updateBattle, updateBattleMonster, addMonster, applyBattleReward, applyBadStuff, cancelBattle, t }) {
  return (
    <div className="border-t border-border-glass pt-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-sm text-accent-amber">⚔️ {t('munchkin_battle')}</h3>
        <button onClick={cancelBattle} className="btn btn-secondary text-xs px-3 py-1" id={`btn-cancel-battle-${playerIdx}`}>{t('cancel')}</button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('munchkin_yourSide')}</div>
        <div className="rounded-xl p-3 space-y-2.5 bg-success/5 border border-success/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('munchkin_level')}</span>
            <span className="font-heading font-bold text-success text-xl">Lv.{player.level}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted block mb-1">{t('munchkin_equipment')}</label>
              <input type="number" value={battle.equipment || ''} onChange={(e) => updateBattle({ equipment: parseInt(e.target.value) || 0 })} placeholder="0" className="input text-center text-sm py-1 w-full" id={`battle-equip-${playerIdx}`} />
            </div>
            <div>
              <label className="text-[10px] text-text-muted block mb-1">{t('munchkin_modifiers')}</label>
              <input type="number" value={battle.modifiers || ''} onChange={(e) => updateBattle({ modifiers: parseInt(e.target.value) || 0 })} placeholder="0" className="input text-center text-sm py-1 w-full" id={`battle-mods-${playerIdx}`} />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-text-muted block mb-1">{t('munchkin_helper')}</label>
            <select value={battle.helperIdx ?? ''} onChange={(e) => updateBattle({ helperIdx: e.target.value === '' ? null : parseInt(e.target.value), helperEquipment: 0 })} className="input text-sm py-1 w-full" id={`battle-helper-${playerIdx}`}>
              <option value="">{t('munchkin_noHelper')}</option>
              {players.map((p, i) => i !== playerIdx ? <option key={i} value={i}>{p.name} (Lv.{p.level})</option> : null)}
            </select>
          </div>
          {battle.helperIdx !== null && (
            <div>
              <label className="text-[10px] text-text-muted block mb-1">{t('munchkin_helperEquipment')}</label>
              <input type="number" value={battle.helperEquipment || ''} onChange={(e) => updateBattle({ helperEquipment: parseInt(e.target.value) || 0 })} placeholder="0" className="input text-center text-sm py-1 w-full" id={`battle-helper-equip-${playerIdx}`} />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">{t('munchkin_monsterSide')}</div>
        {battle.monsters.map((monster, mi) => (
          <div key={mi} className="rounded-xl p-3 space-y-2 bg-danger/5 border border-danger/20">
            <div className="text-xs text-text-secondary font-medium">{t('munchkin_monster')} {mi + 1}</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-muted block mb-1">{t('munchkin_level')}</label>
                <input type="number" min={0} value={monster.level || ''} onChange={(e) => updateBattleMonster(mi, { level: parseInt(e.target.value) || 0 })} placeholder="0" className="input text-center text-sm py-1 w-full" id={`battle-monster-${playerIdx}-${mi}-level`} />
              </div>
              <div>
                <label className="text-[10px] text-text-muted block mb-1">{t('munchkin_modifiers')}</label>
                <input type="number" value={monster.modifiers || ''} onChange={(e) => updateBattleMonster(mi, { modifiers: parseInt(e.target.value) || 0 })} placeholder="0" className="input text-center text-sm py-1 w-full" id={`battle-monster-${playerIdx}-${mi}-mods`} />
              </div>
            </div>
          </div>
        ))}
        {battle.monsters.length < 2 && (
          <button onClick={addMonster} className="btn btn-secondary w-full text-xs" id={`btn-add-monster-${playerIdx}`}>{t('munchkin_addMonster')}</button>
        )}
      </div>

      {battleResult && (
        <div className={`rounded-xl p-4 space-y-3 border transition-all ${battleResult.youWin ? 'border-success/40 bg-success/5' : 'border-danger/40 bg-danger/5'}`}>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">{t('munchkin_yourSide')}</div>
              <div className="font-heading font-black text-3xl text-success">{battleResult.yourStrength}</div>
            </div>
            <div className="text-text-muted font-bold text-lg">{t('munchkin_vs')}</div>
            <div className="text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">{t('munchkin_monsterSide')}</div>
              <div className="font-heading font-black text-3xl text-danger">{battleResult.monsterStrength}</div>
            </div>
          </div>
          {battleResult.youWin ? (
            <div className="text-center font-heading font-bold text-base py-1.5 rounded-lg bg-success/20 text-success">
              {t('munchkin_youWin')}
            </div>
          ) : (
            <button onClick={() => updateBattle({ showBadStuff: !battle.showBadStuff })} className="w-full text-center font-heading font-bold text-base py-1.5 rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-all cursor-pointer" id={`btn-bad-stuff-${playerIdx}`}>
              {t('munchkin_monsterWins')} {battle.showBadStuff ? '▲' : '▼'}
            </button>
          )}
          {battleResult.youWin && (
            <div className="space-y-2.5">
              <div className="text-text-muted text-xs">{t('munchkin_levelsGained')}</div>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button key={n} onClick={() => updateBattle({ levelsGained: n })}
                    className={`w-9 h-9 rounded-lg text-sm font-heading font-bold transition-all ${battle.levelsGained === n ? 'bg-success/30 text-success border-2 border-success/60' : 'bg-bg-secondary border border-border-glass hover:border-border-glass-hover text-text-secondary'}`}
                    id={`btn-levels-${playerIdx}-${n}`}>+{n}</button>
                ))}
              </div>
              <button onClick={applyBattleReward} className="btn btn-primary w-full font-semibold" id={`btn-apply-reward-${playerIdx}`}>{t('munchkin_applyReward')} (+{battle.levelsGained})</button>
            </div>
          )}
          {!battleResult.youWin && battle.showBadStuff && (
            <div className="space-y-2.5 animate-fade-in">
              <div className="text-text-muted text-xs">{t('munchkin_levelsLost')}</div>
              <div className="flex gap-1.5 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button key={n} onClick={() => updateBattle({ levelsLost: n })}
                    className={`w-9 h-9 rounded-lg text-sm font-heading font-bold transition-all ${battle.levelsLost === n ? 'bg-danger/30 text-danger border-2 border-danger/60' : 'bg-bg-secondary border border-border-glass hover:border-border-glass-hover text-text-secondary'}`}
                    id={`btn-lose-levels-${playerIdx}-${n}`}>{n === 0 ? '✓' : `-${n}`}</button>
                ))}
              </div>
              <div className="text-[10px] text-text-muted">{t('munchkin_badStuffHint')}</div>
              <button onClick={applyBadStuff} className="btn w-full font-semibold bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30" id={`btn-apply-bad-stuff-${playerIdx}`}>
                {battle.levelsLost === 0 ? t('munchkin_ranAway') : t('munchkin_applyBadStuff', { levels: battle.levelsLost })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
