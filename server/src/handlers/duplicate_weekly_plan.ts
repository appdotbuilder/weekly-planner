
import { promises as fs } from 'fs';
import { join } from 'path';
import { type WeeklyPlan } from '../schema';

// Define the input schema inline since it's not in the main schema file
interface DuplicateWeeklyPlanInput {
  source_week_start: Date;
  target_week_start: Date;
}

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

// Helper function to update markdown content with new week date
const updateMarkdownContent = (content: string, newWeekStart: Date): string => {
  const newWeekFormatted = formatWeekStart(newWeekStart);
  
  // Look for existing "Week of" patterns and replace them
  const weekPattern = /Week of \d{1,2}-[A-Za-z]{3}-\d{4}/gi;
  
  let updatedContent = content;
  
  if (weekPattern.test(content)) {
    // Replace existing "Week of" patterns
    updatedContent = content.replace(weekPattern, `Week of ${newWeekFormatted}`);
  } else {
    // No existing week pattern found, add it at the beginning
    updatedContent = `# Week of ${newWeekFormatted}\n\n${content}`;
  }
  
  return updatedContent;
};

// Helper function to extract short week note
const extractShortWeekNote = (content: string): string | null => {
  const lines = content.split('\n');
  let foundMainHeading = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is the main heading (# Week of...)
    if (line.startsWith('# ') && line.includes('Week of')) {
      foundMainHeading = true;
      continue;
    }
    
    // If we found the main heading, look for the first non-empty, non-heading line
    if (foundMainHeading) {
      if (line && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-')) {
        return line;
      }
      // If we encounter another heading before finding a note, there's no short note
      if (line.startsWith('#')) {
        break;
      }
    }
  }
  
  return null;
};

export const duplicateWeeklyPlan = async (input: DuplicateWeeklyPlanInput): Promise<WeeklyPlan> => {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(WEEKLY_PLANS_DIR);
    
    // Generate filenames
    const sourceFilename = `${formatWeekStart(input.source_week_start)}.md`;
    const targetFilename = `${formatWeekStart(input.target_week_start)}.md`;
    
    const sourceFilePath = join(WEEKLY_PLANS_DIR, sourceFilename);
    const targetFilePath = join(WEEKLY_PLANS_DIR, targetFilename);
    
    // Check if source file exists
    try {
      await fs.access(sourceFilePath);
    } catch {
      throw new Error(`Source weekly plan not found: ${sourceFilename}`);
    }
    
    // Check if target file already exists
    try {
      await fs.access(targetFilePath);
      throw new Error(`Target weekly plan already exists: ${targetFilename}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw error;
      }
      // File doesn't exist, which is what we want
    }
    
    // Read source file content
    const sourceContent = await fs.readFile(sourceFilePath, 'utf-8');
    
    // Update content with new week date
    const updatedContent = updateMarkdownContent(sourceContent, input.target_week_start);
    
    // Write target file
    await fs.writeFile(targetFilePath, updatedContent, 'utf-8');
    
    // Extract short_week_note from content
    const short_week_note = extractShortWeekNote(updatedContent);
    
    // Return the duplicated weekly plan
    return {
      week_start: input.target_week_start,
      short_week_note,
      content: updatedContent
    };
    
  } catch (error) {
    console.error('Weekly plan duplication failed:', error);
    throw error;
  }
};
