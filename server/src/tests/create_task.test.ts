
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Test cleanup helper
const cleanupTestFiles = async () => {
  try {
    await fs.rm(SECTIONS_DIR, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, ignore
  }
};

// Simple test input
const testInput: CreateTaskInput = {
  section_name: 'Test Project',
  description: 'Test task description',
  priority: 'High',
  due_date: new Date('2024-12-31'),
  comments: 'Test comments'
};

describe('createTask', () => {
  beforeEach(async () => {
    await cleanupTestFiles();
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.description).toEqual('Test task description');
    expect(result.priority).toEqual('High');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.comments).toEqual('Test comments');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to JSON file', async () => {
    const result = await createTask(testInput);

    // Check file was created
    const sectionPath = join(SECTIONS_DIR, 'Test Project.json');
    const fileExists = await fs.access(sectionPath).then(() => true, () => false);
    expect(fileExists).toBe(true);

    // Check file content
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const section = JSON.parse(fileContent);
    
    expect(section.name).toEqual('Test Project');
    expect(section.tasks).toHaveLength(1);
    expect(section.tasks[0].id).toEqual(result.id);
    expect(section.tasks[0].description).toEqual('Test task description');
    expect(section.tasks[0].priority).toEqual('High');
    expect(section.tasks[0].completed).toEqual(false);
  });

  it('should add task to existing section', async () => {
    // Create first task
    const firstTask = await createTask(testInput);

    // Create second task with different description
    const secondInput: CreateTaskInput = {
      ...testInput,
      description: 'Second task description'
    };
    const secondTask = await createTask(secondInput);

    // Check both tasks are in the same file
    const sectionPath = join(SECTIONS_DIR, 'Test Project.json');
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const section = JSON.parse(fileContent);

    expect(section.tasks).toHaveLength(2);
    expect(section.tasks[0].id).toEqual(firstTask.id);
    expect(section.tasks[1].id).toEqual(secondTask.id);
    expect(section.tasks[0].description).toEqual('Test task description');
    expect(section.tasks[1].description).toEqual('Second task description');
  });

  it('should handle optional fields correctly', async () => {
    const minimalInput: CreateTaskInput = {
      section_name: 'Minimal Project',
      description: 'Minimal task',
      priority: 'Low'
    };

    const result = await createTask(minimalInput);

    expect(result.description).toEqual('Minimal task');
    expect(result.priority).toEqual('Low');
    expect(result.due_date).toBeNull();
    expect(result.comments).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should create directories if they dont exist', async () => {
    // Ensure directory doesn't exist
    await cleanupTestFiles();

    const result = await createTask(testInput);

    // Check task was created successfully
    expect(result.id).toBeDefined();

    // Check directory was created
    const dirExists = await fs.access(SECTIONS_DIR).then(() => true, () => false);
    expect(dirExists).toBe(true);
  });
});
