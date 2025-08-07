
import { z } from 'zod';

// Task priority enum
export const taskPrioritySchema = z.enum(['High', 'Medium', 'Low']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  description: z.string(),
  priority: taskPrioritySchema,
  due_date: z.coerce.date().nullable(),
  comments: z.string().nullable(),
  section_id: z.number(),
  completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  priority: taskPrioritySchema,
  due_date: z.coerce.date().nullable().optional(),
  comments: z.string().nullable().optional(),
  section_id: z.number(),
  completed: z.boolean().optional().default(false)
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1).optional(),
  priority: taskPrioritySchema.optional(),
  due_date: z.coerce.date().nullable().optional(),
  comments: z.string().nullable().optional(),
  completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Section (Project) schema
export const sectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Section = z.infer<typeof sectionSchema>;

// Input schema for creating sections
export const createSectionInputSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  description: z.string().nullable().optional()
});

export type CreateSectionInput = z.infer<typeof createSectionInputSchema>;

// Input schema for updating sections
export const updateSectionInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateSectionInput = z.infer<typeof updateSectionInputSchema>;

// Weekly plan schema
export const weeklyPlanSchema = z.object({
  id: z.number(),
  monday_date: z.coerce.date(),
  title: z.string(),
  content: z.string(),
  short_week_note: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;

// Input schema for creating weekly plans
export const createWeeklyPlanInputSchema = z.object({
  monday_date: z.coerce.date(),
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  short_week_note: z.string().nullable().optional()
});

export type CreateWeeklyPlanInput = z.infer<typeof createWeeklyPlanInputSchema>;

// Input schema for updating weekly plans
export const updateWeeklyPlanInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  short_week_note: z.string().nullable().optional()
});

export type UpdateWeeklyPlanInput = z.infer<typeof updateWeeklyPlanInputSchema>;

// Input schema for duplicating weekly plans
export const duplicateWeeklyPlanInputSchema = z.object({
  source_plan_id: z.number(),
  new_monday_date: z.coerce.date(),
  new_title: z.string().min(1, "Title is required")
});

export type DuplicateWeeklyPlanInput = z.infer<typeof duplicateWeeklyPlanInputSchema>;
