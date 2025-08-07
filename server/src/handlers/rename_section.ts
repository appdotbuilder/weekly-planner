
import { promises as fs } from 'fs';
import { join } from 'path';
import { type RenameSectionInput, sectionSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function renameSection(input: RenameSectionInput): Promise<boolean> {
  const oldSectionPath = join(SECTIONS_DIR, `${input.old_name}.json`);
  const newSectionPath = join(SECTIONS_DIR, `${input.new_name}.json`);

  try {
    // Ensure data directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });

    // Check if old section exists
    try {
      await fs.access(oldSectionPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error('Section not found');
      }
      throw error;
    }

    // Check if new section name already exists
    try {
      await fs.access(newSectionPath);
      throw new Error('Section with new name already exists');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // Read existing section
    const fileContent = await fs.readFile(oldSectionPath, 'utf-8');
    const section = sectionSchema.parse(JSON.parse(fileContent));

    // Update section name
    section.name = input.new_name;

    // Write to new file
    await fs.writeFile(newSectionPath, JSON.stringify(section, null, 2));

    // Delete old file
    await fs.unlink(oldSectionPath);

    return true;
  } catch (error) {
    console.error('Section rename failed:', error);
    throw error;
  }
}
