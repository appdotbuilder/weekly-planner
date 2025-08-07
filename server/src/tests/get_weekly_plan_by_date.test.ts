
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getWeeklyPlanByDate } from '../handlers/get_weekly_plan_by_date';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

// Helper function to format date as DD-MMM-YYYY
const formatWeekDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

describe('getWeeklyPlanByDate', () => {
  beforeEach(async () => {
    // Ensure directory exists for tests
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

  it('should return weekly plan when file exists', async () => {
    const testDate = new Date('2024-01-08'); // A Monday
    const filename = formatWeekDate(testDate);
    const content = `# Week of ${filename}\n\n## Tasks\n- Complete project`;
    
    // Create test file
    await fs.writeFile(join(WEEKLY_PLANS_DIR, `${filename}.md`), content);
    
    const result = await getWeeklyPlanByDate(testDate);
    
    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(testDate);
    expect(result!.content).toEqual(content);
    expect(result!.short_week_note).toBeNull(); // Content starts with heading
  });

  it('should extract short_week_note from content', async () => {
    const testDate = new Date('2024-01-15'); // A Monday
    const filename = formatWeekDate(testDate);
    const shortNote = 'Focus on important deliverables this week';
    const content = `${shortNote}\n\n# Week Planning\n\n## Goals\n- Finish report`;
    
    // Create test file
    await fs.writeFile(join(WEEKLY_PLANS_DIR, `${filename}.md`), content);
    
    const result = await getWeeklyPlanByDate(testDate);
    
    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(testDate);
    expect(result!.content).toEqual(content);
    expect(result!.short_week_note).toEqual(shortNote);
  });

  it('should return null when file does not exist', async () => {
    const testDate = new Date('2024-02-05'); // A Monday
    
    const result = await getWeeklyPlanByDate(testDate);
    
    expect(result).toBeNull();
  });

  it('should handle different date formats correctly', async () => {
    const testDate = new Date('2024-03-04'); // A Monday
    const filename = formatWeekDate(testDate);
    const content = '# March Planning\n\n- Spring tasks';
    
    // Create test file with proper filename format
    await fs.writeFile(join(WEEKLY_PLANS_DIR, `${filename}.md`), content);
    
    const result = await getWeeklyPlanByDate(testDate);
    
    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(testDate);
    expect(result!.content).toEqual(content);
  });

  it('should handle empty content correctly', async () => {
    const testDate = new Date('2024-04-01'); // A Monday
    const filename = formatWeekDate(testDate);
    const content = '';
    
    // Create empty test file
    await fs.writeFile(join(WEEKLY_PLANS_DIR, `${filename}.md`), content);
    
    const result = await getWeeklyPlanByDate(testDate);
    
    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(testDate);
    expect(result!.content).toEqual(content);
    expect(result!.short_week_note).toBeNull();
  });

  it('should create weekly plans directory if it does not exist', async () => {
    // Remove directory first
    try {
      await fs.rmdir(WEEKLY_PLANS_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
    
    const testDate = new Date('2024-05-06'); // A Monday
    
    const result = await getWeeklyPlanByDate(testDate);
    
    // Should return null but not throw an error
    expect(result).toBeNull();
    
    // Directory should be created
    const stats = await fs.stat(WEEKLY_PLANS_DIR);
    expect(stats.isDirectory()).toBe(true);
  });
});
