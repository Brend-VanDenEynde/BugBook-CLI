
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMarkdown } from '../src/commands/export';
import { warnMissingFiles, validateDateStr, isOverdue, Bug } from '../src/utils/storage';
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
            const results = warnMissingFiles(inputs);

            // It should return BOTH because we only warn, not filter
            expect(results).toEqual(['exists.ts', 'missing.ts']);

            // Check if warning was logged for missing.ts - use stringMatching to avoid color code issues
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Warning: File 'missing.ts' does not exist/));

            consoleSpy.mockRestore();
        });
    });

    describe('Date Validation', () => {
        it('should accept valid date strings', () => {
            expect(validateDateStr('2026-02-10')).toBe(true);
            expect(validateDateStr('2025-12-31')).toBe(true);
        });

        it('should accept empty string (skip)', () => {
            expect(validateDateStr('')).toBe(true);
            expect(validateDateStr('   ')).toBe(true);
        });

        it('should reject invalid date strings', () => {
            expect(validateDateStr('not-a-date')).toBe(false);
            expect(validateDateStr('2026/02/10')).toBe(false);
            expect(validateDateStr('10-02-2026')).toBe(false);
            expect(validateDateStr('2026-13-01')).toBe(false);
        });
    });

    describe('Overdue Detection', () => {
        it('should detect overdue open bugs', () => {
            const bug: Bug = {
                id: 'TEST-1',
                timestamp: '2023-01-01',
                category: 'General',
                error: 'Test bug',
                solution: '',
                status: 'Open',
                dueDate: '2020-01-01'
            };
            expect(isOverdue(bug)).toBe(true);
        });

        it('should not flag resolved bugs as overdue', () => {
            const bug: Bug = {
                id: 'TEST-2',
                timestamp: '2023-01-01',
                category: 'General',
                error: 'Test bug',
                solution: 'Fixed',
                status: 'Resolved',
                dueDate: '2020-01-01'
            };
            expect(isOverdue(bug)).toBe(false);
        });

        it('should not flag bugs with no due date', () => {
            const bug: Bug = {
                id: 'TEST-3',
                timestamp: '2023-01-01',
                category: 'General',
                error: 'Test bug',
                solution: '',
                status: 'Open'
            };
            expect(isOverdue(bug)).toBe(false);
        });

        it('should not flag future due dates as overdue', () => {
            const bug: Bug = {
                id: 'TEST-4',
                timestamp: '2023-01-01',
                category: 'General',
                error: 'Test bug',
                solution: '',
                status: 'Open',
                dueDate: '2099-12-31'
            };
            expect(isOverdue(bug)).toBe(false);
        });
    });

    describe('Export with Comments and Due Dates', () => {
        it('should include due dates and comments in markdown', () => {
            const bugs: Bug[] = [{
                id: 'TEST-C1',
                timestamp: '2023-01-01',
                category: 'Ui',
                error: 'Button broken',
                solution: 'Fix css',
                status: 'Open',
                priority: 'High',
                dueDate: '2026-03-01',
                comments: [
                    { text: 'Investigating...', timestamp: '2023-01-02', author: 'Dev' },
                    { text: 'Found root cause', timestamp: '2023-01-03' }
                ]
            }];

            const md = generateMarkdown(bugs);

            expect(md).toContain('2026-03-01');
            expect(md).toContain('Investigating...');
            expect(md).toContain('Found root cause');
            expect(md).toContain('(Dev)');
            expect(md).toContain('Comments');
        });
    });
});
