import { useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useSessionStorage } from '../../hooks/useSessionStorage.js';
import PlayerSetup from '../../components/PlayerSetup.jsx';
import GameOverScreen from '../../components/GameOverScreen.jsx';
import { resolveOutcome, needsSquireLeft } from './rules.js';
import { chips, keywords, getEntryName, getEntryEffect } from './data/chips.js';
import config from './config.js';

const PHASES = { SETUP: 'setup', PLAYING: 'playing', GAME_OVER: 'game_over' };
const SWORDS = ['excalibur', 'cursed', 'squire'];
const NO_HOLDERS = {}; // undefined = not answered yet, null = in Avalon/trashed

function ChipReference() {
    const { t, locale } = useI18n();
    const [q, setQ] = useState('');
    const match = (e) => `${e.nameEN} ${e.nameES}`.toLowerCase().includes(q.trim().toLowerCase());
    const section = (title, list) => list.length > 0 && (
        <div className="space-y-2">
            <div className="text-text-muted text-xs uppercase">{title}</div>
            {list.map((e) => (
                <div key={e.nameEN} className="text-sm">
                    <span className="font-medium">{getEntryName(e, locale)}</span>
                    {e.count && <span className="text-text-muted"> (×{e.count})</span>}
                    <p className="text-text-secondary">{getEntryEffect(e, locale)}</p>
                </div>
            ))}
        </div>
    );
    return (
        <details className="glass-card p-4" id="excalibur-reference">
            <summary className="font-medium cursor-pointer">{t('excalibur_reference')}</summary>
            <div className="mt-3 space-y-4">
                <p className="text-text-muted text-xs">{t('excalibur_searchNote')}</p>
                <input
                    className="input w-full"
                    id="input-excalibur-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('excalibur_searchChips')}
                />
                {section(t('excalibur_chips'), chips.filter(match))}
                {section(t('excalibur_keywords'), keywords.filter(match))}
            </div>
        </details>
    );
}


export default function ExcaliburCalculator() {
    const { t, locale } = useI18n();
    const [phase, setPhase] = useSessionStorage('excalibur-phase', PHASES.SETUP);
    const [players, setPlayers] = useSessionStorage('excalibur-players', []);
    const [holders, setHolders] = useSessionStorage('excalibur-holders', NO_HOLDERS);
    // Session win tally by player name; committed on "play again" so editing results never double-counts.
    const [wins, setWins] = useSessionStorage('excalibur-wins', {});

    const outcome = resolveOutcome(players.length, holders);

    const newGame = () => {
        const next = { ...wins };
        outcome.winners.forEach((i) => { next[players[i].name] = (next[players[i].name] || 0) + 1; });
        setWins(next);
        setPhase(PHASES.SETUP);
        setPlayers([]);
        setHolders(NO_HOLDERS);
    };

    if (phase === PHASES.SETUP) {
        return (
            <PlayerSetup
                minPlayers={config.minPlayers}
                maxPlayers={config.maxPlayers}
                onStart={(list) => {
                    setPlayers(list);
                    setHolders(NO_HOLDERS);
                    setPhase(PHASES.PLAYING);
                }}
                playerNoun={config.playerNoun?.[locale]}
            />
        );
    }

    if (phase === PHASES.GAME_OVER) {
        const rows = players
            .map((p, i) => ({
                name: p.name,
                color: p.color,
                isWinner: outcome.winners.includes(i),
                score: outcome.winners.includes(i) ? 1 : 0,
                rank: outcome.winners.includes(i) ? 0 : i === outcome.loser ? 2 : 1,
            }))
            .sort((a, b) => a.rank - b.rank);
        const summary = [
            t(`excalibur_${outcome.type}`),
            outcome.loser != null && t('excalibur_loserIs', { name: players[outcome.loser].name }),
        ].filter(Boolean).join(' · ');
        const tally = players
            .map((p, i) => [p.name, (wins[p.name] || 0) + (outcome.winners.includes(i) ? 1 : 0)])
            .filter(([, n]) => n > 0)
            .map(([name, n]) => `${name} ${n}`)
            .join(' · ');
        return (
            <div className="space-y-4">
                <div className="glass-card p-4 text-center space-y-1" id="excalibur-outcome">
                    <div className="font-medium">{summary}</div>
                    {tally && <div className="text-text-muted text-xs">{t('excalibur_sessionWins')}: {tally}</div>}
                </div>
                <GameOverScreen
                    config={config}
                    players={rows}
                    funStat={summary}
                    comments={summary}
                    onEditScores={() => setPhase(PHASES.PLAYING)}
                    onNewGame={newGame}
                />
            </div>
        );
    }

    const setHolder = (sword, idx) =>
        setHolders({ ...holders, [sword]: idx, ...(sword === 'squire' ? { squireLeft: undefined } : {}) });
    const askLeft = needsSquireLeft(players.length, holders);
    const ready = SWORDS.every((s) => holders[s] !== undefined) && (!askLeft || holders.squireLeft != null);

    const picker = (sword, options, label) => (
        <div className="flex flex-wrap gap-2">
            {options.map((idx) => (
                <button
                    key={idx ?? 'none'}
                    id={`btn-${sword}-${idx ?? 'none'}`}
                    onClick={() => (sword === 'squireLeft' ? setHolders({ ...holders, squireLeft: idx }) : setHolder(sword, idx))}
                    className={`btn text-sm ${holders[sword] === idx ? 'btn-primary' : 'btn-secondary'}`}
                >
                    {idx === null ? label : players[idx].name}
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="text-center">
                <h2 className="font-heading text-xl font-bold text-text-primary">{t('excalibur_finalHolders')}</h2>
                <p className="text-text-muted text-sm">{t('excalibur_hint')}</p>
            </div>

            {SWORDS.map((sword) => (
                <div key={sword} className="glass-card p-4 space-y-2">
                    <div className="font-medium">{t(`excalibur_${sword}`)}</div>
                    {picker(sword, [null, ...players.keys()], t('excalibur_inAvalon'))}
                    {sword === 'squire' && askLeft && (
                        <div className="space-y-2 pt-2">
                            <div className="text-text-muted text-sm">{t('excalibur_squireLeft')}</div>
                            {picker('squireLeft', [...players.keys()].filter((i) => i !== holders.squire))}
                        </div>
                    )}
                </div>
            ))}

            <ChipReference />

            <button
                onClick={() => setPhase(PHASES.GAME_OVER)}
                disabled={!ready}
                className="btn btn-primary w-full disabled:opacity-50"
                id="btn-show-results"
            >
                {t('excalibur_showResults')}
            </button>
        </div>
    );
}
