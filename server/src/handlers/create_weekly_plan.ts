
import { promises as fs } from 'fs';
import { join } from 'path';
import { type CreateWeeklyPlanInput, type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function formatWeekFilename(date: Date): string {
  // Format as DD-MMM-YYYY.md (e.g., 15-Jan-2024.md)
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}.md`;
}

export async function createWeeklyPlan(input: CreateWeeklyPlanInput): Promise<WeeklyPlan> {
  const filename = formatWeekFilename(input.week_start);
  const planPath = join(WEEKLY_PLANS_DIR, filename);

  const newPlan: WeeklyPlan = {
    week_start: input.week_start,
    short_week_note: input.short_week_note || null,
    content: input.content
  };

  try {
    // Ensure weekly plans directory exists
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });

    // Check if plan already exists
    try {
      await fs.access(planPath);
      throw new Error('Weekly plan already exists');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // Create markdown content with short note at top if provided
    let markdownContent = '';
    if (newPlan.short_week_note) {
      markdownContent += `${newPlan.short_week_note}\n\n`;
    }
    markdownContent += newPlan.content;

    // Write markdown file
    await fs.writeFile(planPath, markdownContent, 'utf8');

    return newPlan;
  } catch (error) {
    console.error('Weekly plan creation failed:', error);
    throw error;
  }
}
