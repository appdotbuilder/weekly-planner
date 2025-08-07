
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { type DeleteTaskInput, type Section, type Task } from '../schema';
import { deleteTask } from '../handlers/delete_task';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

const testTask1: Task = {
  id: 'task-1',
  description: 'Test task 1',
  priority: 'High',
  due_date: new Date('2024-01-15'),
  comments: 'Test comments',
  completed: false,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01')
};

const testTask2: Task = {
  id: 'task-2',
  description: 'Test task 2',
  priority: 'Medium',
  due_date: null,
  comments: null,
  completed: true,
  created_at: new Date('2024-01-02'),
  updated_at: new Date('2024-01-02')
};

const testSection: Section = {
  name: 'test-section',
  tasks: [testTask1, testTask2]
};

const testInput: DeleteTaskInput = {
  section_name: 'test-section',
  task_id: 'task-1'
};

describe('deleteTask', () => {
  beforeEach(async () => {
    // Ensure sections directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });
    
    // Create test section file
    const sectionPath = join(SECTIONS_DIR, `${testSection.name}.json`);
    await fs.writeFile(sectionPath, JSON.stringify(testSection, null, 2));
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(SECTIONS_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should delete a task from section', async () => {
    const result = await deleteTask(testInput);

    expect(result).toBe(true);

    // Verify task was removed from file
    const sectionPath = join(SECTIONS_DIR, `${testSection.name}.json`);
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const updatedSection = JSON.parse(fileContent);

    expect(updatedSection.tasks).toHaveLength(1);
    expect(updatedSection.tasks[0].id).toEqual('task-2');
    expect(updatedSection.tasks[0].description).toEqual('Test task 2');
  });

  it('should throw error when section not found', async () => {
    const invalidInput: DeleteTaskInput = {
      section_name: 'non-existent-section',
      task_id: 'task-1'
    };

    await expect(deleteTask(invalidInput)).rejects.toThrow(/Section 'non-existent-section' not found/);
  });

  it('should throw error when task not found', async () => {
    const invalidInput: DeleteTaskInput = {
      section_name: 'test-section',
      task_id: 'non-existent-task'
    };

    await expect(deleteTask(invalidInput)).rejects.toThrow(/Task not found/);
  });

  it('should handle deleting last task in section', async () => {
    // Create section with only one task
    const singleTaskSection: Section = {
      name: 'single-task-section',
      tasks: [testTask1]
    };

    const sectionPath = join(SECTIONS_DIR, `${singleTaskSection.name}.json`);
    await fs.writeFile(sectionPath, JSON.stringify(singleTaskSection, null, 2));

    const singleTaskInput: DeleteTaskInput = {
      section_name: 'single-task-section',
      task_id: 'task-1'
    };

    const result = await deleteTask(singleTaskInput);

    expect(result).toBe(true);

    // Verify section exists but has no tasks
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const updatedSection = JSON.parse(fileContent);

    expect(updatedSection.tasks).toHaveLength(0);
    expect(updatedSection.name).toEqual('single-task-section');
  });

  it('should preserve other tasks when deleting one task', async () => {
    const result = await deleteTask(testInput);

    expect(result).toBe(true);

    // Verify remaining task is unchanged
    const sectionPath = join(SECTIONS_DIR, `${testSection.name}.json`);
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const updatedSection = JSON.parse(fileContent);

    expect(updatedSection.tasks).toHaveLength(1);
    const remainingTask = updatedSection.tasks[0];
    expect(remainingTask.id).toEqual('task-2');
    expect(remainingTask.description).toEqual('Test task 2');
    expect(remainingTask.priority).toEqual('Medium');
    expect(remainingTask.completed).toBe(true);
  });
});
