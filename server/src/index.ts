
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createTaskInputSchema,
  updateTaskInputSchema,
  deleteTaskInputSchema,
  createSectionInputSchema,
  deleteSectionInputSchema,
  renameSectionInputSchema,
  createWeeklyPlanInputSchema,
  updateWeeklyPlanInputSchema,
  getWeeklyPlanInputSchema,
  deleteWeeklyPlanInputSchema
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getSections } from './handlers/get_sections';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { createSection } from './handlers/create_section';
import { deleteSection } from './handlers/delete_section';
import { renameSection } from './handlers/rename_section';
import { createWeeklyPlan } from './handlers/create_weekly_plan';
import { getWeeklyPlan } from './handlers/get_weekly_plan';
import { updateWeeklyPlan } from './handlers/update_weekly_plan';
import { deleteWeeklyPlan } from './handlers/delete_weekly_plan';
import { getAllWeeklyPlans } from './handlers/get_all_weekly_plans';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Task operations
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),

  // Section operations
  getSections: publicProcedure
    .query(() => getSections()),

  createSection: publicProcedure
    .input(createSectionInputSchema)
    .mutation(({ input }) => createSection(input)),

  deleteSection: publicProcedure
    .input(deleteSectionInputSchema)
    .mutation(({ input }) => deleteSection(input)),

  renameSection: publicProcedure
    .input(renameSectionInputSchema)
    .mutation(({ input }) => renameSection(input)),

  // Weekly plan operations
  createWeeklyPlan: publicProcedure
    .input(createWeeklyPlanInputSchema)
    .mutation(({ input }) => createWeeklyPlan(input)),

  getWeeklyPlan: publicProcedure
    .input(getWeeklyPlanInputSchema)
    .query(({ input }) => getWeeklyPlan(input)),

  updateWeeklyPlan: publicProcedure
    .input(updateWeeklyPlanInputSchema)
    .mutation(({ input }) => updateWeeklyPlan(input)),

  deleteWeeklyPlan: publicProcedure
    .input(deleteWeeklyPlanInputSchema)
    .mutation(({ input }) => deleteWeeklyPlan(input)),

  getAllWeeklyPlans: publicProcedure
    .query(() => getAllWeeklyPlans()),
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
