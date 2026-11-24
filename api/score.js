import { formatHighScores, tgApi, verifySession } from './_lib/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { token, score } = req.body || {};
    const session = verifySession(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired Telegram session' });
    }

    const numericScore = Math.floor(Number(score));
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 5000) {
      return res.status(400).json({ ok: false, error: 'Invalid score value' });
    }

    const target = session.inline_message_id
      ? { inline_message_id: session.inline_message_id }
      : { chat_id: session.chat_id, message_id: session.message_id };

    // Telegram rejects setGameScore with 400 "BOT_SCORE_NOT_MODIFIED" when the new
    // score is not higher than the user's previous high score; treat that as success.
    let updated = true;
    try {
      await tgApi('setGameScore', {
        user_id: session.user_id,
        score: numericScore,
        force: false,
        disable_edit_message: false,
        ...target,
      });
    } catch (err) {
      const desc = err.telegramResponse?.description || err.message || '';
      if (desc.includes('BOT_SCORE_NOT_MODIFIED')) {
        updated = false;
      } else {
        throw err;
      }
    }

    const highScores = await tgApi('getGameHighScores', {
      user_id: session.user_id,
      ...target,
    });

    return res.status(200).json({
      ok: true,
      updated,
      leaderboard: formatHighScores(highScores),
    });
  } catch (err) {
    console.error('Score API error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
