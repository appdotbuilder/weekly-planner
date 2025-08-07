
import { promises as fs } from 'fs';
import { join } from 'path';
import { type GetWeeklyPlanInput, type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function formatWeekFilename(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}.md`;
}

export async function getWeeklyPlan(input: GetWeeklyPlanInput): Promise<WeeklyPlan | null> {
  const filename = formatWeekFilename(input.week_start);
  const planPath = join(WEEKLY_PLANS_DIR, filename);

  try {
    const markdownContent = await fs.readFile(planPath, 'utf-8');
    
    // Parse the content to extract short note
    const lines = markdownContent.split('\n');
    let shortNote: string | null = null;
    let content = markdownContent.trim();

    // Check if first lines contain a short note (before first heading)
    if (lines.length > 0) {
      const firstHeadingIndex = lines.findIndex(line => line.trim().startsWith('#'));
      
      if (firstHeadingIndex > 0) {
        // Extract text before first heading as short note
        const noteLines = lines.slice(0, firstHeadingIndex);
        const noteText = noteLines.join('\n').trim();
        
        if (noteText) {
          shortNote = noteText;
          // Content is everything from first heading onwards
          content = lines.slice(firstHeadingIndex).join('\n').trim();
        }
      } else if (firstHeadingIndex === -1) {
        // No headings found, entire content is treated as a short note
        const trimmedContent = markdownContent.trim();
        if (trimmedContent) {
          shortNote = trimmedContent;
          content = ''; // No structured content, only note
        }
      }
      // If firstHeadingIndex === 0, content starts with heading, no note
    }

    return {
      week_start: input.week_start,
      short_week_note: shortNote,
      content: content
    };
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return null; // Plan doesn't exist
    }
    console.error('Failed to get weekly plan:', error);
    throw error;
  }
}
