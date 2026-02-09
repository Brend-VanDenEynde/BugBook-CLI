import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const BUG_DIR = '.bugbook';
export const BUG_FILE = 'bugs.md';
export const TAGS_FILE = 'tags.md';
export const BUG_PATH = path.join(process.cwd(), BUG_DIR, BUG_FILE);
export const TAGS_PATH = path.join(process.cwd(), BUG_DIR, TAGS_FILE);

export interface Bug {
    id: string;
    timestamp: string;
    category: string;
    error: string;
    solution: string;
    status: 'Open' | 'Resolved';
}

export const getTags = (): string[] => {
    if (fs.existsSync(TAGS_PATH)) {
        const fileContent = fs.readFileSync(TAGS_PATH, 'utf-8');
        return fileContent.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    }
    return ['General'];
};

export const getBugs = (): Bug[] => {
    if (!fs.existsSync(BUG_PATH)) return [];

    const content = fs.readFileSync(BUG_PATH, 'utf-8');
    const sections = content.split('---').map(s => s.trim()).filter(s => s.length > 0);

    return sections.map(section => {
        // Extract fields using Regex
        const idMatch = section.match(/\*\*ID:\*\*\s*(.*)/i);
        const catMatch = section.match(/\*\*Category:\*\*\s*(.*)/i);
        const errMatch = section.match(/\*\*Error:\*\*\s*(.*)/i);
        const solMatch = section.match(/\*\*Solution:\*\*\s*(.*)/i);
        const statusMatch = section.match(/\*\*Status:\*\*\s*(.*)/i);
        const timeMatch = section.match(/^## \[(.*)\]/);

        return {
            id: idMatch ? idMatch[1].trim() : 'UNKNOWN',
            timestamp: timeMatch ? timeMatch[1].trim() : new Date().toLocaleString(),
            category: catMatch ? catMatch[1].trim() : 'General',
            error: errMatch ? errMatch[1].trim() : '',
            solution: solMatch ? solMatch[1].trim() : '',
            status: (statusMatch ? statusMatch[1].trim() : 'Open') as 'Open' | 'Resolved'
        };
    });
};

export const saveBugs = (bugs: Bug[]) => {
    const content = bugs.map(b => {
        return `
## [${b.timestamp}]
**ID:** ${b.id}
**Status:** ${b.status}
**Category:** ${b.category}
**Error:** ${b.error}
**Solution:** ${b.solution}
---
`.trim() + '\n';
    }).join('\n');

    fs.writeFileSync(BUG_PATH, content);
};

export const addBug = (bug: Bug) => {
    const bugs = getBugs();
    bugs.push(bug);
    saveBugs(bugs);
};

export const getBugCounts = (): Record<string, number> => {
    const bugs = getBugs();
    const counts: Record<string, number> = {};
    bugs.forEach(b => {
        counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
};

export const generateId = (): string => {
    return randomUUID().substring(0, 8).toUpperCase();
};

/** Maximum characters to display in bug preview lists */
export const BUG_PREVIEW_LENGTH = 50;

/**
 * Sanitize user input to prevent markdown parsing issues.
 * Escapes special markdown characters that could break file parsing.
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/[\r\n]+/g, ' ')              // Remove newlines
        .replace(/---/g, '\u2014\u2014\u2014') // Replace --- with em-dashes
        .replace(/\*\*/g, '__')                // Replace ** with __
        .replace(/^#+/gm, '')                  // Remove heading markers
        .trim();
};

/**
 * Validate and sanitize tag name.
 * Only allows alphanumeric characters, spaces, and hyphens.
 */
export const sanitizeTagName = (tag: string): string => {
    return tag.trim().replace(/[^\w\s-]/g, '');
};

/**
 * Add a new tag to the tags file.
 * Returns true if tag was added, false if invalid or already exists.
 */
export const addTag = (tag: string): { success: boolean; message: string } => {
    const sanitized = sanitizeTagName(tag);
    if (!sanitized) {
        return { success: false, message: 'Invalid tag name.' };
    }
    const currentTags = getTags();
    if (currentTags.includes(sanitized)) {
        return { success: false, message: 'Tag already exists.' };
    }
    fs.appendFileSync(TAGS_PATH, `${sanitized}\n`);
    return { success: true, message: `Tag '${sanitized}' added.` };
};

export const ensureProjectInit = (): boolean => {
    return fs.existsSync(BUG_DIR) && fs.existsSync(BUG_PATH);
};
