
import { promises as fs } from 'fs';
import { join } from 'path';
import { type CreateSectionInput, type Section } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function createSection(input: CreateSectionInput): Promise<Section> {
  const sectionPath = join(SECTIONS_DIR, `${input.name}.json`);
  const newSection: Section = {
    name: input.name,
    tasks: []
  };

  try {
    // Ensure sections directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });

    // Check if section already exists
    try {
      await fs.access(sectionPath);
      throw new Error('Section already exists');
    } catch (error) {
      // File doesn't exist, which is what we want
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // Create new section file
    await fs.writeFile(sectionPath, JSON.stringify(newSection, null, 2));

    return newSection;
  } catch (error) {
    console.error('Section creation failed:', error);
    throw error;
  }
}
