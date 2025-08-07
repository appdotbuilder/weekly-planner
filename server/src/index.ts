
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createTaskInputSchema, 
  updateTaskInputSchema,
  createSectionInputSchema,
  updateSectionInputSchema,
  createWeeklyPlanInputSchema,
  updateWeeklyPlanInputSchema,
  duplicateWeeklyPlanInputSchema
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { getTasksBySection } from './handlers/get_tasks_by_section';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { createSection } from './handlers/create_section';
import { getSections } from './handlers/get_sections';
import { updateSection } from './handlers/update_section';
import { deleteSection } from './handlers/delete_section';
import { createWeeklyPlan } from './handlers/create_weekly_plan';
import { getWeeklyPlans } from './handlers/get_weekly_plans';
import { getWeeklyPlanByDate } from './handlers/get_weekly_plan_by_date';
import { updateWeeklyPlan } from './handlers/update_weekly_plan';
import { duplicateWeeklyPlan } from './handlers/duplicate_weekly_plan';
import { deleteWeeklyPlan } from './handlers/delete_weekly_plan';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasks: publicProcedure
    .query(() => getTasks()),
  
  getTasksBySection: publicProcedure
    .input(z.object({ sectionId: z.number() }))
    .query(({ input }) => getTasksBySection(input.sectionId)),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(({ input }) => deleteTask(input.taskId)),

  // Section routes
  createSection: publicProcedure
    .input(createSectionInputSchema)
    .mutation(({ input }) => createSection(input)),
  
  getSections: publicProcedure
    .query(() => getSections()),
  
  updateSection: publicProcedure
    .input(updateSectionInputSchema)
    .mutation(({ input }) => updateSection(input)),
  
  deleteSection: publicProcedure
    .input(z.object({ sectionId: z.number() }))
    .mutation(({ input }) => deleteSection(input.sectionId)),

  // Weekly plan routes
  createWeeklyPlan: publicProcedure
    .input(createWeeklyPlanInputSchema)
    .mutation(({ input }) => createWeeklyPlan(input)),
  
  getWeeklyPlans: publicProcedure
    .query(() => getWeeklyPlans()),
  
  getWeeklyPlanByDate: publicProcedure
    .input(z.object({ mondayDate: z.coerce.date() }))
    .query(({ input }) => getWeeklyPlanByDate(input.mondayDate)),
  
  updateWeeklyPlan: publicProcedure
    .input(updateWeeklyPlanInputSchema)
    .mutation(({ input }) => updateWeeklyPlan(input)),
  
  duplicateWeeklyPlan: publicProcedure
    .input(duplicateWeeklyPlanInputSchema)
    .mutation(({ input }) => duplicateWeeklyPlan(input)),
  
  deleteWeeklyPlan: publicProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(({ input }) => deleteWeeklyPlan(input.planId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
