
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getSections } from '../handlers/get_sections';
import { type Section } from '../schema';

const TEST_SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Helper to clean up test files
const cleanupTestFiles = async () => {
  try {
    const files = await fs.readdir(TEST_SECTIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    for (const file of jsonFiles) {
      await fs.unlink(join(TEST_SECTIONS_DIR, file));
    }
  } catch (error) {
    // Directory might not exist, which is fine
  }
};

// Helper to create test section file
const createTestSection = async (section: Section) => {
  await fs.mkdir(TEST_SECTIONS_DIR, { recursive: true });
  const filePath = join(TEST_SECTIONS_DIR, `${section.name}.json`);
  await fs.writeFile(filePath, JSON.stringify(section, null, 2));
};

describe('getSections', () => {
  beforeEach(async () => {
    await cleanupTestFiles();
  });

  afterEach(async () => {
    await cleanupTestFiles();
  });

  it('should return empty array when no sections exist', async () => {
    const result = await getSections();
    expect(result).toEqual([]);
  });

  it('should return single section with tasks', async () => {
    const testSection: Section = {
      name: 'Work Project',
      tasks: [
        {
          id: 'task-1',
          description: 'Complete feature implementation',
          priority: 'High',
          due_date: new Date('2024-01-15'),
          comments: 'Focus on performance',
          completed: false,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        }
      ]
    };

    await createTestSection(testSection);

    const result = await getSections();
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Work Project');
    expect(result[0].tasks).toHaveLength(1);
    expect(result[0].tasks[0].description).toEqual('Complete feature implementation');
    expect(result[0].tasks[0].priority).toEqual('High');
    expect(result[0].tasks[0].completed).toEqual(false);
  });

  it('should return multiple sections sorted by name', async () => {
    const section1: Section = {
      name: 'Personal Tasks',
      tasks: []
    };

    const section2: Section = {
      name: 'Work Project',
      tasks: []
    };

    const section3: Section = {
      name: 'Home Improvement',
      tasks: []
    };

    // Create sections in different order than expected result
    await createTestSection(section2);
    await createTestSection(section1);
    await createTestSection(section3);

    const result = await getSections();
    expect(result).toHaveLength(3);
    
    // Should be sorted alphabetically
    expect(result[0].name).toEqual('Home Improvement');
    expect(result[1].name).toEqual('Personal Tasks');
    expect(result[2].name).toEqual('Work Project');
  });

  it('should handle section with nullable task fields', async () => {
    const testSection: Section = {
      name: 'Test Section',
      tasks: [
        {
          id: 'task-1',
          description: 'Simple task',
          priority: 'Medium',
          due_date: null,
          comments: null,
          completed: true,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-02')
        }
      ]
    };

    await createTestSection(testSection);

    const result = await getSections();
    expect(result).toHaveLength(1);
    expect(result[0].tasks[0].due_date).toBeNull();
    expect(result[0].tasks[0].comments).toBeNull();
    expect(result[0].tasks[0].completed).toEqual(true);
  });

  it('should skip invalid JSON files and continue processing', async () => {
    // Create valid section
    const validSection: Section = {
      name: 'Valid Section',
      tasks: []
    };
    await createTestSection(validSection);

    // Create invalid JSON file
    await fs.mkdir(TEST_SECTIONS_DIR, { recursive: true });
    await fs.writeFile(join(TEST_SECTIONS_DIR, 'invalid.json'), 'invalid json content');

    const result = await getSections();
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Valid Section');
  });

  it('should create sections directory if it does not exist', async () => {
    // Ensure directory doesn't exist
    try {
      await fs.rmdir(TEST_SECTIONS_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist, which is fine
    }

    const result = await getSections();
    expect(result).toEqual([]);

    // Verify directory was created
    const stats = await fs.stat(TEST_SECTIONS_DIR);
    expect(stats.isDirectory()).toBe(true);
  });
});
