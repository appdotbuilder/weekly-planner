
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getTasksBySection } from '../handlers/get_tasks_by_section';
import { type Section } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Clean up test data
const cleanupTestData = async () => {
  try {
    await fs.rm(SECTIONS_DIR, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, ignore error
  }
};

// Create test section data
const createTestSection = async (sectionName: string, tasks: any[]) => {
  await fs.mkdir(SECTIONS_DIR, { recursive: true });
  const sectionData: Section = {
    name: sectionName,
    tasks
  };
  const filePath = join(SECTIONS_DIR, `${sectionName}.json`);
  await fs.writeFile(filePath, JSON.stringify(sectionData, null, 2));
};

describe('getTasksBySection', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should return empty array for non-existent section', async () => {
    const result = await getTasksBySection('nonexistent-section');
    expect(result).toEqual([]);
  });

  it('should return tasks for existing section', async () => {
    const testTasks = [
      {
        id: '1',
        description: 'Test task 1',
        priority: 'High' as const,
        due_date: '2024-01-15T00:00:00.000Z', // Store as string in JSON
        comments: 'Test comment',
        completed: false,
        created_at: '2024-01-01T00:00:00.000Z', // Store as string in JSON
        updated_at: '2024-01-01T00:00:00.000Z' // Store as string in JSON
      },
      {
        id: '2',
        description: 'Test task 2',
        priority: 'Medium' as const,
        due_date: null,
        comments: null,
        completed: true,
        created_at: '2024-01-02T00:00:00.000Z', // Store as string in JSON
        updated_at: '2024-01-02T00:00:00.000Z' // Store as string in JSON
      }
    ];

    await createTestSection('test-project', testTasks);
    
    const result = await getTasksBySection('test-project');
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual('1');
    expect(result[0].description).toEqual('Test task 1');
    expect(result[0].priority).toEqual('High');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].comments).toEqual('Test comment');
    expect(result[0].completed).toEqual(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    expect(result[1].id).toEqual('2');
    expect(result[1].description).toEqual('Test task 2');
    expect(result[1].priority).toEqual('Medium');
    expect(result[1].due_date).toBeNull();
    expect(result[1].comments).toBeNull();
    expect(result[1].completed).toEqual(true);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should sort tasks by priority first (High, Medium, Low)', async () => {
    const testTasks = [
      {
        id: '1',
        description: 'Low priority task',
        priority: 'Low' as const,
        due_date: null,
        comments: null,
        completed: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        description: 'High priority task',
        priority: 'High' as const,
        due_date: null,
        comments: null,
        completed: false,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      },
      {
        id: '3',
        description: 'Medium priority task',
        priority: 'Medium' as const,
        due_date: null,
        comments: null,
        completed: false,
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z'
      }
    ];

    await createTestSection('priority-test', testTasks);
    
    const result = await getTasksBySection('priority-test');
    
    expect(result).toHaveLength(3);
    expect(result[0].priority).toEqual('High');
    expect(result[1].priority).toEqual('Medium');
    expect(result[2].priority).toEqual('Low');
  });

  it('should sort tasks by due_date within same priority (null dates last)', async () => {
    const testTasks = [
      {
        id: '1',
        description: 'High priority with late due date',
        priority: 'High' as const,
        due_date: '2024-01-20T00:00:00.000Z',
        comments: null,
        completed: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        description: 'High priority with early due date',
        priority: 'High' as const,
        due_date: '2024-01-10T00:00:00.000Z',
        comments: null,
        completed: false,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      },
      {
        id: '3',
        description: 'High priority with no due date',
        priority: 'High' as const,
        due_date: null,
        comments: null,
        completed: false,
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z'
      }
    ];

    await createTestSection('date-sort-test', testTasks);
    
    const result = await getTasksBySection('date-sort-test');
    
    expect(result).toHaveLength(3);
    // All have High priority, so should be sorted by due_date
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].due_date?.getTime()).toEqual(new Date('2024-01-10T00:00:00.000Z').getTime()); // Early date first
    expect(result[1].due_date).toBeInstanceOf(Date);
    expect(result[1].due_date?.getTime()).toEqual(new Date('2024-01-20T00:00:00.000Z').getTime()); // Late date second
    expect(result[2].due_date).toBeNull(); // Null date last
  });

  it('should handle section with empty tasks array', async () => {
    await createTestSection('empty-section', []);
    
    const result = await getTasksBySection('empty-section');
    
    expect(result).toEqual([]);
  });

  it('should handle malformed JSON gracefully', async () => {
    await fs.mkdir(SECTIONS_DIR, { recursive: true });
    const filePath = join(SECTIONS_DIR, 'malformed-section.json');
    await fs.writeFile(filePath, 'invalid json content');
    
    await expect(getTasksBySection('malformed-section')).rejects.toThrow(/JSON Parse error/i);
  });
});
