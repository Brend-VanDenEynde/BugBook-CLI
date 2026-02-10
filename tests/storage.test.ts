
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    addBug,
    getBugs,
    getTags,
    addTag,
    sanitizeInput,
    deleteBug,
    Bug,
    BUGS_DIR_PATH,
    TAGS_PATH
} from '../src/utils/storage';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Mock fs/promises and fs
vi.mock('fs/promises');
vi.mock('fs', async () => {
    const actual = await vi.importActual('fs');
    return {
        ...actual,
        existsSync: vi.fn(),
        promises: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            rename: vi.fn(),
            readdir: vi.fn(),
            unlink: vi.fn(),
            mkdir: vi.fn(),
        }
    };
});

// Mock config
vi.mock('../src/utils/config', () => ({
    getUserConfig: vi.fn(() => ({ user: { name: 'Test User' } }))
}));

describe('Storage Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default exist check to false
        (existsSync as any).mockReturnValue(false);
    });

    it('should sanitize input correctly', () => {
        const simple = '  test  ';
        expect(sanitizeInput(simple)).toBe('test');
    });

    it('should add a bug to storage as individual file', async () => {
        (existsSync as any).mockReturnValue(true);

        const newBug: Bug = {
            id: '123',
            timestamp: 'Now',
            category: 'General',
            error: 'Test Error',
            solution: 'Test Solution',
            status: 'Open'
        };

        await addBug(newBug);

        const expectedPath = path.join(BUGS_DIR_PATH, 'BUG-123.json');

        expect(fs.writeFile).toHaveBeenCalledWith(
            expectedPath,
            expect.stringContaining('"id": "123"'),
            expect.objectContaining({ mode: 0o600 })
        );

        // Verify author injection from mock config
        expect(fs.writeFile).toHaveBeenCalledWith(
            expectedPath,
            expect.stringContaining('"author": "Test User"'),
            expect.objectContaining({ mode: 0o600 })
        );
    });

    it('should retrieve bugs from individual files', async () => {
        // Mock readdir to return file list
        (fs.readdir as any).mockResolvedValue(['BUG-1.json', 'BUG-2.json', 'other.txt']);

        // Mock readFile to return content for files
        (fs.readFile as any).mockImplementation(async (filePath: string) => {
            if (filePath.includes('BUG-1.json')) return JSON.stringify({ id: '1', error: 'Error 1' });
            if (filePath.includes('BUG-2.json')) return JSON.stringify({ id: '2', error: 'Error 2' });
            return '';
        });

        (existsSync as any).mockReturnValue(true);

        const bugs = await getBugs();
        expect(bugs).toHaveLength(2);
        expect(bugs.find(b => b.id === '1')).toBeDefined();
        expect(bugs.find(b => b.id === '2')).toBeDefined();
    });

    it('should return empty array if bugs directory does not exist', async () => {
        (existsSync as any).mockReturnValue(false);
        const bugs = await getBugs();
        expect(bugs).toEqual([]);
    });

    it('should delete a bug file', async () => {
        (existsSync as any).mockReturnValue(true);
        const bugId = '123';
        await deleteBug(bugId);

        const expectedPath = path.join(BUGS_DIR_PATH, 'BUG-123.json');
        expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should add a new tag', async () => {
        (fs.readFile as any).mockResolvedValue('["General"]');
        (existsSync as any).mockReturnValue(true);

        const result = await addTag('Frontend');

        expect(result.success).toBe(true);
        expect(fs.writeFile).toHaveBeenCalledWith(
            TAGS_PATH,
            expect.stringContaining('"Frontend"'),
            expect.objectContaining({ mode: 0o600 })
        );
    });
});
