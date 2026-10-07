import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const cases = sqliteTable('user_cases', {
 id: text('id').primaryKey(), userId: text('user_id').notNull(), payload: text('payload').notNull(), createdAt: text('created_at').notNull()
});
