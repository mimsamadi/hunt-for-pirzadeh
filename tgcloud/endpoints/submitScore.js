import { db, EndpointError } from 'sdk';
import { desc, eq } from 'sdk/db';
import { scores } from '../schema.js';

function formatPlayerName(user) {
  if (!user) return 'PLAYER';
  if (user.username) return `@${user.username}`;
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'PLAYER';
}

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user || !user.id) {
    throw new EndpointError('Missing verified Telegram user', { code: 'NO_USER' });
  }

  const numericScore = Math.floor(Number(input?.score));
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 5000) {
    throw new EndpointError('Invalid score value', { code: 'INVALID_SCORE' });
  }

  const caught = Boolean(input?.caughtPirzadeh);
  const displayName = formatPlayerName(user);
  const username = user.username || null;

  const existing = await db
    .select()
    .from(scores)
    .where(eq(scores.userId, user.id))
    .get();

  let updated = false;
  let finalBest = numericScore;

  if (!existing) {
    await db
      .insert(scores)
      .values({
        userId: user.id,
        displayName,
        username,
        bestScore: numericScore,
        caughtPirzadeh: caught,
        gamesPlayed: 1,
      })
      .run();
    updated = true;
  } else {
    const newBest = Math.max(existing.bestScore, numericScore);
    updated = numericScore > existing.bestScore;
    finalBest = newBest;

    await db
      .update(scores)
      .set({
        displayName,
        username,
        bestScore: newBest,
        caughtPirzadeh: existing.caughtPirzadeh || caught,
        gamesPlayed: existing.gamesPlayed + 1,
        updatedAt: new Date(),
      })
      .where(eq(scores.userId, user.id))
      .run();
  }

  const rows = await db
    .select()
    .from(scores)
    .orderBy(desc(scores.bestScore))
    .limit(15)
    .all();

  return {
    updated,
    bestScore: finalBest,
    leaderboard: rows.map((r, idx) => ({
      position: idx + 1,
      userId: r.userId,
      name: r.displayName,
      score: r.bestScore,
      caughtPirzadeh: Boolean(r.caughtPirzadeh),
    })),
  };
}
