
import { serial, text, pgTable, timestamp, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define priority enum for tasks
export const taskPriorityEnum = pgEnum('task_priority', ['High', 'Medium', 'Low']);

// Sections table (Projects)
export const sectionsTable = pgTable('sections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  priority: taskPriorityEnum('priority').notNull(),
  due_date: date('due_date'), // Nullable by default
  comments: text('comments'), // Nullable by default
  section_id: serial('section_id').references(() => sectionsTable.id).notNull(),
  completed: boolean('completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Weekly plans table
export const weeklyPlansTable = pgTable('weekly_plans', {
  id: serial('id').primaryKey(),
  monday_date: date('monday_date').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  short_week_note: text('short_week_note'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const sectionsRelations = relations(sectionsTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  section: one(sectionsTable, {
    fields: [tasksTable.section_id],
    references: [sectionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Section = typeof sectionsTable.$inferSelect;
export type NewSection = typeof sectionsTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
export type WeeklyPlan = typeof weeklyPlansTable.$inferSelect;
export type NewWeeklyPlan = typeof weeklyPlansTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  sections: sectionsTable, 
  tasks: tasksTable,
  weeklyPlans: weeklyPlansTable
};
