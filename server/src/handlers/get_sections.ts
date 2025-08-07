
import { promises as fs } from 'fs';
import { join } from 'path';
import { type Section, sectionSchema } from '../schema';

const SECTIONS_DIR = join(process.cwd(), 'data', 'sections');

export async function getSections(): Promise<Section[]> {
  try {
    // Ensure sections directory exists
    await fs.mkdir(SECTIONS_DIR, { recursive: true });

    // Read all JSON files in sections directory
    const files = await fs.readdir(SECTIONS_DIR);
    const sectionFiles = files.filter(file => file.endsWith('.json'));

    const sections: Section[] = [];
    
    for (const file of sectionFiles) {
      try {
        const filePath = join(SECTIONS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const sectionData = JSON.parse(fileContent);
        const section = sectionSchema.parse(sectionData);
        sections.push(section);
      } catch (error) {
        console.error(`Error reading section file ${file}:`, error);
        // Continue with other files - don't fail entire operation
      }
    }

    // Sort sections by name for consistent ordering
    sections.sort((a, b) => a.name.localeCompare(b.name));

    return sections;
  } catch (error) {
    console.error('Error reading sections directory:', error);
    throw error;
  }
}
