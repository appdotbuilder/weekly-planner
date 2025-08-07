
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { deleteSection } from '../handlers/delete_section';
import { type DeleteSectionInput, type Section } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Test data
const testSection: Section = {
  name: 'test-project',
  tasks: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Test task',
      priority: 'Medium',
      due_date: null,
      comments: null,
      completed: false,
      created_at: new Date('2024-01-01T10:00:00Z'),
      updated_at: new Date('2024-01-01T10:00:00Z')
    }
  ]
};

const testInput: DeleteSectionInput = {
  name: 'test-project'
};

// Helper function to setup directories
async function setupDirectories() {
  try {
    await fs.mkdir(SECTIONS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Helper function to create test file
async function createTestFile() {
  const filePath = join(SECTIONS_DIR, `${testSection.name}.json`);
  await fs.writeFile(filePath, JSON.stringify(testSection, null, 2));
}

// Helper function to cleanup test files
async function cleanupTestFiles() {
  try {
    const files = await fs.readdir(SECTIONS_DIR);
    const testFiles = files.filter(file => file.startsWith('test-'));
    
    for (const file of testFiles) {
      await fs.unlink(join(SECTIONS_DIR, file));
    }
  } catch (error) {
    // Directory might not exist or be empty
  }
}

describe('deleteSection', () => {
  beforeEach(async () => {
    await setupDirectories();
    await createTestFile();
  });

  afterEach(cleanupTestFiles);

  it('should delete existing section file', async () => {
    const result = await deleteSection(testInput);
    
    expect(result).toBe(true);
    
    // Verify file was deleted
    const filePath = join(SECTIONS_DIR, `${testInput.name}.json`);
    await expect(fs.access(filePath)).rejects.toThrow();
  });

  it('should throw error when section does not exist', async () => {
    const nonExistentInput: DeleteSectionInput = {
      name: 'non-existent-section'
    };

    await expect(deleteSection(nonExistentInput)).rejects.toThrow(/Section not found/i);
  });

  it('should handle special characters in section name', async () => {
    const specialSection: Section = {
      name: 'test-special-chars-@#$',
      tasks: []
    };

    // Create file with special characters
    const filePath = join(SECTIONS_DIR, `${specialSection.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(specialSection, null, 2));

    const specialInput: DeleteSectionInput = {
      name: specialSection.name
    };

    const result = await deleteSection(specialInput);
    
    expect(result).toBe(true);
    
    // Verify file was deleted
    await expect(fs.access(filePath)).rejects.toThrow();
  });
});
