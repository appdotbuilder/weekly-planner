
import { promises as fs } from 'fs';
import { join } from 'path';
import { type DeleteTaskInput, sectionSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function deleteTask(input: DeleteTaskInput): Promise<boolean> {
  const sectionPath = join(SECTIONS_DIR, `${input.section_name}.json`);

  try {
    // Check if section file exists
    await fs.access(sectionPath);
  } catch {
    throw new Error(`Section '${input.section_name}' not found`);
  }

  try {
    // Read existing section
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const section = sectionSchema.parse(JSON.parse(fileContent));

    // Find task to delete
    const taskIndex = section.tasks.findIndex(task => task.id === input.task_id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    // Remove task from section
    section.tasks.splice(taskIndex, 1);

    // Write updated section back to file
    await fs.writeFile(sectionPath, JSON.stringify(section, null, 2));

    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      throw error;
    }
    console.error('Failed to delete task:', error);
    throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
