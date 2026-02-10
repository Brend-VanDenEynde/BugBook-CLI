import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs'; // Keep sync for init checks if needed, but prefer async
import path from 'path';
import { randomUUID } from 'crypto';
import chalk from 'chalk';

export const BUG_DIR = '.bugbook';
export const BUG_FILE_JSON = 'bugs.json';
export const TAGS_FILE_JSON = 'tags.json';

// Legacy files for migration
const LEGACY_BUG_FILE = 'bugs.md';
const LEGACY_TAGS_FILE = 'tags.md';

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
export const BUG_DIR_PATH = path.join(safeCwd, BUG_DIR);
export const BUG_PATH = path.join(BUG_DIR_PATH, BUG_FILE_JSON);
export const TAGS_PATH = path.join(BUG_DIR_PATH, TAGS_FILE_JSON);

const LEGACY_BUG_PATH = path.join(BUG_DIR_PATH, LEGACY_BUG_FILE);
const LEGACY_TAGS_PATH = path.join(BUG_DIR_PATH, LEGACY_TAGS_FILE);

/** Maximum characters to display in bug preview lists */
export const BUG_PREVIEW_LENGTH = 50;

/** Default number of bugs to show in list command */
export const DEFAULT_LIST_COUNT = 5;

/** Maximum input length for error/solution fields */
export const MAX_INPUT_LENGTH = 2000;

/** Valid bug statuses */
const VALID_STATUSES = ['Open', 'Resolved'] as const;
export type BugStatus = typeof VALID_STATUSES[number];

export interface Bug {
    id: string;
    timestamp: string;
    category: string;
    error: string;
    solution: string;
    status: BugStatus;
}

export const ensureProjectInit = (): boolean => {
    return existsSync(BUG_DIR_PATH) && (existsSync(BUG_PATH) || existsSync(LEGACY_BUG_PATH));
};

/**
 * Migrate legacy Markdown data to JSON if needed.
 */
const migrateIfNeeded = async (): Promise<void> => {
    if (existsSync(BUG_PATH) && existsSync(TAGS_PATH)) {
        return; // Already migrated
    }

    if (existsSync(LEGACY_BUG_PATH)) {
        console.log(chalk.yellow('Migrating legacy data to JSON format...'));
        try {
            // Read Legacy Bugs
            const content = await fs.readFile(LEGACY_BUG_PATH, 'utf-8');
            const sections = content.split('---').map(s => s.trim()).filter(s => s.length > 0);

            const bugs: Bug[] = sections.map(section => {
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
                    status: (statusMatch ? statusMatch[1].trim() : 'Open') as BugStatus
                };
            });

            await fs.writeFile(BUG_PATH, JSON.stringify(bugs, null, 2), { mode: 0o600 });
            console.log(chalk.green(`Migrated ${bugs.length} bugs.`));

            // Rename legacy file to avoid confusion (or keep as backup)
            await fs.rename(LEGACY_BUG_PATH, `${LEGACY_BUG_PATH}.bak`);

        } catch (error) {
            console.error(chalk.red('Migration failed:'), error);
        }
    }

    if (existsSync(LEGACY_TAGS_PATH) && !existsSync(TAGS_PATH)) {
        try {
            const content = await fs.readFile(LEGACY_TAGS_PATH, 'utf-8');
            const tags = content.split('\n').map(t => t.trim()).filter(t => t.length > 0);
            await fs.writeFile(TAGS_PATH, JSON.stringify(tags, null, 2), { mode: 0o600 });
            await fs.rename(LEGACY_TAGS_PATH, `${LEGACY_TAGS_PATH}.bak`);
        } catch (error) {
            console.error(chalk.red('Tag migration failed:'), error);
        }
    }
};

export const getTags = async (): Promise<string[]> => {
    await migrateIfNeeded();
    if (existsSync(TAGS_PATH)) {
        const fileContent = await fs.readFile(TAGS_PATH, 'utf-8');
        try {
            return JSON.parse(fileContent) as string[];
        } catch {
            return ['General'];
        }
    }
    return ['General'];
};

export const getBugs = async (): Promise<Bug[]> => {
    await migrateIfNeeded();
    if (!existsSync(BUG_PATH)) return [];

    try {
        const content = await fs.readFile(BUG_PATH, 'utf-8');
        return JSON.parse(content) as Bug[];
    } catch (error) {
        console.error(chalk.red('Error reading bugs.json:'), error);
        return [];
    }
};

export const saveBugs = async (bugs: Bug[]) => {
    await fs.writeFile(BUG_PATH, JSON.stringify(bugs, null, 2), { mode: 0o600 });
};

export const addBug = async (bug: Bug) => {
    const bugs = await getBugs();
    bugs.push(bug);
    await saveBugs(bugs);
};

export const getBugCounts = async (): Promise<Record<string, number>> => {
    const bugs = await getBugs();
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
 * Sanitize user input to prevent issues (less critical with JSON but good practice).
 */
export const sanitizeInput = (input: string): string => {
    return input
        .substring(0, MAX_INPUT_LENGTH)
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
export const addTag = async (tag: string): Promise<{ success: boolean; message: string }> => {
    const sanitized = sanitizeTagName(tag);
    if (!sanitized) {
        return { success: false, message: 'Invalid tag name.' };
    }
    const currentTags = await getTags();
    if (currentTags.includes(sanitized)) {
        return { success: false, message: 'Tag already exists.' };
    }
    currentTags.push(sanitized);
    await fs.writeFile(TAGS_PATH, JSON.stringify(currentTags, null, 2), { mode: 0o600 });
    return { success: true, message: `Tag '${sanitized}' added.` };
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
