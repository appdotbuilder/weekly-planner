
import { promises as fs } from 'fs';
import { join } from 'path';
import { type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

function parseWeekFilename(filename: string): Date | null {
  // Parse DD-MMM-YYYY.md format
  const match = filename.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})\.md$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = monthNames.indexOf(month);
  if (monthIndex === -1) return null;

  return new Date(parseInt(year), monthIndex, parseInt(day));
}

export async function getAllWeeklyPlans(): Promise<WeeklyPlan[]> {
  try {
    // Ensure weekly plans directory exists
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });

    // Read all Markdown files in weekly plans directory
    const files = await fs.readdir(WEEKLY_PLANS_DIR);
    const planFiles = files.filter(file => file.endsWith('.md'));

    const plans: WeeklyPlan[] = [];
    
    for (const file of planFiles) {
      try {
        const weekStart = parseWeekFilename(file);
        if (!weekStart) continue;

        const filePath = join(WEEKLY_PLANS_DIR, file);
        const markdownContent = await fs.readFile(filePath, 'utf-8');
        
        // Parse content to extract short note
        let shortNote: string | null = null;
        let content = markdownContent;

        // Check if the file starts with a short note (non-heading content at the top)
        const lines = markdownContent.split('\n');
        if (lines.length > 0) {
          const firstHeadingIndex = lines.findIndex(line => line.trim().startsWith('#'));
          
          if (firstHeadingIndex > 0) {
            // Content before first heading is the short note
            const noteLines = lines.slice(0, firstHeadingIndex);
            shortNote = noteLines.join('\n').trim() || null;
            content = lines.slice(firstHeadingIndex).join('\n').trim();
          } else if (firstHeadingIndex === -1) {
            // No headings found - treat first paragraph as short note if multiple paragraphs exist
            const firstEmptyLineIndex = lines.findIndex(line => line.trim() === '');
            if (firstEmptyLineIndex > 0 && firstEmptyLineIndex < lines.length - 1) {
              shortNote = lines.slice(0, firstEmptyLineIndex).join('\n').trim() || null;
              content = lines.slice(firstEmptyLineIndex + 1).join('\n').trim();
            }
          }
          
          // If no short note was extracted, keep original content
          if (!shortNote) {
            content = markdownContent;
          }
        }

        plans.push({
          week_start: weekStart,
          short_week_note: shortNote,
          content: content
        });
      } catch (error) {
        console.error(`Error reading weekly plan file ${file}:`, error);
        // Continue with other files
      }
    }

    // Sort by week start date (newest first)
    plans.sort((a, b) => b.week_start.getTime() - a.week_start.getTime());

    return plans;
  } catch (error) {
    console.error('Error reading weekly plans directory:', error);
    return [];
  }
}
