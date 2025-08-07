
import { z } from 'zod';

// Priority enum for tasks
export const taskPrioritySchema = z.enum(['High', 'Medium', 'Low']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Task schema for JSON storage
export const taskSchema = z.object({
  id: z.string(), // UUID string for unique identification
  description: z.string(),
  priority: taskPrioritySchema,
  due_date: z.coerce.date().nullable(), // Can be null if no due date
  comments: z.string().nullable(), // Can be null if no comments
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Section (project) schema for JSON storage
export const sectionSchema = z.object({
  name: z.string(), // Section name used as filename
  tasks: z.array(taskSchema)
});

export type Section = z.infer<typeof sectionSchema>;

// Input schemas for task operations
export const createTaskInputSchema = z.object({
  section_name: z.string(),
  description: z.string(),
  priority: taskPrioritySchema,
  due_date: z.coerce.date().nullable().optional(),
  comments: z.string().nullable().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  section_name: z.string(),
  task_id: z.string(),
  description: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  due_date: z.coerce.date().nullable().optional(),
  comments: z.string().nullable().optional(),
  completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const deleteTaskInputSchema = z.object({
  section_name: z.string(),
  task_id: z.string()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Section operation schemas
export const createSectionInputSchema = z.object({
  name: z.string()
});

export type CreateSectionInput = z.infer<typeof createSectionInputSchema>;

export const deleteSectionInputSchema = z.object({
  name: z.string()
});

export type DeleteSectionInput = z.infer<typeof deleteSectionInputSchema>;

export const renameSectionInputSchema = z.object({
  old_name: z.string(),
  new_name: z.string()
});

export type RenameSectionInput = z.infer<typeof renameSectionInputSchema>;

// Weekly plan schema for markdown storage
export const weeklyPlanSchema = z.object({
  week_start: z.coerce.date(), // Monday of the week
  short_week_note: z.string().nullable(),
  content: z.string() // Full markdown content
});

export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;

export const createWeeklyPlanInputSchema = z.object({
  week_start: z.coerce.date(),
  short_week_note: z.string().nullable().optional(),
  content: z.string()
});

export type CreateWeeklyPlanInput = z.infer<typeof createWeeklyPlanInputSchema>;

export const updateWeeklyPlanInputSchema = z.object({
  week_start: z.coerce.date(),
  short_week_note: z.string().nullable().optional(),
  content: z.string().optional()
});

export type UpdateWeeklyPlanInput = z.infer<typeof updateWeeklyPlanInputSchema>;

export const getWeeklyPlanInputSchema = z.object({
  week_start: z.coerce.date()
});

export type GetWeeklyPlanInput = z.infer<typeof getWeeklyPlanInputSchema>;

export const deleteWeeklyPlanInputSchema = z.object({
  week_start: z.coerce.date()
});

export type DeleteWeeklyPlanInput = z.infer<typeof deleteWeeklyPlanInputSchema>;
