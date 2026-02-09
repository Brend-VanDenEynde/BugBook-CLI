import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import chalk from 'chalk';

export const BUG_DIR = '.bugbook';
export const BUG_FILE = 'bugs.md';
export const TAGS_FILE = 'tags.md';

/**
 * Validate that the current working directory is safe.
 * Prevents path traversal attacks via symlinks or unusual paths.
 */
const validateCwd = (): string => {
    const cwd = process.cwd();
    // Ensure path is absolute and normalized
    const normalized = path.resolve(cwd);
    // Check that we're not in a system directory
    const systemDirs = ['/etc', '/usr', '/bin', '/sbin', 'C:\\Windows', 'C:\\Program Files'];
    for (const sysDir of systemDirs) {
        if (normalized.toLowerCase().startsWith(sysDir.toLowerCase())) {
            throw new Error(`Cannot initialize bugbook in system directory: ${normalized}`);
        }
    }
    return normalized;
};

const safeCwd = validateCwd();
export const BUG_PATH = path.join(safeCwd, BUG_DIR, BUG_FILE);
export const TAGS_PATH = path.join(safeCwd, BUG_DIR, TAGS_FILE);

/** Maximum characters to display in bug preview lists */
export const BUG_PREVIEW_LENGTH = 50;

/** Default number of bugs to show in list command */
export const DEFAULT_LIST_COUNT = 5;

/** Maximum input length for error/solution fields */
export const MAX_INPUT_LENGTH = 2000;

/** Valid bug statuses */
const VALID_STATUSES = ['Open', 'Resolved'] as const;
type BugStatus = typeof VALID_STATUSES[number];

export interface Bug {
    id: string;
    timestamp: string;
    category: string;
    error: string;
    solution: string;
    status: BugStatus;
}

export const getTags = (): string[] => {
    if (fs.existsSync(TAGS_PATH)) {
        const fileContent = fs.readFileSync(TAGS_PATH, 'utf-8');
        return fileContent.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    }
    return ['General'];
};

/**
 * Validate and normalize status value.
 */
const validateStatus = (status: string): BugStatus => {
    const trimmed = status.trim();
    if (VALID_STATUSES.includes(trimmed as BugStatus)) {
        return trimmed as BugStatus;
    }
    return 'Open';
};

export const getBugs = (): Bug[] => {
    if (!fs.existsSync(BUG_PATH)) return [];

    const content = fs.readFileSync(BUG_PATH, 'utf-8');
    const sections = content.split('---').map(s => s.trim()).filter(s => s.length > 0);

    return sections.map(section => {
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
            status: validateStatus(statusMatch ? statusMatch[1] : 'Open')
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

/**
 * Sanitize user input to prevent markdown parsing issues.
 */
export const sanitizeInput = (input: string): string => {
    return input
        .substring(0, MAX_INPUT_LENGTH)
        .replace(/[\r\n]+/g, ' ')
        .replace(/---/g, '\u2014\u2014\u2014')
        .replace(/\*\*/g, '__')
        .replace(/^#+/gm, '')
        .trim();
};

/**
 * Validate and sanitize tag name.
 */
export const sanitizeTagName = (tag: string): string => {
    return tag.trim().replace(/[^\w\s-]/g, '');
};

/**
 * Add a new tag to the tags file.
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

/**
 * Display a single bug entry with consistent formatting.
 */
export const displayBug = (bug: Bug): void => {
    console.log(chalk.white('--------------------------------------------------'));
    const statusIcon = bug.status === 'Resolved' ? '✅' : '🔴';
    console.log(`${chalk.bold.white('ID:')} ${bug.id}  ${statusIcon} ${bug.status}`);
    console.log(`${chalk.bold.white('Category:')} ${bug.category}`);
    console.log(`${chalk.bold.white('Error:')} ${bug.error}`);
    console.log(`${chalk.bold.white('Solution:')} ${bug.solution}`);
};

/**
 * Display multiple bugs with a separator at the end.
 */
export const displayBugs = (bugs: Bug[]): void => {
    bugs.forEach(displayBug);
    console.log(chalk.white('--------------------------------------------------'));
};
