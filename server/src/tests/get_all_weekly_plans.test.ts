
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getAllWeeklyPlans } from '../handlers/get_all_weekly_plans';
import { type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

// Helper to clean up test files
const cleanupTestFiles = async () => {
  try {
    await fs.rm(WEEKLY_PLANS_DIR, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, ignore error
  }
};

// Helper to create test weekly plan file
const createTestWeeklyPlan = async (filename: string, content: string) => {
  await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });
  const filePath = join(WEEKLY_PLANS_DIR, filename);
  await fs.writeFile(filePath, content, 'utf-8');
};

describe('getAllWeeklyPlans', () => {
  beforeEach(async () => {
    await cleanupTestFiles();
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  it('should return empty array when no weekly plans exist', async () => {
    const result = await getAllWeeklyPlans();
    
    expect(result).toEqual([]);
  });

  it('should return weekly plan with content only', async () => {
    const markdownContent = `# Week Goals

- Complete project A
- Review code
- Plan next sprint`;

    await createTestWeeklyPlan('15-Jan-2024.md', markdownContent);

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 0, 15)); // January 15, 2024
    expect(result[0].short_week_note).toBeNull();
    expect(result[0].content).toEqual(markdownContent);
  });

  it('should extract short note from content with headings', async () => {
    const shortNote = 'This is a busy week with multiple deadlines.';
    const mainContent = `# Week Goals

- Complete project A
- Review code

# Notes

Important things to remember.`;

    const markdownContent = `${shortNote}

${mainContent}`;

    await createTestWeeklyPlan('22-Jan-2024.md', markdownContent);

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 0, 22)); // January 22, 2024
    expect(result[0].short_week_note).toEqual(shortNote);
    expect(result[0].content).toEqual(mainContent);
  });

  it('should extract short note from content without headings', async () => {
    const shortNote = 'Light week focused on planning.';
    const mainContent = 'Just some general notes and thoughts about the upcoming work.';

    const markdownContent = `${shortNote}

${mainContent}`;

    await createTestWeeklyPlan('29-Jan-2024.md', markdownContent);

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 0, 29)); // January 29, 2024
    expect(result[0].short_week_note).toEqual(shortNote);
    expect(result[0].content).toEqual(mainContent);
  });

  it('should handle content starting with heading (no short note)', async () => {
    const markdownContent = `# Week Goals

- Complete project A
- Review code`;

    await createTestWeeklyPlan('05-Feb-2024.md', markdownContent);

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].week_start).toEqual(new Date(2024, 1, 5)); // February 5, 2024
    expect(result[0].short_week_note).toBeNull();
    expect(result[0].content).toEqual(markdownContent);
  });

  it('should return multiple weekly plans sorted by date (newest first)', async () => {
    await createTestWeeklyPlan('15-Jan-2024.md', '# Week 1 Content');
    await createTestWeeklyPlan('29-Jan-2024.md', '# Week 3 Content');
    await createTestWeeklyPlan('22-Jan-2024.md', '# Week 2 Content');

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(3);
    // Should be sorted newest first
    expect(result[0].week_start).toEqual(new Date(2024, 0, 29)); // January 29
    expect(result[1].week_start).toEqual(new Date(2024, 0, 22)); // January 22
    expect(result[2].week_start).toEqual(new Date(2024, 0, 15)); // January 15
  });

  it('should ignore invalid filename formats', async () => {
    await createTestWeeklyPlan('15-Jan-2024.md', '# Valid file');
    await createTestWeeklyPlan('invalid-file.md', '# Invalid file');
    await createTestWeeklyPlan('15-January-2024.md', '# Invalid month format');
    await createTestWeeklyPlan('README.txt', 'Not a markdown file');

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('# Valid file');
  });

  it('should handle different month abbreviations correctly', async () => {
    await createTestWeeklyPlan('15-Mar-2024.md', '# March plan');
    await createTestWeeklyPlan('15-Dec-2024.md', '# December plan');
    await createTestWeeklyPlan('15-Jun-2024.md', '# June plan');

    const result = await getAllWeeklyPlans();

    expect(result).toHaveLength(3);
    
    // Check dates are parsed correctly
    const marchPlan = result.find(p => p.content === '# March plan');
    const decPlan = result.find(p => p.content === '# December plan');
    const junePlan = result.find(p => p.content === '# June plan');

    expect(marchPlan?.week_start).toEqual(new Date(2024, 2, 15)); // March
    expect(decPlan?.week_start).toEqual(new Date(2024, 11, 15)); // December
    expect(junePlan?.week_start).toEqual(new Date(2024, 5, 15)); // June
  });

  it('should handle file read errors gracefully', async () => {
    await createTestWeeklyPlan('15-Jan-2024.md', '# Valid content');
    
    // Create a valid filename but we'll simulate a read error by creating a directory with that name
    const invalidPath = join(WEEKLY_PLANS_DIR, '22-Jan-2024.md');
    await fs.mkdir(invalidPath, { recursive: true });

    const result = await getAllWeeklyPlans();

    // Should return the valid file and skip the invalid one
    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('# Valid content');
  });

  it('should create directory if it does not exist', async () => {
    // Ensure directory doesn't exist
    await cleanupTestFiles();
    
    const result = await getAllWeeklyPlans();
    
    expect(result).toEqual([]);
    
    // Verify directory was created
    const stats = await fs.stat(WEEKLY_PLANS_DIR);
    expect(stats.isDirectory()).toBe(true);
  });
});
