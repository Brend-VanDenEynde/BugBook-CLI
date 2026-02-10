
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMarkdown } from '../src/commands/export';
import { validateFilePaths } from '../src/utils/storage';
import { Bug } from '../src/utils/storage';
import { existsSync } from 'fs';

// Mock fs
vi.mock('fs', async () => {
    const actual = await vi.importActual<typeof import('fs')>('fs');
    return {
        ...actual,
        default: {
            ...actual,
            existsSync: vi.fn(),
        },
        existsSync: vi.fn(),
    };
});

describe('Command Integration Tests', () => {

    describe('Export Command', () => {
        it('should generate correct markdown for bugs', () => {
            const bugs: Bug[] = [
                {
                    id: 'TEST-1',
                    timestamp: '2023-01-01',
                    category: 'Ui',
                    error: 'Button broken',
                    solution: 'Fix css',
                    status: 'Open',
                    priority: 'High',
                    files: ['src/ui.ts']
                },
                {
                    id: 'TEST-2',
                    timestamp: '2023-01-02',
                    category: 'Backend',
                    error: 'API fail',
                    solution: '',
                    status: 'Resolved',
                    priority: 'Low'
                }
            ];

            const md = generateMarkdown(bugs);

            expect(md).toContain('# BugBook Report');
            expect(md).toContain('## Open Bugs');
            expect(md).toContain('## Resolved Bugs');
            expect(md).toContain('TEST-1');
            expect(md).toContain('Button broken');
            expect(md).toContain('High');
            expect(md).toContain('src/ui.ts');
            expect(md).toContain('TEST-2');
            expect(md).toContain('API fail');
            expect(md).toContain('Low');
        });

        it('should handle empty bug list gracefully', () => {
            const md = generateMarkdown([]);
            expect(md).toContain('_No open bugs._');
            expect(md).toContain('_No resolved bugs._');
        });
    });

    describe('File Validation', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should return all paths but warn (console.log) if missing', () => {
            // Mock existsSync
            (existsSync as any).mockImplementation((path: string) => {
                return path === 'exists.ts';
            });

            // Spy on console.log
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            const inputs = ['exists.ts', 'missing.ts'];
            const results = validateFilePaths(inputs);

            // It should return BOTH because we only warn, not filter
            expect(results).toEqual(['exists.ts', 'missing.ts']);

            // Check if warning was logged for missing.ts - use stringMatching to avoid color code issues
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Warning: File 'missing.ts' does not exist/));

            consoleSpy.mockRestore();
        });
    });
});
