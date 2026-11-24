import crypto from 'node:crypto';

export const GAME_SHORT_NAME = 'hunt_for_pirzadeh';

export function getBotToken() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN environment variable is not set');
  }
  return token;
}

export function getOwnerId() {
  const raw = process.env.OWNER_TELEGRAM_ID;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getWebhookSecret() {
  return process.env.WEBHOOK_SECRET || '';
}

export async function tgApi(method, payload = {}) {
  const token = getBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    const err = new Error(`Telegram API ${method} failed: ${data.description || res.status}`);
    err.telegramResponse = data;
    throw err;
  }
  return data.result;
}

function deriveSigningKey() {
  return crypto
    .createHash('sha256')
    .update(`hunt-for-pirzadeh-session:${getBotToken()}`)
    .digest();
}

export function signSession(payload) {
  const data = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 6, // 6 hours
  };
  const body = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', deriveSigningKey())
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expected = crypto
    .createHmac('sha256', deriveSigningKey())
    .update(body)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.user_id !== 'number') return null;
    if (typeof parsed.exp === 'number' && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatHighScores(highScores = []) {
  return highScores.map((row) => ({
    position: row.position,
    userId: row.user?.id,
    name:
      row.user?.username
        ? `@${row.user.username}`
        : [row.user?.first_name, row.user?.last_name].filter(Boolean).join(' ') || 'PLAYER',
    score: row.score,
  }));
}
