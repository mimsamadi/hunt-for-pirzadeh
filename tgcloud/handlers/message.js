import { api, db } from 'sdk';
import { desc } from 'sdk/db';
import { scores } from '../schema.js';
import { BOT_USERNAME, MINI_APP_URL } from '../lib/config.js';

export default async function (message) {
  if (!message?.text) return;

  const chat = message.chat;
  const raw = message.text.trim();
  const cmd = raw.split(/\s+/)[0].split('@')[0].toLowerCase();

  if (cmd === '/start' || cmd === '/play') {
    const isPrivate = chat.type === 'private';

    // In private chats, Telegram supports direct `web_app` inline buttons.
    // In group chats, link directly to the bot's Mini App deep link.
    const playButton = isPrivate
      ? { text: '🎮 Play Hunt for Pirzadeh', web_app: { url: MINI_APP_URL } }
      : { text: '🎮 Play Hunt for Pirzadeh', url: `https://t.me/${BOT_USERNAME}/game` };

    await api.sendMessage({
      chat_id: chat.id,
      text:
        '👾 *HUNT FOR PIRZADEH*\n\n' +
        '60 seconds · 12 pixel-art holes · speed ramps up!\n' +
        '🟡 Yellow: `+10`\n' +
        '🟢 Green: `+20`\n' +
        '🔴 Red: `-15` _(avoid!)_\n' +
        '👑 Pirzadeh: `+50` _(appears ONCE!)_\n\n' +
        'Tap below to start hunting, or send /leaderboard to see top scores.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[playButton]],
      },
    });
    return;
  }

  if (cmd === '/leaderboard' || cmd === '/top') {
    const rows = await db
      .select()
      .from(scores)
      .orderBy(desc(scores.bestScore))
      .limit(10)
      .all();

    if (rows.length === 0) {
      await api.sendMessage({
        chat_id: chat.id,
        text: '🏆 No scores yet! Send /play to set the first high score.',
      });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = rows.map((r, i) => {
      const rank = medals[i] || `${i + 1}.`;
      const crown = r.caughtPirzadeh ? ' 👑' : '';
      return `${rank} ${r.displayName}${crown} — *${r.bestScore}*`;
    });

    await api.sendMessage({
      chat_id: chat.id,
      text: `🏆 *HUNT FOR PIRZADEH — LEADERBOARD*\n\n${lines.join('\n')}\n\n👑 = Caught Pirzadeh`,
      parse_mode: 'Markdown',
    });
    return;
  }

  if (cmd === '/myid') {
    await api.sendMessage({
      chat_id: chat.id,
      text: `Your Telegram ID: \`${message.from.id}\``,
      parse_mode: 'Markdown',
    });
  }
}
