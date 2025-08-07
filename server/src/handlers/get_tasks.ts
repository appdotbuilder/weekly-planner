
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { type Task, sectionSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Ensure sections directory exists and get all JSON files
    let files: string[];
    try {
      files = await readdir(SECTIONS_DIR);
    } catch (error) {
      // Directory doesn't exist or is empty, return empty array
      return [];
    }

    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      return [];
    }

    // Read all section files and collect tasks
    const allTasks: Task[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = join(SECTIONS_DIR, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const rawData = JSON.parse(fileContent);
        
        // Validate the section structure
        const section = sectionSchema.parse(rawData);
        
        // Add all tasks from this section
        allTasks.push(...section.tasks);
      } catch (error) {
        // Skip invalid files but continue processing others
        console.error(`Error reading section file ${file}:`, error);
        continue;
      }
    }

    return allTasks;
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
};
