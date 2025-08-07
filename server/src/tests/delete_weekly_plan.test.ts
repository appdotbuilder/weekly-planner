
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { deleteWeeklyPlan } from '../handlers/delete_weekly_plan';
import { type DeleteWeeklyPlanInput } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function formatWeekFilename(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}.md`;
}

describe('deleteWeeklyPlan', () => {
  beforeEach(async () => {
    // Ensure directory exists
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(WEEKLY_PLANS_DIR);
      for (const file of files) {
        if (file.endsWith('.md')) {
          await fs.unlink(join(WEEKLY_PLANS_DIR, file));
        }
      }
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  it('should delete an existing weekly plan', async () => {
    const weekStart = new Date('2024-01-01'); // Monday
    const testInput: DeleteWeeklyPlanInput = {
      week_start: weekStart
    };

    // Create test file first
    const filename = formatWeekFilename(weekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    await fs.writeFile(planPath, '# Weekly Plan\n\nTest content');

    // Verify file exists
    await fs.access(planPath);

    // Delete the plan
    const result = await deleteWeeklyPlan(testInput);

    expect(result).toBe(true);

    // Verify file no longer exists
    await expect(fs.access(planPath)).rejects.toThrow();
  });

  it('should throw error when weekly plan does not exist', async () => {
    const weekStart = new Date('2024-02-05'); // Monday
    const testInput: DeleteWeeklyPlanInput = {
      week_start: weekStart
    };

    await expect(deleteWeeklyPlan(testInput)).rejects.toThrow(/Weekly plan not found/i);
  });

  it('should handle different date formats correctly', async () => {
    const weekStart = new Date('2024-12-30'); // Monday in December
    const testInput: DeleteWeeklyPlanInput = {
      week_start: weekStart
    };

    // Create test file
    const filename = formatWeekFilename(weekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    await fs.writeFile(planPath, '# End of Year Plan\n\nDecember tasks');

    // Delete the plan
    const result = await deleteWeeklyPlan(testInput);

    expect(result).toBe(true);
    await expect(fs.access(planPath)).rejects.toThrow();
  });
});
