
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { updateTask } from '../handlers/update_task';
import { type UpdateTaskInput, type Section, type Task } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Test data
const testSection: Section = {
  name: 'test-project',
  tasks: [
    {
      id: 'task-1',
      description: 'Original task',
      priority: 'Medium',
      due_date: new Date('2024-01-15'),
      comments: 'Original comments',
      completed: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'task-2',
      description: 'Another task',
      priority: 'High',
      due_date: null,
      comments: null,
      completed: true,
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02')
    }
  ]
};

const setupTestSection = async () => {
  await fs.mkdir(SECTIONS_DIR, { recursive: true });
  await fs.writeFile(
    join(SECTIONS_DIR, 'test-project.json'),
    JSON.stringify(testSection, null, 2)
  );
};

const cleanupTestFiles = async () => {
  try {
    await fs.rm(SECTIONS_DIR, { recursive: true, force: true });
  } catch {
    // Directory might not exist, ignore
  }
};

describe('updateTask', () => {
  beforeEach(setupTestSection);
  afterEach(cleanupTestFiles);

  it('should update task description', async () => {
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'task-1',
      description: 'Updated task description'
    };

    const result = await updateTask(input);

    expect(result.id).toBe('task-1');
    expect(result.description).toBe('Updated task description');
    expect(result.priority).toBe('Medium'); // Should preserve original
    expect(result.due_date).toEqual(new Date('2024-01-15')); // Should preserve original
    expect(result.comments).toBe('Original comments'); // Should preserve original
    expect(result.completed).toBe(false); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testSection.tasks[0].updated_at.getTime());
  });

  it('should update multiple task fields', async () => {
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'task-1',
      description: 'Updated description',
      priority: 'High',
      completed: true,
      comments: 'Updated comments'
    };

    const result = await updateTask(input);

    expect(result.description).toBe('Updated description');
    expect(result.priority).toBe('High');
    expect(result.completed).toBe(true);
    expect(result.comments).toBe('Updated comments');
    expect(result.due_date).toEqual(new Date('2024-01-15')); // Should preserve original
  });

  it('should handle null values for optional fields', async () => {
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'task-1',
      due_date: null,
      comments: null
    };

    const result = await updateTask(input);

    expect(result.due_date).toBeNull();
    expect(result.comments).toBeNull();
    expect(result.description).toBe('Original task'); // Should preserve original
    expect(result.priority).toBe('Medium'); // Should preserve original
  });

  it('should persist changes to file', async () => {
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'task-2',
      description: 'Updated task 2',
      completed: false
    };

    await updateTask(input);

    // Read file and verify changes were persisted
    const fileContent = await fs.readFile(
      join(SECTIONS_DIR, 'test-project.json'),
      'utf-8'
    );
    const section = JSON.parse(fileContent);

    const updatedTask = section.tasks.find((t: Task) => t.id === 'task-2');
    expect(updatedTask).toBeDefined();
    expect(updatedTask.description).toBe('Updated task 2');
    expect(updatedTask.completed).toBe(false);
    expect(new Date(updatedTask.updated_at)).toBeInstanceOf(Date);
  });

  it('should throw error when section does not exist', async () => {
    const input: UpdateTaskInput = {
      section_name: 'nonexistent-project',
      task_id: 'task-1',
      description: 'Updated description'
    };

    await expect(updateTask(input)).rejects.toThrow(/Section 'nonexistent-project' not found/);
  });

  it('should throw error when task does not exist', async () => {
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'nonexistent-task',
      description: 'Updated description'
    };

    await expect(updateTask(input)).rejects.toThrow(/Task with ID 'nonexistent-task' not found/);
  });

  it('should preserve other tasks in the section', async () => {
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'task-1',
      description: 'Updated first task'
    };

    await updateTask(input);

    // Read file and verify other task is unchanged
    const fileContent = await fs.readFile(
      join(SECTIONS_DIR, 'test-project.json'),
      'utf-8'
    );
    const section = JSON.parse(fileContent);

    expect(section.tasks).toHaveLength(2);
    
    const unchangedTask = section.tasks.find((t: Task) => t.id === 'task-2');
    expect(unchangedTask).toBeDefined();
    expect(unchangedTask.description).toBe('Another task');
    expect(unchangedTask.priority).toBe('High');
    expect(unchangedTask.completed).toBe(true);
  });

  it('should handle updating task with new due date', async () => {
    const newDueDate = new Date('2024-02-01');
    const input: UpdateTaskInput = {
      section_name: 'test-project',
      task_id: 'task-2',
      due_date: newDueDate
    };

    const result = await updateTask(input);

    expect(result.due_date).toEqual(newDueDate);
    expect(result.description).toBe('Another task'); // Should preserve original
  });
});
