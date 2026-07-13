import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { useBgg } from '../hooks/BggContext.jsx';
import { getStoredUsername } from '../utils/bggConfig.js';
import { getPlayerProfiles, savePlayerProfile, findBggUsername } from '../utils/playerProfiles.js';
import { searchGames } from '../utils/bggApi.js';
import { showToast } from '../components/Toast.jsx';
import PlayerSetup, { PLAYER_COLORS } from '../components/PlayerSetup.jsx';
import PinPromptModal from '../components/PinPromptModal.jsx';

// ponytail: tiny, no abstraction needed
const LS_LOCATIONS = 'bgg_locations';

function getStoredList(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveToList(key, item, maxLen = 20) {
  const list = getStoredList(key).filter((x) => x !== item);
  localStorage.setItem(key, JSON.stringify([item, ...list].slice(0, maxLen)));
}

// Preset team color names matching PLAYER_COLORS order
const COLOR_NAMES = ['Purple', 'Teal', 'Pink', 'Amber', 'Blue', 'Green', 'Red', 'Orange'];

// i18n key per color (value stays English for BGG payload)
const COLOR_I18N_KEYS = {
  Purple: 'colorPurple', Teal: 'colorTeal', Pink: 'colorPink', Amber: 'colorAmber',
  Blue: 'colorBlue', Green: 'colorGreen', Red: 'colorRed', Orange: 'colorOrange',
};

// Map a color name label to its hex (for the color dot preview)
const COLOR_HEX = COLOR_NAMES.reduce((acc, name, i) => {
  acc[name] = PLAYER_COLORS[i];
  return acc;
}, {});

// --- Collapsible Section ---
function AccordionSection({ title, open, onToggle, children }) {
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <span className="font-heading font-semibold text-text-primary">{title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-border-glass pt-3">{children}</div>}
    </div>
  );
}

export default function LogPlayPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { logPlay, getCachedPin, cachePin, clearCachedPin } = useBgg();

  // --- Game search ---
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null); // { bgg_id, name, year_published }
  const debounceRef = useRef(null);

  // --- Accordion state ---
  const [openSection, setOpenSection] = useState('game');

  // --- Details ---
  const [playDate, setPlayDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [length, setLength] = useState('');
  const recentLocations = getStoredList(LS_LOCATIONS);

  const [playerExtras, setPlayerExtras] = useState({});

  // Live auto-fill: when a name matches a saved profile, fill bggUsername immediately
  const handleNameChange = useCallback((index, name) => {
    const bggUsername = findBggUsername(name);
    if (bggUsername) {
      setPlayerExtras((prev) => ({
        ...prev,
        [index]: { ...(prev[index] || {}), bggUsername },
      }));
    }
  }, []);

  // --- Submit ---
  const [pendingPlayers, setPendingPlayers] = useState(null); // players waiting for PIN
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (section) => setOpenSection((s) => s === section ? null : section);

  // Debounced game search
  const handleQueryChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedGame(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchGames(val.trim());
        setResults(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setQuery(game.name);
    setResults([]);
    setOpenSection('details');
  };

  const updateExtra = (index, field, value) => {
    setPlayerExtras((prev) => {
      const updated = { ...prev, [index]: { ...(prev[index] || {}), [field]: value } };

      // Team-win auto-propagation
      if (field === 'win') {
        const teamColor = (updated[index]?.color || COLOR_NAMES[index % COLOR_NAMES.length]);
        if (value === true) {
          Object.keys(updated).forEach((i) => {
            const iColor = updated[i]?.color || COLOR_NAMES[Number(i) % COLOR_NAMES.length];
            if (iColor === teamColor) updated[i] = { ...updated[i], win: true };
          });
        } else {
          const allSameTeam = Object.keys(updated).filter((i) => {
            const iColor = updated[i]?.color || COLOR_NAMES[Number(i) % COLOR_NAMES.length];
            return iColor === teamColor;
          });
          allSameTeam.forEach((i) => { updated[i] = { ...updated[i], win: false }; });
        }
      }
      return updated;
    });
  };

  // Per-player BGG username autocomplete from shared profiles
  const getProfileForName = (name) =>
    getPlayerProfiles().find((p) => p.name.toLowerCase() === name?.toLowerCase());

  const buildPayload = (players) => {
    // Compute dense rank by score descending for position field
    const scored = players.map((_, i) => {
      const raw = playerExtras[i]?.score;
      return raw !== undefined && raw !== '' ? Number(raw) : null;
    });
    const sortedUniq = [...new Set(scored.filter((s) => s !== null))].sort((a, b) => b - a);
    const rankFor = (s) => s !== null ? String(sortedUniq.indexOf(s) + 1) : '';

    return {
      bggId: selectedGame.bgg_id || selectedGame.id,
      playDate,
      location: location.trim() || undefined,
      quantity: 1,
      length: length ? parseInt(length, 10) : undefined,
      players: players.map((p, i) => {
        const ex = playerExtras[i] || {};
        const colorName = ex.color || COLOR_NAMES[i % COLOR_NAMES.length];
        return {
          name: p.name,
          username: ex.bggUsername || '',
          color: colorName,
          score: ex.score !== undefined ? String(ex.score) : '',
          win: Boolean(ex.win),
          new: Boolean(ex.firstTime),
          position: rankFor(scored[i]),
        };
      }),
    };
  };

  // Called by PlayerSetup when user clicks "Log Play on BGG"
  const handlePlayersReady = async (finalPlayers) => {
    if (!selectedGame) {
      showToast(t('logPlayValidationError'), 'error');
      setOpenSection('game');
      return;
    }

    if (!getStoredUsername()) {
      showToast(t('bggNotConfigured'), 'info');
      return;
    }

    setPendingPlayers(finalPlayers);
    // Use cached PIN if available — skip the modal entirely
    const cached = getCachedPin();
    if (cached) {
      await submitPlay(finalPlayers, cached);
    } else {
      setShowPin(true);
    }
  };

  const submitPlay = async (players, pin) => {
    setSubmitting(true);
    try {
      const payload = buildPayload(players);

      // Persist location + player profiles
      if (location.trim()) saveToList(LS_LOCATIONS, location.trim());
      players.forEach((p, i) => {
        const bggUsername = playerExtras[i]?.bggUsername || '';
        savePlayerProfile(p.name, bggUsername);
      });

      await logPlay(pin, payload);
      cachePin(pin);
      showToast(t('logPlaySuccess'), 'success');
      navigate('/');
    } catch (err) {
      clearCachedPin();
      setShowPin(true); // re-prompt on failure
      showToast(`${t('bggPlayError')}: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
      setPendingPlayers(null);
    }
  };

  const handlePinSubmit = async (pin) => {
    setShowPin(false);
    await submitPlay(pendingPlayers, pin);
  };

  // --- Render extra fields per player (injected via renderPlayerExtra) ---
  const renderPlayerExtra = (index) => {
    const ex = playerExtras[index] || {};
    const colorName = ex.color || COLOR_NAMES[index % COLOR_NAMES.length];
    const colorHex = COLOR_HEX[colorName] || PLAYER_COLORS[index % PLAYER_COLORS.length];
    const profile = pendingPlayers?.[index]
      ? getProfileForName(pendingPlayers[index]?.name)
      : null;

    return (
      <div className="space-y-2">
        {/* Team / Color */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex }} />
          <select
            value={colorName}
            onChange={(e) => updateExtra(index, 'color', e.target.value)}
            className="input flex-1 text-sm"
            id={`player-color-${index}`}
          >
            {COLOR_NAMES.map((c) => (
              <option key={c} value={c}>{t(COLOR_I18N_KEYS[c])}</option>
            ))}
          </select>
        </div>

        {/* BGG Username — combobox with saved profiles */}
        <input
          type="text"
          value={ex.bggUsername || ''}
          onChange={(e) => {
            const val = e.target.value;
            // If user picked a 'Name (bggUsername)' option, parse out the username
            const match = val.match(/^.+\s\((.+)\)$/);
            const username = match ? match[1] : val;
            updateExtra(index, 'bggUsername', username);
            // If they selected a full profile option, also update the player name
            if (match) {
              const profileName = val.replace(/\s\(.+\)$/, '');
              // Signal PlayerSetup to update this player's name
              updateExtra(index, '_pendingName', profileName);
            }
          }}
          placeholder={t('bggSelectProfile')}
          className="input w-full text-sm"
          list={`bgg-profiles-list-${index}`}
          id={`player-bgg-username-${index}`}
        />
        <datalist id={`bgg-profiles-list-${index}`}>
          {getPlayerProfiles().map((p) => (
            <option key={p.bggUsername} value={`${p.name} (${p.bggUsername})`} />
          ))}
        </datalist>

        {/* Score */}
        <input
          type="number"
          value={ex.score ?? ''}
          onChange={(e) => updateExtra(index, 'score', e.target.value)}
          placeholder={t('score')}
          className="input w-full text-sm"
          id={`player-score-${index}`}
        />

        {/* Win + First time playing */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <label className="flex items-center gap-2 cursor-pointer" id={`player-win-label-${index}`}>
            <input
              type="checkbox"
              checked={Boolean(ex.win)}
              onChange={(e) => updateExtra(index, 'win', e.target.checked)}
              className="accent-accent-amber"
              id={`player-win-${index}`}
            />
            <span>🏆 {t('winnerLabel')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer" id={`player-firsttime-label-${index}`}>
            <input
              type="checkbox"
              checked={Boolean(ex.firstTime)}
              onChange={(e) => updateExtra(index, 'firstTime', e.target.checked)}
              className="accent-accent-teal"
              id={`player-firsttime-${index}`}
            />
            <span>🆕 {t('logPlayFirstTime')}</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-secondary" id="btn-back" aria-label="Back">
          ←
        </button>
        <h1 className="font-heading text-xl font-bold text-text-primary">📝 {t('logPlayTitle')}</h1>
      </div>

      {/* Section 1 — Game */}
      <AccordionSection
        title={t('logPlayGameSection')}
        open={openSection === 'game'}
        onToggle={() => toggle('game')}
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={t('logPlaySearchPlaceholder')}
            className="input w-full pr-10"
            id="log-play-game-search"
            autoComplete="off"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin">⏳</span>
          )}
        </div>

        {results.length > 0 && (
          <div className="glass-card overflow-hidden divide-y divide-border-glass">
            {results.map((game, i) => (
              <button
                key={game.bgg_id || game.id || i}
                onClick={() => handleSelectGame(game)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                id={`game-result-${game.bgg_id || game.id}`}
              >
                <span className="font-medium text-text-primary">{game.name}</span>
                {game.year_published && (
                  <span className="text-text-muted text-sm ml-2">({game.year_published})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedGame && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-teal/10 border border-accent-teal/30">
            <span className="text-accent-teal text-sm">✓</span>
            <span className="text-text-primary font-medium text-sm">{selectedGame.name}</span>
            {selectedGame.year_published && (
              <span className="text-text-muted text-xs">({selectedGame.year_published})</span>
            )}
            <button
              onClick={() => { setSelectedGame(null); setQuery(''); }}
              className="ml-auto text-text-muted hover:text-danger text-xs"
              id="btn-clear-game"
            >
              ✕
            </button>
          </div>
        )}

        {!selectedGame && !results.length && !searching && query && (
          <p className="text-text-muted text-sm text-center py-2">{t('logPlayNoResults')}</p>
        )}
        {!query && !selectedGame && (
          <p className="text-text-muted text-xs text-center">{t('logPlaySelectPrompt')}</p>
        )}
      </AccordionSection>

      {/* Section 2 — Details */}
      <AccordionSection
        title={t('logPlayDetailsSection')}
        open={openSection === 'details'}
        onToggle={() => toggle('details')}
      >
        <div className="space-y-3">
          <div>
            <label className="text-text-secondary text-xs mb-1 block">{t('logPlayDate')}</label>
            <input
              type="date"
              value={playDate}
              onChange={(e) => setPlayDate(e.target.value)}
              className="input w-full"
              id="log-play-date"
            />
          </div>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">{t('logPlayLocation')}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('logPlayLocationHint')}
              className="input w-full"
              list="log-play-locations-list"
              id="log-play-location"
            />
            <datalist id="log-play-locations-list">
              {recentLocations.map((loc) => <option key={loc} value={loc} />)}
            </datalist>
          </div>
          <div>
            <label className="text-text-secondary text-xs mb-1 block">{t('logPlayLength')}</label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="45"
              min="0"
              className="input w-full"
              id="log-play-length"
            />
          </div>
        </div>
        <button
          onClick={() => setOpenSection('players')}
          className="btn btn-secondary w-full mt-1"
          id="btn-details-next"
        >
          {t('logPlayNext')} →
        </button>
      </AccordionSection>

      {/* Section 3 — Players (submit button lives inside PlayerSetup) */}
      <AccordionSection
        title={t('logPlayPlayersSection')}
        open={openSection === 'players'}
        onToggle={() => toggle('players')}
      >
        <PlayerSetup
          minPlayers={1}
          maxPlayers={10}
          onStart={handlePlayersReady}
          renderPlayerExtra={renderPlayerExtra}
          submitLabel={submitting ? '⏳' : t('logPlaySubmit')}
          onNameChange={handleNameChange}
        />
      </AccordionSection>

      <PinPromptModal
        open={showPin}
        onSubmit={handlePinSubmit}
        onClose={() => { setShowPin(false); setPendingPlayers(null); }}
      />
    </div>
  );
}
