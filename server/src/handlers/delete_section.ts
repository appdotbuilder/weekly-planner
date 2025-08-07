
import { promises as fs } from 'fs';
import { join } from 'path';
import { type DeleteSectionInput } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function deleteSection(input: DeleteSectionInput): Promise<boolean> {
  const sectionPath = join(SECTIONS_DIR, `${input.name}.json`);

  try {
    // Check if file exists first
    await fs.access(sectionPath);
    
    // Delete section file
    await fs.unlink(sectionPath);
    return true;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error('Section not found');
    }
    throw new Error(`Failed to delete section: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
