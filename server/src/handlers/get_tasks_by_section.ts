
import { promises as fs } from 'fs';
import { join } from 'path';
import { type Task, taskSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export const getTasksBySection = async (sectionName: string): Promise<Task[]> => {
  try {
    // Ensure the sections directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });

    const filePath = join(SECTIONS_DIR, `${sectionName}.json`);
    
    try {
      // Read the section file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const sectionData = JSON.parse(fileContent);
      
      // Get raw tasks array
      const rawTasks = sectionData.tasks || [];
      
      // Parse each task through the schema to ensure proper type conversion
      const tasks: Task[] = rawTasks.map((rawTask: any) => {
        return taskSchema.parse(rawTask);
      });
      
      // Return tasks array, sorted by priority (High, Medium, Low) and then by due_date
      return tasks.sort((a, b) => {
        // Priority sorting: High = 0, Medium = 1, Low = 2
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        
        // If priorities are equal, sort by due_date (nulls last)
        if (a.due_date === null && b.due_date === null) return 0;
        if (a.due_date === null) return 1;
        if (b.due_date === null) return -1;
        
        return a.due_date.getTime() - b.due_date.getTime();
      });
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Section file doesn't exist, return empty array
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to get tasks by section:', error);
    throw error;
  }
};
