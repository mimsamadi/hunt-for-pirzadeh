import { table, integer, text, boolean, index, sql } from 'sdk/db';

export const scores = table(
  'scores',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').unique().notNull(),
    displayName: text('display_name').notNull(),
    username: text('username'),
    bestScore: integer('best_score').notNull().default(0),
    caughtPirzadeh: boolean('caught_pirzadeh').notNull().default(false),
    gamesPlayed: integer('games_played').notNull().default(1),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    bestScoreIdx: index('idx_scores_best_score').on(t.bestScore),
  })
);
