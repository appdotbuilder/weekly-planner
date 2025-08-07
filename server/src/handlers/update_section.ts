
import { promises as fs } from 'fs';
import { join } from 'path';
import { type RenameSectionInput, type Section } from '../schema';

const DATA_DIR = join(process.cwd(), 'data', 'sections');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
};

export const updateSection = async (input: RenameSectionInput): Promise<Section> => {
  try {
    await ensureDataDir();

    const oldFilePath = join(DATA_DIR, `${input.old_name}.json`);
    const newFilePath = join(DATA_DIR, `${input.new_name}.json`);

    // Check if old file exists
    try {
      await fs.access(oldFilePath);
    } catch (error) {
      throw new Error(`Section "${input.old_name}" not found`);
    }

    // Check if new name already exists
    try {
      await fs.access(newFilePath);
      throw new Error(`Section "${input.new_name}" already exists`);
    } catch (error) {
      // File doesn't exist, which is what we want
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
    }

    // Read current section data
    const fileContent = await fs.readFile(oldFilePath, 'utf-8');
    const sectionData: Section = JSON.parse(fileContent);

    // Update section name and write to new file
    const updatedSection: Section = {
      ...sectionData,
      name: input.new_name
    };

    await fs.writeFile(newFilePath, JSON.stringify(updatedSection, null, 2));

    // Remove old file
    await fs.unlink(oldFilePath);

    return updatedSection;
  } catch (error) {
    console.error('Section update failed:', error);
    throw error;
  }
};
