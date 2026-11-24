// Dual-mode leaderboard adapter:
// - Inside Telegram (URL contains ?tg_session=...): uses Telegram's serverless
//   Gaming Platform scores via /api/score and /api/leaderboard.
// - Standalone browser preview: falls back to localStorage.

const STORAGE_KEY = 'hunt_for_pirzadeh_lb_v1';

const DEFAULT_SCORES = [
  { name: 'PIRZADEH', score: 420, caughtPirzadeh: true },
  { name: 'PIXELKING', score: 340, caughtPirzadeh: true },
  { name: 'MOLEHUNTR', score: 265, caughtPirzadeh: false },
  { name: 'ARCADE99', score: 190, caughtPirzadeh: false },
  { name: 'NEWBIE', score: 110, caughtPirzadeh: false },
];

const params = new URLSearchParams(window.location.search);
const TG_SESSION_TOKEN = params.get('tg_session') || '';

export function isTelegramMode() {
  return Boolean(TG_SESSION_TOKEN);
}

export function shareTelegramScore() {
  if (window.TelegramGameProxy && typeof window.TelegramGameProxy.shareScore === 'function') {
    window.TelegramGameProxy.shareScore();
  }
}

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SCORES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_SCORES];
  } catch {
    return [...DEFAULT_SCORES];
  }
}

function writeRaw(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

export async function getLeaderboard(limit = 10) {
  if (isTelegramMode()) {
    try {
      const res = await fetch(`/api/leaderboard?token=${encodeURIComponent(TG_SESSION_TOKEN)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.leaderboard)) {
        return data.leaderboard.slice(0, limit);
      }
    } catch (err) {
      console.error('Failed to fetch Telegram leaderboard:', err);
    }
    return [];
  }

  const list = readRaw().sort((a, b) => b.score - a.score);
  return list.slice(0, limit);
}

export async function submitScore({ name, score, caughtPirzadeh }) {
  if (isTelegramMode()) {
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: TG_SESSION_TOKEN,
          score: Number(score) || 0,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        return {
          ok: true,
          updated: Boolean(data.updated),
          leaderboard: data.leaderboard || [],
        };
      }
      return { ok: false, error: data.error || 'Sync failed' };
    } catch (err) {
      console.error('Failed to submit Telegram score:', err);
      return { ok: false, error: err.message };
    }
  }

  const cleanName = (name || 'PLAYER').trim().toUpperCase().slice(0, 12) || 'PLAYER';
  const list = readRaw();
  list.push({
    name: cleanName,
    score: Number(score) || 0,
    caughtPirzadeh: Boolean(caughtPirzadeh),
    ts: Date.now(),
  });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 20);
  writeRaw(trimmed);
  return { ok: true, updated: true, leaderboard: trimmed.slice(0, 10) };
}

export async function getBestScore() {
  const list = await getLeaderboard(1);
  return list.length ? list[0].score : 0;
}
