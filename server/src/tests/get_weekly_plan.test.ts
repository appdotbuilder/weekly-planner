
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getWeeklyPlan } from '../handlers/get_weekly_plan';
import { type GetWeeklyPlanInput } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

// Test data
const mondayDate = new Date('2024-01-08'); // A Monday
const testInput: GetWeeklyPlanInput = {
  week_start: mondayDate
};

const setupTestDirectory = async () => {
  try {
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
};

const cleanupTestFiles = async () => {
  try {
    const files = await fs.readdir(WEEKLY_PLANS_DIR);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await fs.unlink(join(WEEKLY_PLANS_DIR, file));
      }
    }
  } catch (error) {
    // Directory might not exist
  }
};

describe('getWeeklyPlan', () => {
  beforeEach(setupTestDirectory);
  afterEach(cleanupTestFiles);

  it('should return null when plan file does not exist', async () => {
    const result = await getWeeklyPlan(testInput);
    expect(result).toBeNull();
  });

  it('should read plan with content only (no short note)', async () => {
    const markdownContent = `# Week Goals

- Complete project setup
- Review documentation

## Tasks
- Task 1
- Task 2`;

    const filename = '08-Jan-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), markdownContent);

    const result = await getWeeklyPlan(testInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(mondayDate);
    expect(result!.short_week_note).toBeNull();
    expect(result!.content).toEqual(markdownContent);
  });

  it('should parse plan with short note and content', async () => {
    const markdownContent = `This week focus on completing the initial setup and documentation.

# Week Goals

- Complete project setup
- Review documentation

## Daily Tasks
- Monday: Setup
- Tuesday: Documentation`;

    const filename = '08-Jan-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), markdownContent);

    const result = await getWeeklyPlan(testInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(mondayDate);
    expect(result!.short_week_note).toEqual('This week focus on completing the initial setup and documentation.');
    expect(result!.content).toEqual(`# Week Goals

- Complete project setup
- Review documentation

## Daily Tasks
- Monday: Setup
- Tuesday: Documentation`);
  });

  it('should handle plan with only short note (no headings)', async () => {
    const markdownContent = `Light week, focusing on planning and preparation for next sprint.`;

    const filename = '08-Jan-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), markdownContent);

    const result = await getWeeklyPlan(testInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(mondayDate);
    expect(result!.short_week_note).toEqual(markdownContent);
    expect(result!.content).toEqual('');
  });

  it('should handle empty file', async () => {
    const filename = '08-Jan-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), '');

    const result = await getWeeklyPlan(testInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(mondayDate);
    expect(result!.short_week_note).toBeNull();
    expect(result!.content).toEqual('');
  });

  it('should handle plan with multiple short note paragraphs', async () => {
    const markdownContent = `This is the first paragraph of the short note.

This is the second paragraph of the short note.

# Main Content

Content starts here.`;

    const filename = '08-Jan-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), markdownContent);

    const result = await getWeeklyPlan(testInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(mondayDate);
    expect(result!.short_week_note).toEqual(`This is the first paragraph of the short note.

This is the second paragraph of the short note.`);
    expect(result!.content).toEqual(`# Main Content

Content starts here.`);
  });

  it('should format filename correctly for different dates', async () => {
    // Test different date
    const differentDate = new Date('2024-12-02'); // December 2nd
    const differentInput: GetWeeklyPlanInput = {
      week_start: differentDate
    };

    const markdownContent = `# December Goals

- Year-end wrap up`;

    const filename = '02-Dec-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), markdownContent);

    const result = await getWeeklyPlan(differentInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(differentDate);
    expect(result!.content).toEqual(markdownContent);
  });

  it('should handle plan starting with heading immediately', async () => {
    const markdownContent = `# Immediate Start

No note above this heading.

## Section 2
More content.`;

    const filename = '08-Jan-2024.md';
    await fs.writeFile(join(WEEKLY_PLANS_DIR, filename), markdownContent);

    const result = await getWeeklyPlan(testInput);

    expect(result).not.toBeNull();
    expect(result!.week_start).toEqual(mondayDate);
    expect(result!.short_week_note).toBeNull();
    expect(result!.content).toEqual(markdownContent);
  });
});
