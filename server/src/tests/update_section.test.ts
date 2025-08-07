
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { promises as fs } from 'fs';
import { join } from 'path';
import { type RenameSectionInput, type Section } from '../schema';
import { updateSection } from '../handlers/update_section';

const DATA_DIR = join(process.cwd(), 'data', 'sections');

const testSection: Section = {
  name: 'Test Section',
  tasks: [
    {
      id: 'task-1',
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

const testInput: RenameSectionInput = {
  old_name: 'Test Section',
  new_name: 'Updated Section'
};

describe('updateSection', () => {
  beforeEach(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  });

  it('should rename a section successfully', async () => {
    // Create initial section file
    const filePath = join(DATA_DIR, 'Test Section.json');
    await fs.writeFile(filePath, JSON.stringify(testSection, null, 2));

    const result = await updateSection(testInput);

    expect(result.name).toEqual('Updated Section');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].description).toEqual('Test task');
  });

  it('should create new file and remove old file', async () => {
    // Create initial section file
    const oldFilePath = join(DATA_DIR, 'Test Section.json');
    await fs.writeFile(oldFilePath, JSON.stringify(testSection, null, 2));

    await updateSection(testInput);

    // Check old file is removed
    await expect(fs.access(oldFilePath)).rejects.toThrow();

    // Check new file exists
    const newFilePath = join(DATA_DIR, 'Updated Section.json');
    const newFileContent = await fs.readFile(newFilePath, 'utf-8');
    const parsedContent: Section = JSON.parse(newFileContent);

    expect(parsedContent.name).toEqual('Updated Section');
    expect(parsedContent.tasks).toHaveLength(1);
  });

  it('should preserve task data when renaming', async () => {
    // Create section with multiple tasks
    const sectionWithTasks: Section = {
      name: 'Multi Task Section',
      tasks: [
        {
          id: 'task-1',
          description: 'First task',
          priority: 'High',
          due_date: new Date('2024-02-01T00:00:00Z'),
          comments: 'Important task',
          completed: false,
          created_at: new Date('2024-01-01T10:00:00Z'),
          updated_at: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 'task-2',
          description: 'Second task',
          priority: 'Low',
          due_date: null,
          comments: null,
          completed: true,
          created_at: new Date('2024-01-02T10:00:00Z'),
          updated_at: new Date('2024-01-02T10:00:00Z')
        }
      ]
    };

    const filePath = join(DATA_DIR, 'Multi Task Section.json');
    await fs.writeFile(filePath, JSON.stringify(sectionWithTasks, null, 2));

    const renameInput: RenameSectionInput = {
      old_name: 'Multi Task Section',
      new_name: 'Renamed Multi Section'
    };

    const result = await updateSection(renameInput);

    expect(result.name).toEqual('Renamed Multi Section');
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].description).toEqual('First task');
    expect(result.tasks[0].priority).toEqual('High');
    expect(result.tasks[0].comments).toEqual('Important task');
    expect(result.tasks[1].description).toEqual('Second task');
    expect(result.tasks[1].completed).toEqual(true);
  });

  it('should throw error if section does not exist', async () => {
    const nonExistentInput: RenameSectionInput = {
      old_name: 'Non Existent Section',
      new_name: 'New Name'
    };

    await expect(updateSection(nonExistentInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error if new section name already exists', async () => {
    // Create two sections
    const firstSection = { ...testSection, name: 'First Section' };
    const secondSection = { ...testSection, name: 'Second Section' };

    await fs.writeFile(join(DATA_DIR, 'First Section.json'), JSON.stringify(firstSection, null, 2));
    await fs.writeFile(join(DATA_DIR, 'Second Section.json'), JSON.stringify(secondSection, null, 2));

    const conflictInput: RenameSectionInput = {
      old_name: 'First Section',
      new_name: 'Second Section' // This already exists
    };

    await expect(updateSection(conflictInput)).rejects.toThrow(/already exists/i);
  });
});
