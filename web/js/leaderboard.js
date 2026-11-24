// 3-tier leaderboard adapter:
// 1. Telegram Serverless (`Telegram.WebApp.Serverless.call`) when hosted on *.tgcloud.ai
// 2. Telegram Native CloudStorage (`Telegram.WebApp.CloudStorage`) when running inside Telegram Mini App
// 3. Browser `localStorage` when opened standalone

const STORAGE_KEY = 'hunt_for_pirzadeh_lb_v1';
const TG_CLOUD_KEY = 'hfp_scores_v1';

const DEFAULT_SCORES = [
  { name: 'PIRZADEH', score: 420, caughtPirzadeh: true },
  { name: 'PIXELKING', score: 340, caughtPirzadeh: true },
  { name: 'MOLEHUNTR', score: 265, caughtPirzadeh: false },
  { name: 'ARCADE99', score: 190, caughtPirzadeh: false },
  { name: 'NEWBIE', score: 110, caughtPirzadeh: false },
];

function getTgWebApp() {
  return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
}

export function initTelegramMiniApp() {
  const tg = getTgWebApp();
  if (!tg || !tg.initData) return;
  try {
    tg.ready();
    tg.expand();
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#1b2230');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor('#141923');
    }
  } catch {
    // Ignore on older Telegram clients
  }
}

export function isServerlessMode() {
  const tg = getTgWebApp();
  const onTgCloud = /\.tgcloud\.ai$/i.test(window.location.hostname);
  return Boolean(
    onTgCloud &&
      tg &&
      tg.initData &&
      tg.Serverless &&
      typeof tg.Serverless.call === 'function'
  );
}

export function isTelegramMode() {
  const tg = getTgWebApp();
  return Boolean(tg && tg.initData);
}

function getTelegramPlayerName() {
  const user = getTgWebApp()?.initDataUnsafe?.user;
  if (!user) return 'PLAYER';
  if (user.username) return `@${user.username}`;
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'PLAYER';
}

function hasTgCloudStorage() {
  const tg = getTgWebApp();
  return Boolean(
    tg &&
      tg.initData &&
      tg.CloudStorage &&
      typeof tg.CloudStorage.getItem === 'function' &&
      typeof tg.CloudStorage.setItem === 'function'
  );
}

function tgCloudGet(key) {
  return new Promise((resolve) => {
    try {
      getTgWebApp().CloudStorage.getItem(key, (err, value) => {
        if (err || !value) resolve(null);
        else resolve(value);
      });
    } catch {
      resolve(null);
    }
  });
}

function tgCloudSet(key, value) {
  return new Promise((resolve) => {
    try {
      getTgWebApp().CloudStorage.setItem(key, value, (err, ok) => {
        resolve(!err && Boolean(ok));
      });
    } catch {
      resolve(false);
    }
  });
}

function callServerless(endpoint, payload = {}) {
  return new Promise((resolve, reject) => {
    const tg = getTgWebApp();
    if (!tg?.Serverless?.call) {
      reject(new Error('Telegram Serverless SDK unavailable'));
      return;
    }
    tg.Serverless.call(endpoint, payload, (err, result) => {
      if (err) {
        reject(new Error(err.message || err.type || 'Serverless call failed'));
      } else {
        resolve(result);
      }
    });
  });
}

export function shareTelegramScore(score) {
  const tg = getTgWebApp();
  const text = `🎮 I scored ${score} points in Hunt for Pirzadeh! Can you beat me?`;
  const url = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/HuntForPirzadehBot')}&text=${encodeURIComponent(text)}`;
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

function readLocalRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SCORES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_SCORES];
  } catch {
    return [...DEFAULT_SCORES];
  }
}

function writeLocalRaw(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

async function readTgCloudScores() {
  const raw = await tgCloudGet(TG_CLOUD_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getLeaderboard(limit = 10) {
  if (isServerlessMode()) {
    try {
      const data = await callServerless('getLeaderboard', { limit });
      if (data && Array.isArray(data.leaderboard)) {
        return data.leaderboard.slice(0, limit);
      }
    } catch (err) {
      console.error('Failed to fetch Telegram Serverless leaderboard:', err);
    }
    return [];
  }

  if (hasTgCloudStorage()) {
    const list = await readTgCloudScores();
    return list.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const list = readLocalRaw().sort((a, b) => b.score - a.score);
  return list.slice(0, limit);
}

export async function submitScore({ name, score, caughtPirzadeh }) {
  const numericScore = Math.max(0, Math.floor(Number(score) || 0));

  if (isServerlessMode()) {
    try {
      const data = await callServerless('submitScore', {
        score: numericScore,
        caughtPirzadeh: Boolean(caughtPirzadeh),
      });
      return {
        ok: true,
        updated: Boolean(data?.updated),
        bestScore: data?.bestScore ?? numericScore,
        leaderboard: data?.leaderboard || [],
      };
    } catch (err) {
      console.error('Failed to submit score to Telegram Serverless:', err);
      return { ok: false, error: err.message };
    }
  }

  if (hasTgCloudStorage()) {
    const list = await readTgCloudScores();
    const prevBest = list.length ? Math.max(...list.map((r) => r.score || 0)) : 0;
    const playerName = getTelegramPlayerName();
    list.push({
      name: playerName,
      score: numericScore,
      caughtPirzadeh: Boolean(caughtPirzadeh),
      ts: Date.now(),
    });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 10);
    await tgCloudSet(TG_CLOUD_KEY, JSON.stringify(trimmed));
    return {
      ok: true,
      updated: numericScore > prevBest,
      bestScore: Math.max(prevBest, numericScore),
      leaderboard: trimmed,
    };
  }

  const cleanName = (name || 'PLAYER').trim().toUpperCase().slice(0, 12) || 'PLAYER';
  const list = readLocalRaw();
  list.push({
    name: cleanName,
    score: numericScore,
    caughtPirzadeh: Boolean(caughtPirzadeh),
    ts: Date.now(),
  });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 20);
  writeLocalRaw(trimmed);
  return { ok: true, updated: true, leaderboard: trimmed.slice(0, 10) };
}

export async function getBestScore() {
  if (isServerlessMode()) {
    try {
      const data = await callServerless('getLeaderboard', { limit: 1 });
      if (data && typeof data.myBest === 'number' && data.myBest > 0) {
        return data.myBest;
      }
      if (data?.leaderboard?.length) return data.leaderboard[0].score;
    } catch {
      return 0;
    }
    return 0;
  }

  const list = await getLeaderboard(1);
  return list.length ? list[0].score : 0;
}
