
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { getTasks } from '../handlers/get_tasks';
import { type Section, type Task } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Test data
const testTask1: Task = {
  id: 'task-1',
  description: 'Complete project proposal',
  priority: 'High',
  due_date: new Date('2024-01-15'),
  comments: 'Need to include budget details',
  completed: false,
  created_at: new Date('2024-01-10'),
  updated_at: new Date('2024-01-10')
};

const testTask2: Task = {
  id: 'task-2',
  description: 'Review code changes',
  priority: 'Medium',
  due_date: null,
  comments: null,
  completed: true,
  created_at: new Date('2024-01-11'),
  updated_at: new Date('2024-01-12')
};

const testTask3: Task = {
  id: 'task-3',
  description: 'Update documentation',
  priority: 'Low',
  due_date: new Date('2024-01-20'),
  comments: 'Include API changes',
  completed: false,
  created_at: new Date('2024-01-12'),
  updated_at: new Date('2024-01-12')
};

const workSection: Section = {
  name: 'Work',
  tasks: [testTask1, testTask2]
};

const personalSection: Section = {
  name: 'Personal',
  tasks: [testTask3]
};

describe('getTasks', () => {
  beforeEach(async () => {
    // Ensure sections directory exists
    await mkdir(SECTIONS_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await rm(SECTIONS_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  it('should return empty array when no section files exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return tasks from a single section file', async () => {
    // Create one section file
    const filePath = join(SECTIONS_DIR, 'Work.json');
    await writeFile(filePath, JSON.stringify(workSection, null, 2));

    const result = await getTasks();
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('task-1');
    expect(result[0].description).toBe('Complete project proposal');
    expect(result[0].priority).toBe('High');
    expect(result[0].due_date).toEqual(new Date('2024-01-15'));
    expect(result[0].comments).toBe('Need to include budget details');
    expect(result[0].completed).toBe(false);
    
    expect(result[1].id).toBe('task-2');
    expect(result[1].description).toBe('Review code changes');
    expect(result[1].priority).toBe('Medium');
    expect(result[1].due_date).toBe(null);
    expect(result[1].comments).toBe(null);
    expect(result[1].completed).toBe(true);
  });

  it('should return tasks from multiple section files', async () => {
    // Create multiple section files
    await writeFile(join(SECTIONS_DIR, 'Work.json'), JSON.stringify(workSection, null, 2));
    await writeFile(join(SECTIONS_DIR, 'Personal.json'), JSON.stringify(personalSection, null, 2));

    const result = await getTasks();
    
    expect(result).toHaveLength(3);
    
    // Should contain tasks from both sections
    const taskIds = result.map(task => task.id);
    expect(taskIds).toContain('task-1');
    expect(taskIds).toContain('task-2');
    expect(taskIds).toContain('task-3');
    
    // Find specific task and verify its properties
    const task3 = result.find(task => task.id === 'task-3');
    expect(task3).toBeDefined();
    expect(task3!.description).toBe('Update documentation');
    expect(task3!.priority).toBe('Low');
    expect(task3!.due_date).toEqual(new Date('2024-01-20'));
  });

  it('should handle empty section files', async () => {
    // Create section with no tasks
    const emptySection: Section = {
      name: 'Empty',
      tasks: []
    };
    
    await writeFile(join(SECTIONS_DIR, 'Empty.json'), JSON.stringify(emptySection, null, 2));
    await writeFile(join(SECTIONS_DIR, 'Work.json'), JSON.stringify(workSection, null, 2));

    const result = await getTasks();
    
    expect(result).toHaveLength(2);
    expect(result.map(task => task.id)).toEqual(['task-1', 'task-2']);
  });

  it('should ignore invalid JSON files and continue processing valid ones', async () => {
    // Create valid section file
    await writeFile(join(SECTIONS_DIR, 'Work.json'), JSON.stringify(workSection, null, 2));
    
    // Create invalid JSON file
    await writeFile(join(SECTIONS_DIR, 'Invalid.json'), 'invalid json content');
    
    // Create another valid section file
    await writeFile(join(SECTIONS_DIR, 'Personal.json'), JSON.stringify(personalSection, null, 2));

    const result = await getTasks();
    
    // Should return tasks from valid files only
    expect(result).toHaveLength(3);
    expect(result.map(task => task.id)).toContain('task-1');
    expect(result.map(task => task.id)).toContain('task-2');
    expect(result.map(task => task.id)).toContain('task-3');
  });

  it('should ignore non-JSON files', async () => {
    // Create valid section file
    await writeFile(join(SECTIONS_DIR, 'Work.json'), JSON.stringify(workSection, null, 2));
    
    // Create non-JSON file
    await writeFile(join(SECTIONS_DIR, 'readme.txt'), 'This is not a JSON file');

    const result = await getTasks();
    
    expect(result).toHaveLength(2);
    expect(result.map(task => task.id)).toEqual(['task-1', 'task-2']);
  });
});
