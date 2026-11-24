import { db } from 'sdk';
import { desc, eq } from 'sdk/db';
import { scores } from '../schema.js';

export default async function (input, ctx) {
  const limit = Math.min(25, Math.max(1, Number(input?.limit) || 10));
  const rows = await db
    .select()
    .from(scores)
    .orderBy(desc(scores.bestScore))
    .limit(limit)
    .all();

  let myBest = 0;
  const userId = ctx.initData?.user?.id;
  if (userId) {
    const mine = await db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .get();
    if (mine) myBest = mine.bestScore;
  }

  return {
    myBest,
    leaderboard: rows.map((r, idx) => ({
      position: idx + 1,
      userId: r.userId,
      name: r.displayName,
      score: r.bestScore,
      caughtPirzadeh: Boolean(r.caughtPirzadeh),
    })),
  };
}
