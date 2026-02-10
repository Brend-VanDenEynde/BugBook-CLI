import fs from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import chalk from 'chalk';
import { getUserConfig } from './config';

export const BUG_DIR = '.bugbook';
export const BUGS_SUBDIR = 'bugs';
export const BUG_FILE_JSON = 'bugs.json'; // Legacy
export const TAGS_FILE_JSON = 'tags.json';

// Legacy files for migration
const LEGACY_BUG_FILE = 'bugs.md';
const LEGACY_TAGS_FILE = 'tags.md';

/**
 * Validate that the current working directory is safe.
 */
const validateCwd = (): string => {
    const cwd = process.cwd();
    const normalized = path.resolve(cwd);
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
export const BUGS_DIR_PATH = path.join(BUG_DIR_PATH, BUGS_SUBDIR);
export const TAGS_PATH = path.join(BUG_DIR_PATH, TAGS_FILE_JSON);

// Legacy paths
export const LEGACY_BUG_JSON_PATH = path.join(BUG_DIR_PATH, BUG_FILE_JSON);
const LEGACY_BUG_MD_PATH = path.join(BUG_DIR_PATH, LEGACY_BUG_FILE);
const LEGACY_TAGS_MD_PATH = path.join(BUG_DIR_PATH, LEGACY_TAGS_FILE);

export const BUG_PREVIEW_LENGTH = 50;
export const DEFAULT_LIST_COUNT = 5;
export const MAX_INPUT_LENGTH = 2000;

const VALID_STATUSES = ['Open', 'Resolved'] as const;
export type BugStatus = typeof VALID_STATUSES[number];

export type BugPriority = 'High' | 'Medium' | 'Low';

export interface Bug {
    id: string;
    timestamp: string;
    category: string;
    error: string;
    solution: string;
    status: BugStatus;
    author?: string;
    priority?: BugPriority;
    files?: string[];
}

export const ensureProjectInit = (): boolean => {
    // Check if .bugbook exists
    return existsSync(BUG_DIR_PATH);
};

export const initStorage = async () => {
    if (!existsSync(BUG_DIR_PATH)) {
        await fs.mkdir(BUG_DIR_PATH, { recursive: true });
    }
    if (!existsSync(BUGS_DIR_PATH)) {
        await fs.mkdir(BUGS_DIR_PATH, { recursive: true });
    }
};

/**
 * Migrate legacy data to individual JSON files.
 */
const migrateIfNeeded = async (): Promise<void> => {
    await initStorage();

    // 1. Migrate bugs.json (Legacy JSON) to individual files
    if (existsSync(LEGACY_BUG_JSON_PATH)) {
        console.log(chalk.yellow('Migrating bugs.json to individual files...'));
        try {
            const content = await fs.readFile(LEGACY_BUG_JSON_PATH, 'utf-8');
            const bugs: Bug[] = JSON.parse(content);

            for (const bug of bugs) {
                const bugPath = path.join(BUGS_DIR_PATH, `BUG-${bug.id}.json`);
                if (!existsSync(bugPath)) {
                    await fs.writeFile(bugPath, JSON.stringify(bug, null, 2), { mode: 0o600 });
                }
            }

            await fs.rename(LEGACY_BUG_JSON_PATH, `${LEGACY_BUG_JSON_PATH}.bak`);
            console.log(chalk.green(`Migrated ${bugs.length} bugs from bugs.json.`));
        } catch (error) {
            console.error(chalk.red('Migration from bugs.json failed:'), error);
        }
    }

    // 2. Migrate bugs.md (Legacy Markdown) to individual files
    if (existsSync(LEGACY_BUG_MD_PATH)) {
        console.log(chalk.yellow('Migrating legacy Markdown to individual files...'));
        try {
            const content = await fs.readFile(LEGACY_BUG_MD_PATH, 'utf-8');
            const sections = content.split('---').map(s => s.trim()).filter(s => s.length > 0);

            let count = 0;
            for (const section of sections) {
                const idMatch = section.match(/\*\*ID:\*\*\s*(.*)/i);
                const catMatch = section.match(/\*\*Category:\*\*\s*(.*)/i);
                const errMatch = section.match(/\*\*Error:\*\*\s*(.*)/i);
                const solMatch = section.match(/\*\*Solution:\*\*\s*(.*)/i);
                const statusMatch = section.match(/\*\*Status:\*\*\s*(.*)/i);
                const timeMatch = section.match(/^## \[(.*)\]/);

                const bug: Bug = {
                    id: idMatch ? idMatch[1].trim() : generateId(),
                    timestamp: timeMatch ? timeMatch[1].trim() : new Date().toLocaleString(),
                    category: catMatch ? catMatch[1].trim() : 'General',
                    error: errMatch ? errMatch[1].trim() : '',
                    solution: solMatch ? solMatch[1].trim() : '',
                    status: (statusMatch ? statusMatch[1].trim() : 'Open') as BugStatus,
                    author: '' // Legacy bugs have no author
                };

                const bugPath = path.join(BUGS_DIR_PATH, `BUG-${bug.id}.json`);
                if (!existsSync(bugPath)) {
                    await fs.writeFile(bugPath, JSON.stringify(bug, null, 2), { mode: 0o600 });
                    count++;
                }
            }

            await fs.rename(LEGACY_BUG_MD_PATH, `${LEGACY_BUG_MD_PATH}.bak`);
            console.log(chalk.green(`Migrated ${count} bugs from bugs.md.`));

        } catch (error) {
            console.error(chalk.red('Migration from bugs.md failed:'), error);
        }
    }

    // 3. Migrate tags
    if (existsSync(LEGACY_TAGS_MD_PATH) && !existsSync(TAGS_PATH)) {
        try {
            const content = await fs.readFile(LEGACY_TAGS_MD_PATH, 'utf-8');
            const tags = content.split('\n').map(t => t.trim()).filter(t => t.length > 0);
            await fs.writeFile(TAGS_PATH, JSON.stringify(tags, null, 2), { mode: 0o600 });
            await fs.rename(LEGACY_TAGS_MD_PATH, `${LEGACY_TAGS_MD_PATH}.bak`);
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
    if (!existsSync(BUGS_DIR_PATH)) return [];

    try {
        const files = await fs.readdir(BUGS_DIR_PATH);
        const bugs: Bug[] = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(BUGS_DIR_PATH, file), 'utf-8');
                bugs.push(JSON.parse(content));
            }
        }

        // Sort by timestamp descending (newest first)
        // Note: This relies on the timestamp string format which might not sort chronologically perfect if locale varies
        // but essentially we just return them. The list command can sort if needed.
        return bugs;

    } catch (error) {
        console.error(chalk.red('Error reading bugs directory:'), error);
        return [];
    }
};

export const saveBug = async (bug: Bug) => {
    await initStorage();
    const bugPath = path.join(BUGS_DIR_PATH, `BUG-${bug.id}.json`);
    await fs.writeFile(bugPath, JSON.stringify(bug, null, 2), { mode: 0o600 });
};

export const deleteBug = async (bugId: string) => {
    await initStorage();
    const bugPath = path.join(BUGS_DIR_PATH, `BUG-${bugId}.json`);
    if (existsSync(bugPath)) {
        await fs.unlink(bugPath);
    }
};

export const addBug = async (bug: Bug) => {
    // Inject author if available
    const config = getUserConfig();
    if (config.user?.name) {
        bug.author = config.user.name;
    }

    await saveBug(bug);
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

export const sanitizeInput = (input: string): string => {
    return input.substring(0, MAX_INPUT_LENGTH).trim();
};

export const sanitizeTagName = (tag: string): string => {
    return tag.trim().replace(/[^\w\s-]/g, '');
};

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

export const displayBug = (bug: Bug): void => {
    console.log(chalk.white('--------------------------------------------------'));
    const statusIcon = bug.status === 'Resolved' ? '✅' : '🔴';

    let priorityStr = '';
    if (bug.priority) {
        const pColor = bug.priority === 'High' ? chalk.red : (bug.priority === 'Medium' ? chalk.yellow : chalk.blue);
        priorityStr = ` [${pColor(bug.priority)}]`;
    }

    console.log(`${chalk.bold.white('ID:')} ${bug.id}  ${statusIcon} ${bug.status}${priorityStr}`);
    if (bug.author) {
        console.log(`${chalk.bold.white('Author:')} ${bug.author}`);
    }
    console.log(`${chalk.bold.white('Category:')} ${bug.category}`);
    console.log(`${chalk.bold.white('Error:')} ${bug.error}`);
    console.log(`${chalk.bold.white('Solution:')} ${bug.solution}`);

    if (bug.files && bug.files.length > 0) {
        console.log(`${chalk.bold.white('Files:')}`);
        bug.files.forEach(f => console.log(`  - ${f}`));
    }
};

export const displayBugs = (bugs: Bug[]): void => {
    bugs.forEach(displayBug);
    console.log(chalk.white('--------------------------------------------------'));
};

