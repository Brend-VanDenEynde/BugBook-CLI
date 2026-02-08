import fs from 'fs';
import path from 'path';

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
    return Math.random().toString(36).substr(2, 6).toUpperCase();
};

export const ensureProjectInit = (): boolean => {
    return fs.existsSync(BUG_DIR) && fs.existsSync(BUG_PATH);
};
