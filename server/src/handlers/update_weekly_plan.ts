
import { promises as fs } from 'fs';
import { join } from 'path';
import { type UpdateWeeklyPlanInput, type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function formatWeekFilename(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}.md`;
}

export async function updateWeeklyPlan(input: UpdateWeeklyPlanInput): Promise<WeeklyPlan> {
  const filename = formatWeekFilename(input.week_start);
  const planPath = join(WEEKLY_PLANS_DIR, filename);

  try {
    // Read existing plan or throw error if it doesn't exist
    const existingContent = await fs.readFile(planPath, 'utf-8');
    
    // Parse existing content to extract current short note and content
    const lines = existingContent.split('\n');
    let currentShortNote: string | null = null;
    let currentContent = existingContent;

    // Check if first line(s) are short note (not starting with #)
    if (lines.length > 0 && lines[0] && !lines[0].startsWith('#')) {
      const firstEmptyLineIndex = lines.findIndex(line => line.trim() === '');
      if (firstEmptyLineIndex > 0) {
        currentShortNote = lines.slice(0, firstEmptyLineIndex).join('\n');
        currentContent = lines.slice(firstEmptyLineIndex + 1).join('\n').trim();
      } else {
        // If no empty line found, treat everything as content
        currentContent = existingContent;
      }
    } else {
      // No short note, everything is content
      currentContent = existingContent;
    }

    // Use provided values or keep existing ones
    const updatedShortNote = input.short_week_note !== undefined ? input.short_week_note : currentShortNote;
    const updatedContent = input.content ?? currentContent;

    // Create updated markdown content
    let markdownContent = '';
    if (updatedShortNote) {
      markdownContent += `${updatedShortNote}\n\n`;
    }
    markdownContent += updatedContent;

    // Write updated content
    await fs.writeFile(planPath, markdownContent);

    return {
      week_start: input.week_start,
      short_week_note: updatedShortNote,
      content: updatedContent
    };
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error('Weekly plan not found');
    }
    console.error('Weekly plan update failed:', error);
    throw error;
  }
}
