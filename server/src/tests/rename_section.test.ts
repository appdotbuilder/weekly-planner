
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { renameSection } from '../handlers/rename_section';
import { type RenameSectionInput, type Section } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

const testSection: Section = {
  name: 'Test Section',
  tasks: [
    {
      id: '1',
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

describe('renameSection', () => {
  beforeEach(async () => {
    // Clean up and create test directory
    try {
      await fs.rm(SECTIONS_DIR, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir(SECTIONS_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(SECTIONS_DIR, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should rename section successfully', async () => {
    // Create test section
    const oldSectionPath = join(SECTIONS_DIR, 'Test Section.json');
    await fs.writeFile(oldSectionPath, JSON.stringify(testSection, null, 2));

    const input: RenameSectionInput = {
      old_name: 'Test Section',
      new_name: 'Renamed Section'
    };

    const result = await renameSection(input);

    expect(result).toBe(true);

    // Verify old file is deleted
    await expect(fs.access(oldSectionPath)).rejects.toThrow(/ENOENT/i);

    // Verify new file exists and has correct content
    const newSectionPath = join(SECTIONS_DIR, 'Renamed Section.json');
    const newFileContent = await fs.readFile(newSectionPath, 'utf-8');
    const renamedSection = JSON.parse(newFileContent);

    expect(renamedSection.name).toEqual('Renamed Section');
    expect(renamedSection.tasks).toHaveLength(1);
    expect(renamedSection.tasks[0].description).toEqual('Test task');
  });

  it('should preserve all task data during rename', async () => {
    const sectionWithMultipleTasks: Section = {
      name: 'Original',
      tasks: [
        {
          id: '1',
          description: 'First task',
          priority: 'High',
          due_date: new Date('2024-12-31T23:59:59Z'),
          comments: 'Important task',
          completed: false,
          created_at: new Date('2024-01-01T10:00:00Z'),
          updated_at: new Date('2024-01-02T11:00:00Z')
        },
        {
          id: '2',
          description: 'Second task',
          priority: 'Low',
          due_date: null,
          comments: null,
          completed: true,
          created_at: new Date('2024-01-03T12:00:00Z'),
          updated_at: new Date('2024-01-03T12:30:00Z')
        }
      ]
    };

    const oldSectionPath = join(SECTIONS_DIR, 'Original.json');
    await fs.writeFile(oldSectionPath, JSON.stringify(sectionWithMultipleTasks, null, 2));

    const input: RenameSectionInput = {
      old_name: 'Original',
      new_name: 'Updated'
    };

    await renameSection(input);

    // Verify all task data is preserved
    const newSectionPath = join(SECTIONS_DIR, 'Updated.json');
    const newFileContent = await fs.readFile(newSectionPath, 'utf-8');
    const renamedSection = JSON.parse(newFileContent);

    expect(renamedSection.name).toEqual('Updated');
    expect(renamedSection.tasks).toHaveLength(2);
    
    // Check first task
    expect(renamedSection.tasks[0].id).toEqual('1');
    expect(renamedSection.tasks[0].description).toEqual('First task');
    expect(renamedSection.tasks[0].priority).toEqual('High');
    expect(renamedSection.tasks[0].due_date).toEqual('2024-12-31T23:59:59.000Z');
    expect(renamedSection.tasks[0].comments).toEqual('Important task');
    expect(renamedSection.tasks[0].completed).toBe(false);

    // Check second task
    expect(renamedSection.tasks[1].id).toEqual('2');
    expect(renamedSection.tasks[1].description).toEqual('Second task');
    expect(renamedSection.tasks[1].priority).toEqual('Low');
    expect(renamedSection.tasks[1].due_date).toBeNull();
    expect(renamedSection.tasks[1].comments).toBeNull();
    expect(renamedSection.tasks[1].completed).toBe(true);
  });

  it('should throw error when section not found', async () => {
    const input: RenameSectionInput = {
      old_name: 'Non Existent',
      new_name: 'New Name'
    };

    await expect(renameSection(input)).rejects.toThrow(/section not found/i);
  });

  it('should throw error when target section already exists', async () => {
    // Create two test sections with proper structure
    const section1: Section = { ...testSection, name: 'Section 1' };
    const section2: Section = { ...testSection, name: 'Section 2' };
    
    const section1Path = join(SECTIONS_DIR, 'Section 1.json');
    const section2Path = join(SECTIONS_DIR, 'Section 2.json');
    
    await fs.writeFile(section1Path, JSON.stringify(section1, null, 2));
    await fs.writeFile(section2Path, JSON.stringify(section2, null, 2));

    const input: RenameSectionInput = {
      old_name: 'Section 1',
      new_name: 'Section 2' // This already exists
    };

    await expect(renameSection(input)).rejects.toThrow(/section with new name already exists/i);

    // Verify original files still exist by checking they can be read
    const file1Content = await fs.readFile(section1Path, 'utf-8');
    const file2Content = await fs.readFile(section2Path, 'utf-8');
    
    expect(JSON.parse(file1Content).name).toEqual('Section 1');
    expect(JSON.parse(file2Content).name).toEqual('Section 2');
  });

  it('should handle sections with special characters in names', async () => {
    const specialSection: Section = {
      name: 'Test & Dev!',
      tasks: []
    };

    const oldSectionPath = join(SECTIONS_DIR, 'Test & Dev!.json');
    await fs.writeFile(oldSectionPath, JSON.stringify(specialSection, null, 2));

    const input: RenameSectionInput = {
      old_name: 'Test & Dev!',
      new_name: 'Production (Final)'
    };

    const result = await renameSection(input);

    expect(result).toBe(true);

    // Verify rename worked with special characters
    const newSectionPath = join(SECTIONS_DIR, 'Production (Final).json');
    const newFileContent = await fs.readFile(newSectionPath, 'utf-8');
    const renamedSection = JSON.parse(newFileContent);

    expect(renamedSection.name).toEqual('Production (Final)');
  });

  it('should create data directory if it does not exist', async () => {
    // Remove the data directory completely
    await fs.rm(join(process.cwd(), 'data'), { recursive: true });

    // Try to rename a non-existent section - this should create the directory structure
    const input: RenameSectionInput = {
      old_name: 'Non Existent',
      new_name: 'New Section'
    };

    // This should fail because the section doesn't exist, but it should create the directory
    await expect(renameSection(input)).rejects.toThrow(/section not found/i);

    // Verify directory was created by checking it can be read
    const dirContents = await fs.readdir(SECTIONS_DIR);
    expect(Array.isArray(dirContents)).toBe(true);
  });
});
