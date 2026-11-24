import { api } from 'sdk';
import { OWNER_TELEGRAM_ID } from '../lib/config.js';

export default async function (mcm) {
  const chat = mcm.chat;
  const isGroup = chat?.type === 'group' || chat?.type === 'supergroup';
  const newStatus = mcm.new_chat_member?.status;
  const oldStatus = mcm.old_chat_member?.status;
  const justJoined =
    (newStatus === 'member' || newStatus === 'administrator') &&
    (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus);

  if (!isGroup || !justJoined) return;

  const actorId = mcm.from?.id;
  if (actorId !== OWNER_TELEGRAM_ID) {
    // Only the owner is allowed to add this bot to groups
    await api.leaveChat({ chat_id: chat.id });
    return;
  }

  await api.sendMessage({
    chat_id: chat.id,
    text: '🎮 *Hunt for Pirzadeh* is ready!\nSend /play to launch the game or /leaderboard to see the top hunters.',
    parse_mode: 'Markdown',
  });
}
