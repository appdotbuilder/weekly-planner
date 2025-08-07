
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createSection } from '../handlers/create_section';
import { type CreateSectionInput } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

// Test data
const testInput: CreateSectionInput = {
  name: 'Test Project'
};

const testInputSpecialChars: CreateSectionInput = {
  name: 'Project-With_Special.Chars'
};

describe('createSection', () => {
  beforeEach(async () => {
    // Ensure sections directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(SECTIONS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(join(SECTIONS_DIR, file));
        }
      }
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  it('should create a new section', async () => {
    const result = await createSection(testInput);

    expect(result.name).toEqual('Test Project');
    expect(result.tasks).toEqual([]);
    expect(Array.isArray(result.tasks)).toBe(true);
  });

  it('should create section file on disk', async () => {
    const result = await createSection(testInput);
    const sectionPath = join(SECTIONS_DIR, `${testInput.name}.json`);

    // Check file exists
    const fileExists = await fs.access(sectionPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Check file content
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);
    
    expect(parsedContent.name).toEqual('Test Project');
    expect(parsedContent.tasks).toEqual([]);
  });

  it('should handle section names with special characters', async () => {
    const result = await createSection(testInputSpecialChars);
    const sectionPath = join(SECTIONS_DIR, `${testInputSpecialChars.name}.json`);

    expect(result.name).toEqual('Project-With_Special.Chars');

    // Verify file was created with correct name
    const fileExists = await fs.access(sectionPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should throw error if section already exists', async () => {
    // Create section first time
    await createSection(testInput);

    // Try to create same section again
    expect(createSection(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should create sections directory if it does not exist', async () => {
    // Remove sections directory
    try {
      await fs.rmdir(SECTIONS_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist, ignore
    }

    // Create section - should recreate directory
    const result = await createSection(testInput);
    
    expect(result.name).toEqual('Test Project');
    
    // Verify directory and file exist
    const dirExists = await fs.access(SECTIONS_DIR).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);

    const sectionPath = join(SECTIONS_DIR, `${testInput.name}.json`);
    const fileExists = await fs.access(sectionPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should create properly formatted JSON file', async () => {
    await createSection(testInput);
    const sectionPath = join(SECTIONS_DIR, `${testInput.name}.json`);
    
    const fileContent = await fs.readFile(sectionPath, 'utf-8');
    
    // Should be properly formatted JSON (with indentation)
    expect(fileContent).toContain('{\n  "name"');
    expect(fileContent).toContain('"tasks": []');
    
    // Should be valid JSON
    const parsedContent = JSON.parse(fileContent);
    expect(typeof parsedContent).toBe('object');
    expect(parsedContent.name).toBe('Test Project');
    expect(Array.isArray(parsedContent.tasks)).toBe(true);
  });
});
