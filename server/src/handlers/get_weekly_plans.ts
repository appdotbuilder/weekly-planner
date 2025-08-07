
import { promises as fs } from 'fs';
import { join } from 'path';
import { type WeeklyPlan } from '../schema';

const WEEKLY_PLANS_DIR = join(process.cwd(), 'data', 'weekly_plans');

export const getWeeklyPlans = async (): Promise<WeeklyPlan[]> => {
  try {
    // Ensure directory exists
    await fs.mkdir(WEEKLY_PLANS_DIR, { recursive: true });
    
    // Read all files in the weekly plans directory
    const files = await fs.readdir(WEEKLY_PLANS_DIR);
    
    // Filter for markdown files with valid date format and sort by date (most recent first)
    const validWeeklyPlanFiles = files
      .filter(file => file.endsWith('.md') && isValidDateFormat(file))
      .sort((a, b) => {
        // Extract dates from filenames for sorting
        const dateA = parseDateFromFilename(a);
        const dateB = parseDateFromFilename(b);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
    
    const weeklyPlans: WeeklyPlan[] = [];
    
    // Read each file and parse its content
    for (const filename of validWeeklyPlanFiles) {
      const filePath = join(WEEKLY_PLANS_DIR, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse the date from filename (DD-MMM-YYYY.md format)
      const weekStart = parseDateFromFilename(filename);
      
      // Extract short_week_note from the beginning of the content
      const lines = content.split('\n');
      let shortWeekNote: string | null = null;
      let actualContent = content;
      
      // Check if first line is a short note (not a heading, not empty, and followed by empty line and then heading)
      if (lines.length >= 3 && 
          lines[0].trim() && 
          !lines[0].startsWith('#') && 
          lines[1].trim() === '' && 
          lines[2].startsWith('#')) {
        shortWeekNote = lines[0].trim();
        // Remove the first line and the empty line that follows
        actualContent = lines.slice(2).join('\n');
      }
      
      weeklyPlans.push({
        week_start: weekStart,
        short_week_note: shortWeekNote,
        content: actualContent
      });
    }
    
    return weeklyPlans;
  } catch (error) {
    console.error('Failed to get weekly plans:', error);
    throw error;
  }
};

// Helper function to check if filename matches DD-MMM-YYYY.md format
function isValidDateFormat(filename: string): boolean {
  const basename = filename.replace('.md', '');
  const parts = basename.split('-');
  
  if (parts.length !== 3) {
    return false;
  }
  
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const year = parseInt(parts[2], 10);
  
  // Check if day is valid (1-31)
  if (isNaN(day) || day < 1 || day > 31) {
    return false;
  }
  
  // Check if year is valid (4 digits)
  if (isNaN(year) || year < 1000 || year > 9999) {
    return false;
  }
  
  // Check if month is valid
  const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return validMonths.includes(monthStr);
}

// Helper function to parse date from filename format DD-MMM-YYYY.md
function parseDateFromFilename(filename: string): Date {
  const basename = filename.replace('.md', '');
  const parts = basename.split('-');
  
  if (parts.length !== 3) {
    throw new Error(`Invalid filename format: ${filename}`);
  }
  
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const year = parseInt(parts[2], 10);
  
  // Map month abbreviations to numbers
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = monthMap[monthStr];
  if (month === undefined) {
    throw new Error(`Invalid month abbreviation: ${monthStr}`);
  }
  
  return new Date(year, month, day);
}
