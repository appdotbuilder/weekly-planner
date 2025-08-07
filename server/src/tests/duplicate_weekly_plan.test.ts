
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { duplicateWeeklyPlan } from '../handlers/duplicate_weekly_plan';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

// Helper function to format date as DD-MMM-YYYY
const formatWeekStart = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

// Helper function to ensure directory exists
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Helper function to clean up test files
const cleanupTestFiles = async () => {
  try {
    const files = await fs.readdir(WEEKLY_PLANS_DIR);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await fs.unlink(join(WEEKLY_PLANS_DIR, file));
      }
    }
  } catch {
    // Directory might not exist, ignore
  }
};

describe('duplicateWeeklyPlan', () => {
  beforeEach(async () => {
    await ensureDirectoryExists(WEEKLY_PLANS_DIR);
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  it('should duplicate a weekly plan with new date', async () => {
    const sourceDate = new Date('2024-01-01'); // Monday
    const targetDate = new Date('2024-01-08'); // Next Monday
    
    const sourceContent = `# Week of 01-Jan-2024

Short note about this week

## Goals
- Complete project A
- Review code
- Plan next sprint

## Tasks
- [ ] Task 1
- [ ] Task 2
- [x] Completed task`;

    // Create source file
    const sourceFilename = `${formatWeekStart(sourceDate)}.md`;
    await fs.writeFile(join(WEEKLY_PLANS_DIR, sourceFilename), sourceContent, 'utf-8');

    // Duplicate the plan
    const result = await duplicateWeeklyPlan({
      source_week_start: sourceDate,
      target_week_start: targetDate
    });

    // Verify result structure
    expect(result.week_start).toEqual(targetDate);
    expect(result.short_week_note).toEqual('Short note about this week');
    expect(result.content).toContain('Week of 08-Jan-2024');
    expect(result.content).toContain('Complete project A');
    expect(result.content).toContain('Task 1');

    // Verify target file was created
    const targetFilename = `${formatWeekStart(targetDate)}.md`;
    const targetFilePath = join(WEEKLY_PLANS_DIR, targetFilename);
    const targetFileExists = await fs.access(targetFilePath).then(() => true).catch(() => false);
    expect(targetFileExists).toBe(true);

    // Verify target file content
    const targetContent = await fs.readFile(targetFilePath, 'utf-8');
    expect(targetContent).toContain('Week of 08-Jan-2024');
    expect(targetContent).not.toContain('Week of 01-Jan-2024');
  });

  it('should handle content without week heading', async () => {
    const sourceDate = new Date('2024-01-15');
    const targetDate = new Date('2024-01-22');
    
    const sourceContent = `## Goals
- Complete project B
- Review documentation

## Notes
Some important notes here`;

    // Create source file
    const sourceFilename = `${formatWeekStart(sourceDate)}.md`;
    await fs.writeFile(join(WEEKLY_PLANS_DIR, sourceFilename), sourceContent, 'utf-8');

    // Duplicate the plan
    const result = await duplicateWeeklyPlan({
      source_week_start: sourceDate,
      target_week_start: targetDate
    });

    // Should add week heading
    expect(result.content).toContain('Week of 22-Jan-2024');
    expect(result.content).toContain('Complete project B');
    expect(result.short_week_note).toBeNull(); // No short note immediately after main heading
  });

  it('should extract short week note correctly', async () => {
    const sourceDate = new Date('2024-02-05');
    const targetDate = new Date('2024-02-12');
    
    const sourceContent = `# Week of 05-Feb-2024
This is a short week note
## Goals
- Goal 1`;

    // Create source file  
    const sourceFilename = `${formatWeekStart(sourceDate)}.md`;
    await fs.writeFile(join(WEEKLY_PLANS_DIR, sourceFilename), sourceContent, 'utf-8');

    // Duplicate the plan
    const result = await duplicateWeeklyPlan({
      source_week_start: sourceDate,
      target_week_start: targetDate
    });

    expect(result.short_week_note).toEqual('This is a short week note');
    expect(result.content).toContain('Week of 12-Feb-2024');
  });

  it('should throw error when source file does not exist', async () => {
    const sourceDate = new Date('2024-03-01');
    const targetDate = new Date('2024-03-08');

    await expect(duplicateWeeklyPlan({
      source_week_start: sourceDate,
      target_week_start: targetDate
    })).rejects.toThrow(/source weekly plan not found/i);
  });

  it('should throw error when target file already exists', async () => {
    const sourceDate = new Date('2024-04-01');
    const targetDate = new Date('2024-04-08');
    
    const sourceContent = `# Week of 01-Apr-2024\nSome content`;
    const targetContent = `# Week of 08-Apr-2024\nExisting content`;

    // Create both source and target files
    const sourceFilename = `${formatWeekStart(sourceDate)}.md`;
    const targetFilename = `${formatWeekStart(targetDate)}.md`;
    
    await fs.writeFile(join(WEEKLY_PLANS_DIR, sourceFilename), sourceContent, 'utf-8');
    await fs.writeFile(join(WEEKLY_PLANS_DIR, targetFilename), targetContent, 'utf-8');

    await expect(duplicateWeeklyPlan({
      source_week_start: sourceDate,
      target_week_start: targetDate
    })).rejects.toThrow(/target weekly plan already exists/i);
  });

  it('should preserve specific dates while updating week heading', async () => {
    const sourceDate = new Date('2024-05-06');
    const targetDate = new Date('2024-05-13');
    
    const sourceContent = `# Week of 06-May-2024

Meeting scheduled for 08-May-2024
Deadline: 10-May-2024

## Tasks
- Review by specific date`;

    // Create source file
    const sourceFilename = `${formatWeekStart(sourceDate)}.md`;
    await fs.writeFile(join(WEEKLY_PLANS_DIR, sourceFilename), sourceContent, 'utf-8');

    // Duplicate the plan
    const result = await duplicateWeeklyPlan({
      source_week_start: sourceDate,
      target_week_start: targetDate
    });

    // Main week heading should be updated
    expect(result.content).toContain('Week of 13-May-2024');
    expect(result.content).not.toContain('Week of 06-May-2024');
    
    // Other specific date references should remain unchanged
    expect(result.content).toContain('08-May-2024');
    expect(result.content).toContain('10-May-2024');
    expect(result.content).toContain('Review by specific date');
  });
});
