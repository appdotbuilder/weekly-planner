
import { promises as fs } from 'fs';
import { join } from 'path';
import { type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly-plans');

// Helper function to format date as DD-MMM-YYYY
const formatWeekDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to extract short_week_note from markdown content
const extractShortWeekNote = (content: string): string | null => {
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim();
  
  // If first line is not a heading and not empty, treat it as short_week_note
  if (firstLine && !firstLine.startsWith('#')) {
    return firstLine;
  }
  
  return null;
};

export const getWeeklyPlanByDate = async (mondayDate: Date): Promise<WeeklyPlan | null> => {
  try {
    // Ensure the weekly plans directory exists
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });
    
    // Format the date for filename
    const filename = formatWeekDate(mondayDate);
    const filepath = join(WEEKLY_PLANS_DIR, `${filename}.md`);
    
    try {
      // Read the markdown file
      const content = await fs.readFile(filepath, 'utf-8');
      
      // Extract short_week_note from content
      const short_week_note = extractShortWeekNote(content);
      
      return {
        week_start: mondayDate,
        short_week_note,
        content
      };
    } catch (error: any) {
      // If file doesn't exist, return null
      if (error.code === 'ENOENT') {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    console.error('Failed to get weekly plan:', error);
    throw error;
  }
};
