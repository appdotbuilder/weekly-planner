
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { type UpdateWeeklyPlanInput } from '../schema';
import { updateWeeklyPlan } from '../handlers/update_weekly_plan';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function formatWeekFilename(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}.md`;
}

const testWeekStart = new Date('2024-01-01'); // Monday

describe('updateWeeklyPlan', () => {
  beforeEach(async () => {
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(WEEKLY_PLANS_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should update weekly plan content', async () => {
    // Create existing plan
    const filename = formatWeekFilename(testWeekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    const originalContent = '# Week Goals\n- Original task';
    await fs.writeFile(planPath, originalContent);

    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      content: '# Updated Goals\n- Updated task'
    };

    const result = await updateWeeklyPlan(input);

    expect(result.week_start).toEqual(testWeekStart);
    expect(result.content).toEqual('# Updated Goals\n- Updated task');
    expect(result.short_week_note).toBeNull();

    // Verify file was updated
    const updatedFileContent = await fs.readFile(planPath, 'utf-8');
    expect(updatedFileContent).toEqual('# Updated Goals\n- Updated task');
  });

  it('should update short week note', async () => {
    // Create existing plan with content only
    const filename = formatWeekFilename(testWeekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    const originalContent = '# Week Goals\n- Task 1';
    await fs.writeFile(planPath, originalContent);

    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      short_week_note: 'Focus on productivity'
    };

    const result = await updateWeeklyPlan(input);

    expect(result.week_start).toEqual(testWeekStart);
    expect(result.short_week_note).toEqual('Focus on productivity');
    expect(result.content).toEqual('# Week Goals\n- Task 1');

    // Verify file format with short note
    const updatedFileContent = await fs.readFile(planPath, 'utf-8');
    expect(updatedFileContent).toEqual('Focus on productivity\n\n# Week Goals\n- Task 1');
  });

  it('should update both short note and content', async () => {
    // Create existing plan with both
    const filename = formatWeekFilename(testWeekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    const originalContent = 'Original note\n\n# Original Goals\n- Original task';
    await fs.writeFile(planPath, originalContent);

    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      short_week_note: 'Updated note',
      content: '# Updated Goals\n- Updated task'
    };

    const result = await updateWeeklyPlan(input);

    expect(result.week_start).toEqual(testWeekStart);
    expect(result.short_week_note).toEqual('Updated note');
    expect(result.content).toEqual('# Updated Goals\n- Updated task');

    // Verify file content
    const updatedFileContent = await fs.readFile(planPath, 'utf-8');
    expect(updatedFileContent).toEqual('Updated note\n\n# Updated Goals\n- Updated task');
  });

  it('should preserve existing values when not provided', async () => {
    // Create existing plan with both note and content
    const filename = formatWeekFilename(testWeekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    const originalContent = 'Existing note\n\n# Existing Goals\n- Existing task';
    await fs.writeFile(planPath, originalContent);

    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      content: '# New Goals\n- New task'
      // short_week_note not provided - should preserve existing
    };

    const result = await updateWeeklyPlan(input);

    expect(result.week_start).toEqual(testWeekStart);
    expect(result.short_week_note).toEqual('Existing note');
    expect(result.content).toEqual('# New Goals\n- New task');

    // Verify file content preserves existing note
    const updatedFileContent = await fs.readFile(planPath, 'utf-8');
    expect(updatedFileContent).toEqual('Existing note\n\n# New Goals\n- New task');
  });

  it('should remove short note when set to null', async () => {
    // Create existing plan with short note
    const filename = formatWeekFilename(testWeekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    const originalContent = 'Note to remove\n\n# Goals\n- Task 1';
    await fs.writeFile(planPath, originalContent);

    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      short_week_note: null
    };

    const result = await updateWeeklyPlan(input);

    expect(result.short_week_note).toBeNull();
    expect(result.content).toEqual('# Goals\n- Task 1');

    // Verify file has no short note
    const updatedFileContent = await fs.readFile(planPath, 'utf-8');
    expect(updatedFileContent).toEqual('# Goals\n- Task 1');
  });

  it('should throw error when plan does not exist', async () => {
    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      content: 'New content'
    };

    await expect(updateWeeklyPlan(input)).rejects.toThrow(/weekly plan not found/i);
  });

  it('should handle plans with only content (no short note)', async () => {
    // Create plan with only markdown content
    const filename = formatWeekFilename(testWeekStart);
    const planPath = join(WEEKLY_PLANS_DIR, filename);
    const originalContent = '# Week Goals\n- Complete project\n- Review code';
    await fs.writeFile(planPath, originalContent);

    const input: UpdateWeeklyPlanInput = {
      week_start: testWeekStart,
      short_week_note: 'Added note'
    };

    const result = await updateWeeklyPlan(input);

    expect(result.short_week_note).toEqual('Added note');
    expect(result.content).toEqual('# Week Goals\n- Complete project\n- Review code');

    // Verify file now has short note added
    const updatedFileContent = await fs.readFile(planPath, 'utf-8');
    expect(updatedFileContent).toEqual('Added note\n\n# Week Goals\n- Complete project\n- Review code');
  });
});
