import fs from 'fs';
import path from 'path';

export const BUG_DIR = '.bugbook';
export const BUG_FILE = 'bugs.md';
export const TAGS_FILE = 'tags.md';
export const BUG_PATH = path.join(process.cwd(), BUG_DIR, BUG_FILE);
export const TAGS_PATH = path.join(process.cwd(), BUG_DIR, TAGS_FILE);

export const getTags = (): string[] => {
    if (fs.existsSync(TAGS_PATH)) {
        const fileContent = fs.readFileSync(TAGS_PATH, 'utf-8');
        return fileContent.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    }
    return ['General'];
};

export const getBugCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    if (fs.existsSync(BUG_PATH)) {
        const fileContent = fs.readFileSync(BUG_PATH, 'utf-8');
        const regex = /\*\*Category:\*\* (.*)/g;
        let match;
        while ((match = regex.exec(fileContent)) !== null) {
            const tag = match[1].trim();
            counts[tag] = (counts[tag] || 0) + 1;
        }
    }
    return counts;
};

export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
};

export interface BugEntry {
    id: string;
    content: string;
}

export const parseBugs = (): BugEntry[] => {
    if (!fs.existsSync(BUG_PATH)) return [];
    const content = fs.readFileSync(BUG_PATH, 'utf-8');
    const entries = content.split('---').map(e => e.trim()).filter(e => e.length > 0);

    return entries.map(entry => {
        const idMatch = entry.match(/\*\*ID:\*\* (.*)/);
        return {
            id: idMatch ? idMatch[1].trim() : '',
            content: entry
        };
    });
};

export const ensureProjectInit = (): boolean => {
    return fs.existsSync(BUG_DIR) && fs.existsSync(BUG_PATH);
};
