
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { type CreateWeeklyPlanInput } from '../schema';
import { createWeeklyPlan } from '../handlers/create_weekly_plan';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

// Helper to clean up test files
const cleanupTestFiles = async () => {
  try {
    const files = await fs.readdir(WEEKLY_PLANS_DIR);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await fs.unlink(join(WEEKLY_PLANS_DIR, file));
      }
    }
  } catch (error) {
    // Directory doesn't exist or is empty, which is fine
  }
};

// Test inputs
const testInput: CreateWeeklyPlanInput = {
  week_start: new Date('2024-01-15'), // Monday
  short_week_note: 'Focus on project deliverables',
  content: '# Monday\n\n- Review project requirements\n- Team standup\n\n# Tuesday\n\n- Code review session'
};

const testInputWithoutNote: CreateWeeklyPlanInput = {
  week_start: new Date('2024-01-22'), // Monday
  content: '# Monday\n\n- Planning session\n\n# Tuesday\n\n- Development work'
};

describe('createWeeklyPlan', () => {
  beforeEach(async () => {
    await cleanupTestFiles();
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  it('should create a weekly plan with short note', async () => {
    const result = await createWeeklyPlan(testInput);

    // Verify return value
    expect(result.week_start).toEqual(new Date('2024-01-15'));
    expect(result.short_week_note).toEqual('Focus on project deliverables');
    expect(result.content).toEqual(testInput.content);

    // Verify file was created
    const filename = '15-Jan-2024.md';
    const filePath = join(WEEKLY_PLANS_DIR, filename);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Verify file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    const expectedContent = `Focus on project deliverables\n\n# Monday\n\n- Review project requirements\n- Team standup\n\n# Tuesday\n\n- Code review session`;
    expect(fileContent).toEqual(expectedContent);
  });

  it('should create a weekly plan without short note', async () => {
    const result = await createWeeklyPlan(testInputWithoutNote);

    // Verify return value
    expect(result.week_start).toEqual(new Date('2024-01-22'));
    expect(result.short_week_note).toBeNull();
    expect(result.content).toEqual(testInputWithoutNote.content);

    // Verify file was created
    const filename = '22-Jan-2024.md';
    const filePath = join(WEEKLY_PLANS_DIR, filename);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Verify file content (no short note prepended)
    const fileContent = await fs.readFile(filePath, 'utf8');
    expect(fileContent).toEqual(testInputWithoutNote.content);
  });

  it('should create directory if it does not exist', async () => {
    // Remove the directory completely
    try {
      await fs.rmdir(WEEKLY_PLANS_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist, which is fine
    }

    await createWeeklyPlan(testInput);

    // Verify directory was created
    const dirExists = await fs.access(WEEKLY_PLANS_DIR).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);

    // Verify file was created in the new directory
    const filename = '15-Jan-2024.md';
    const filePath = join(WEEKLY_PLANS_DIR, filename);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should throw error if weekly plan already exists', async () => {
    // Create the plan first
    await createWeeklyPlan(testInput);

    // Try to create it again
    await expect(createWeeklyPlan(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should format filename correctly for different dates', async () => {
    const inputs = [
      { date: new Date('2024-01-01'), expected: '01-Jan-2024.md' },
      { date: new Date('2024-12-25'), expected: '25-Dec-2024.md' },
      { date: new Date('2024-07-04'), expected: '04-Jul-2024.md' }
    ];

    for (const { date, expected } of inputs) {
      const input: CreateWeeklyPlanInput = {
        week_start: date,
        content: 'Test content'
      };

      await createWeeklyPlan(input);

      // Verify correct filename was created
      const filePath = join(WEEKLY_PLANS_DIR, expected);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    }
  });
});
