
import { promises as fs } from 'fs';
import { join } from 'path';
import { type UpdateTaskInput, type Task, sectionSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const sectionPath = join(SECTIONS_DIR, `${input.section_name}.json`);

  try {
    // Ensure section file exists
    try {
      await fs.access(sectionPath);
    } catch {
      throw new Error(`Section '${input.section_name}' not found`);
    }

    // Read existing section
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const section = sectionSchema.parse(JSON.parse(fileContent));

    // Find task to update
    const taskIndex = section.tasks.findIndex(task => task.id === input.task_id);
    if (taskIndex === -1) {
      throw new Error(`Task with ID '${input.task_id}' not found in section '${input.section_name}'`);
    }

    const existingTask = section.tasks[taskIndex];

    // Update task with provided fields, preserving existing values for undefined fields
    const updatedTask: Task = {
      ...existingTask,
      description: input.description ?? existingTask.description,
      priority: input.priority ?? existingTask.priority,
      due_date: input.due_date !== undefined ? input.due_date : existingTask.due_date,
      comments: input.comments !== undefined ? input.comments : existingTask.comments,
      completed: input.completed ?? existingTask.completed,
      updated_at: new Date()
    };

    // Replace task in section
    section.tasks[taskIndex] = updatedTask;

    // Write updated section back to file
    await fs.writeFile(sectionPath, JSON.stringify(section, null, 2));

    return updatedTask;
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
}
