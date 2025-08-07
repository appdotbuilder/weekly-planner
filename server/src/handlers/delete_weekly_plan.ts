
import { promises as fs } from 'fs';
import { join } from 'path';
import { type DeleteWeeklyPlanInput } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function formatWeekFilename(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}.md`;
}

export async function deleteWeeklyPlan(input: DeleteWeeklyPlanInput): Promise<boolean> {
  try {
    const filename = formatWeekFilename(input.week_start);
    const planPath = join(WEEKLY_PLANS_DIR, filename);

    // Check if file exists before attempting deletion
    await fs.access(planPath);
    
    // Delete the file
    await fs.unlink(planPath);
    
    return true;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error('Weekly plan not found');
    }
    console.error('Weekly plan deletion failed:', error);
    throw error;
  }
}
