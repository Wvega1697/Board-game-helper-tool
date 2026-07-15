import { useRef, useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { captureAndShare } from '../utils/share.js';
import { getBggPlays, getGameImages } from '../utils/bggApi.js';
import { getStoredUsername } from '../utils/bggConfig.js';

/**
 * Returns { mindate, maxdate, label } for the previous calendar month.
 * e.g. called on July 3 → { mindate:'2026-06-01', maxdate:'2026-06-30', label:'June 2026' }
 */
function prevMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const label = first.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  return { mindate: fmt(first), maxdate: fmt(last), label };
}

/**
 * MonthlyRecap — modal overlay showing last month's board game stats + cover grid.
 * Follows the ShareCard pattern: everything inside `cardRef` is captured as an image.
 */
export default function MonthlyRecap({ onClose }) {
  const { t } = useI18n();
  const cardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null); // { totalPlays, wins, newGames, games: [{objectId, name, count, image}] }

  const { mindate, maxdate, label } = prevMonthRange();
  const monthTitle = label.toUpperCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const username = getStoredUsername();
      const data = await getBggPlays({ username, mindate, maxdate });
      const plays = data.plays ?? [];

      // Aggregate stats
      let totalPlays = 0;
      let wins = 0;
      let newGames = 0;
      const gameMap = {}; // objectId → { name, count }

      for (const play of plays) {
        const qty = play.quantity ?? 1;
        totalPlays += qty;

        // Find this user's player entry
        const myPlayer = play.players?.find(
          (p) => p.username?.toLowerCase() === username.toLowerCase()
        );
        if (myPlayer?.win) wins += qty;
        if (myPlayer?.new) newGames += 1;

        const id = play.item?.objectId;
        if (id) {
          if (!gameMap[id]) gameMap[id] = { name: play.item.name ?? '', count: 0 };
          gameMap[id].count += qty;
        }
      }

      // Sort games by play count desc
      const sortedGames = Object.entries(gameMap)
        .map(([objectId, { name, count }]) => ({ objectId, name, count, image: null }))
        .sort((a, b) => b.count - a.count);

      // Batch-fetch images for all games
      const ids = sortedGames.map((g) => g.objectId);
      const images = await getGameImages(ids);
      const imageMap = Object.fromEntries(images.map((i) => [String(i.bgg_id), i.image]));
      for (const g of sortedGames) {
        g.image = imageMap[String(g.objectId)] ?? null;
      }

      setStats({ totalPlays, wins, newGames, games: sortedGames });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mindate, maxdate]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      await captureAndShare(cardRef.current, {
        fileName: `recap-${mindate.slice(0, 7)}.png`,
        title: monthTitle,
        text: `My board games in ${label}`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-sm animate-scale-in flex flex-col gap-4 max-h-[90dvh]">

        {/* ── Capturable card ── */}
        <div
          ref={cardRef}
          style={{
            background: 'linear-gradient(160deg, #1a1a2e 0%, #0f0f1a 50%, #16213e 100%)',
            padding: '20px',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <h2
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '1.1rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textAlign: 'center',
              marginBottom: '14px',
              background: 'linear-gradient(135deg, #f59e0b, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {monthTitle}
          </h2>

          {loading && (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
              {t('recapLoading')}
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', color: '#ef4444', padding: '24px 0', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Stats row */}
              {stats.totalPlays === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', padding: '20px 0' }}>
                  {t('recapNoPlays')}
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px' }}>
                    {[
                      { emoji: '🎲', label: t('recapPlayed'), value: stats.totalPlays },
                      { emoji: '👑', label: t('recapWins'), value: stats.wins },
                      { emoji: '🆕', label: t('recapNew'), value: stats.newGames },
                    ].map(({ emoji, label: l, value }) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem' }}>{emoji}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{l}</div>
                        <div style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Separator */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '14px' }} />

                  {/* Game grid — adaptive: 5 cols on wide, 3 on narrow via CSS grid auto-fill */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(18%, 60px), 1fr))',
                    gap: '6px',
                  }}>
                    {stats.games.map((game) => (
                      <div
                        key={game.objectId}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#1e1e32',
                        }}
                      >
                        {game.image ? (
                          <img
                            src={game.image}
                            alt={game.name}
                            crossOrigin="anonymous"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '4px', textAlign: 'center',
                            color: '#64748b', fontSize: '0.55rem', lineHeight: 1.2,
                          }}>
                            {game.name}
                          </div>
                        )}
                        {/* Play count badge */}
                        {game.count > 1 && (
                          <div style={{
                            position: 'absolute', bottom: '3px', right: '3px',
                            background: 'rgba(0,0,0,0.72)',
                            color: '#f1f5f9',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            padding: '1px 5px',
                            lineHeight: 1.4,
                          }}>
                            {game.count}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Branding */}
          <div style={{ textAlign: 'center', marginTop: '14px', color: 'rgba(100,116,139,0.6)', fontSize: '10px' }}>
            🎲 Boardgame Helper
          </div>
        </div>

        {/* ── Action buttons (outside capture area) ── */}
        <div className="flex gap-3">
          {stats && stats.totalPlays > 0 && (
            <button
              onClick={handleShare}
              disabled={isSharing || loading}
              className="btn btn-primary flex-1 disabled:opacity-50"
              id="btn-recap-share"
            >
              {isSharing ? <span className="animate-spin">⏳</span> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
              {t('recapShare')}
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-secondary"
            id="btn-recap-close"
          >
            ✕ {t('recapClose')}
          </button>
        </div>
      </div>
    </div>
  );
}
