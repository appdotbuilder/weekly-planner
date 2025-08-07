
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getWeeklyPlans } from '../handlers/get_weekly_plans';

const TEST_WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly_plans');

// Helper function to create test weekly plan files
async function createTestWeeklyPlan(filename: string, content: string) {
  await fs.mkdir(TEST_WEEKLY_PLANS_DIR, { recursive: true });
  await fs.writeFile(join(TEST_WEEKLY_PLANS_DIR, filename), content, 'utf-8');
}

// Helper function to clean up test files
async function cleanupTestFiles() {
  try {
    const files = await fs.readdir(TEST_WEEKLY_PLANS_DIR);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await fs.unlink(join(TEST_WEEKLY_PLANS_DIR, file));
      }
    }
  } catch (error) {
    // Directory might not exist, ignore
  }
}

describe('getWeeklyPlans', () => {
  beforeEach(async () => {
    await cleanupTestFiles();
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  it('should return empty array when no weekly plans exist', async () => {
    const result = await getWeeklyPlans();
    expect(result).toEqual([]);
  });

  it('should return weekly plans from markdown files', async () => {
    // Create test weekly plan files
    await createTestWeeklyPlan('01-Jan-2024.md', `# Week Overview\n\n- Task 1\n- Task 2`);
    await createTestWeeklyPlan('08-Jan-2024.md', `Weekly note\n\n# Goals\n\n- Goal 1\n- Goal 2`);

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(2);
    
    // Should be ordered by date descending (most recent first)
    expect(result[0].week_start).toEqual(new Date(2024, 0, 8)); // Jan 8, 2024
    expect(result[1].week_start).toEqual(new Date(2024, 0, 1)); // Jan 1, 2024
  });

  it('should parse weekly plan content correctly', async () => {
    const content = `# Week Overview\n\n- Task 1\n- Task 2\n\n# Notes\n\n- Important note`;
    await createTestWeeklyPlan('15-Mar-2024.md', content);

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 2, 15)); // Mar 15, 2024
    expect(result[0].short_week_note).toBeNull();
    expect(result[0].content).toEqual(content);
  });

  it('should extract short week note from content', async () => {
    const content = `This is a short week note\n\n# Week Overview\n\n- Task 1\n- Task 2`;
    await createTestWeeklyPlan('22-Dec-2024.md', content);

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 11, 22)); // Dec 22, 2024
    expect(result[0].short_week_note).toEqual('This is a short week note');
    expect(result[0].content).toEqual('# Week Overview\n\n- Task 1\n- Task 2');
  });

  it('should handle multiple weekly plans and sort by date descending', async () => {
    // Create files in non-chronological order
    await createTestWeeklyPlan('01-Jun-2024.md', `June content`);
    await createTestWeeklyPlan('01-Apr-2024.md', `April content`);
    await createTestWeeklyPlan('01-May-2024.md', `May content`);

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(3);
    
    // Should be sorted by date descending
    expect(result[0].week_start).toEqual(new Date(2024, 5, 1)); // Jun 1, 2024
    expect(result[0].content).toEqual('June content');
    
    expect(result[1].week_start).toEqual(new Date(2024, 4, 1)); // May 1, 2024
    expect(result[1].content).toEqual('May content');
    
    expect(result[2].week_start).toEqual(new Date(2024, 3, 1)); // Apr 1, 2024
    expect(result[2].content).toEqual('April content');
  });

  it('should ignore non-markdown files', async () => {
    await createTestWeeklyPlan('01-Jan-2024.md', `# Valid plan`);
    await fs.writeFile(join(TEST_WEEKLY_PLANS_DIR, 'not-a-plan.txt'), 'Not a markdown file');
    await fs.writeFile(join(TEST_WEEKLY_PLANS_DIR, 'README.md'), 'Not a date-formatted file');

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('# Valid plan');
  });

  it('should handle empty content files', async () => {
    await createTestWeeklyPlan('01-Feb-2024.md', '');

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 1, 1)); // Feb 1, 2024
    expect(result[0].short_week_note).toBeNull();
    expect(result[0].content).toEqual('');
  });

  it('should handle content with only short week note', async () => {
    await createTestWeeklyPlan('01-Jul-2024.md', 'Just a short note');

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].short_week_note).toBeNull(); // Should not extract as short note without proper structure
    expect(result[0].content).toEqual('Just a short note');
  });

  it('should handle content with short note and proper structure', async () => {
    const content = 'Short note here\n\n# Main Content\n\nSome tasks';
    await createTestWeeklyPlan('01-Aug-2024.md', content);

    const result = await getWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].short_week_note).toEqual('Short note here');
    expect(result[0].content).toEqual('# Main Content\n\nSome tasks');
  });
});
