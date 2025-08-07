
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { type CreateTaskInput, type Task, sectionSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const sectionPath = join(SECTIONS_DIR, `${input.section_name}.json`);
  const newTask: Task = {
    id: randomUUID(),
    description: input.description,
    priority: input.priority,
    due_date: input.due_date || null,
    comments: input.comments || null,
    completed: false,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    // Ensure sections directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });

    // Read existing section or create new one
    let section;
    try {
      const fileContent = await fs.readFile(sectionPath, 'utf-8');
      section = sectionSchema.parse(JSON.parse(fileContent));
    } catch {
      // File doesn't exist, create new section
      section = { name: input.section_name, tasks: [] };
    }

    // Add new task to section
    section.tasks.push(newTask);

    // Write updated section back to file
    await fs.writeFile(sectionPath, JSON.stringify(section, null, 2));

    return newTask;
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
}
