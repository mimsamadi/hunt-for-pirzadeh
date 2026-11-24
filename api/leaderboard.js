import { formatHighScores, tgApi, verifySession } from './_lib/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const token = req.query?.token;
    const session = verifySession(token);
    if (!session) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired Telegram session' });
    }

    const target = session.inline_message_id
      ? { inline_message_id: session.inline_message_id }
      : { chat_id: session.chat_id, message_id: session.message_id };

    const highScores = await tgApi('getGameHighScores', {
      user_id: session.user_id,
      ...target,
    });

    return res.status(200).json({
      ok: true,
      leaderboard: formatHighScores(highScores),
    });
  } catch (err) {
    console.error('Leaderboard API error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
