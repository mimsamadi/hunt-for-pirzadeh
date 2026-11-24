import {
  GAME_SHORT_NAME,
  getOwnerId,
  getWebhookSecret,
  signSession,
  tgApi,
} from './_lib/telegram.js';

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, bot: 'HuntForPirzadehBot' });
  }

  const secret = getWebhookSecret();
  if (secret) {
    const incoming = req.headers['x-telegram-bot-api-secret-token'];
    if (incoming !== secret) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }

  const update = req.body || {};

  try {
    // 1. OWNER-ONLY GROUP ADDITION PROTECTION
    if (update.my_chat_member) {
      const mcm = update.my_chat_member;
      const chat = mcm.chat;
      const actorId = mcm.from?.id;
      const newStatus = mcm.new_chat_member?.status;
      const oldStatus = mcm.old_chat_member?.status;
      const isGroup = chat?.type === 'group' || chat?.type === 'supergroup';
      const justJoined =
        (newStatus === 'member' || newStatus === 'administrator') &&
        (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus);

      if (isGroup && justJoined) {
        const ownerId = getOwnerId();
        if (ownerId && actorId !== ownerId) {
          // Unauthorized user tried to add the bot to a group -> leave immediately!
          await tgApi('leaveChat', { chat_id: chat.id }).catch(() => {});
          return res.status(200).json({ ok: true, action: 'left_unauthorized_group' });
        }

        // Owner added the bot -> greet and invite players to /play
        await tgApi('sendMessage', {
          chat_id: chat.id,
          text: '🎮 *Hunt for Pirzadeh* is ready!\nType /play to start a 60-second round and climb the group leaderboard.',
          parse_mode: 'Markdown',
        }).catch(() => {});
        return res.status(200).json({ ok: true, action: 'joined_owner_group' });
      }
    }

    // 2. INLINE MODE (@HuntForPirzadehBot)
    if (update.inline_query) {
      const iq = update.inline_query;
      await tgApi('answerInlineQuery', {
        inline_query_id: iq.id,
        cache_time: 10,
        results: [
          {
            type: 'game',
            id: GAME_SHORT_NAME,
            game_short_name: GAME_SHORT_NAME,
          },
        ],
      });
      return res.status(200).json({ ok: true });
    }

    // 3. PLAY BUTTON CLICKED ON GAME CARD
    if (update.callback_query) {
      const cb = update.callback_query;
      if (cb.game_short_name === GAME_SHORT_NAME) {
        const sessionPayload = {
          user_id: cb.from.id,
          name: cb.from.username
            ? `@${cb.from.username}`
            : [cb.from.first_name, cb.from.last_name].filter(Boolean).join(' ') || 'PLAYER',
        };

        if (cb.inline_message_id) {
          sessionPayload.inline_message_id = cb.inline_message_id;
        } else if (cb.message?.chat?.id && cb.message?.message_id) {
          sessionPayload.chat_id = cb.message.chat.id;
          sessionPayload.message_id = cb.message.message_id;
        }

        const token = signSession(sessionPayload);
        const gameUrl = `${getBaseUrl(req)}/?tg_session=${encodeURIComponent(token)}`;

        await tgApi('answerCallbackQuery', {
          callback_query_id: cb.id,
          url: gameUrl,
        });
      } else {
        await tgApi('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: 'Unknown game.',
          show_alert: false,
        }).catch(() => {});
      }
      return res.status(200).json({ ok: true });
    }

    // 4. COMMANDS (/start, /play, /myid)
    if (update.message?.text) {
      const msg = update.message;
      const rawText = msg.text.trim();
      const cmd = rawText.split(/\s+/)[0].split('@')[0].toLowerCase();

      if (cmd === '/play' || (cmd === '/start' && msg.chat.type === 'private')) {
        await tgApi('sendGame', {
          chat_id: msg.chat.id,
          game_short_name: GAME_SHORT_NAME,
        });
      } else if (cmd === '/myid') {
        await tgApi('sendMessage', {
          chat_id: msg.chat.id,
          text: `Your Telegram ID: \`${msg.from.id}\``,
          parse_mode: 'Markdown',
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to Telegram so it doesn't retry endlessly on non-transient errors
    return res.status(200).json({ ok: false, error: err.message });
  }
}
