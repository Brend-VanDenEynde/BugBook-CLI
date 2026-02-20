
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleStats } from '../src/commands/stats';
import { handleVersion } from '../src/commands/version';
import { Bug } from '../src/utils/storage';

vi.mock('../src/utils/storage', () => ({
    getBugs: vi.fn(),
    getOverdueBugs: vi.fn().mockReturnValue([]),
    ensureProjectInit: vi.fn().mockReturnValue(true)
}));

import { getBugs, getOverdueBugs, ensureProjectInit } from '../src/utils/storage';

const makeBug = (overrides: Partial<Bug> = {}): Bug => ({
    id: 'AAAABBBB',
    timestamp: '2024-01-01',
    category: 'General',
    error: 'Error',
    solution: '',
    status: 'Open',
    ...overrides
});

describe('Stats & Version', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ensureProjectInit as any).mockReturnValue(true);
        (getOverdueBugs as any).mockReturnValue([]);
    });

    // ── handleStats ───────────────────────────────────────────────────────────

    describe('handleStats', () => {
        it('prints error when project is not initialized', async () => {
            (ensureProjectInit as any).mockReturnValue(false);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/not initialized/i));
            errorSpy.mockRestore();
            logSpy.mockRestore();
        });

        it('prints "No bugs recorded yet." when bug list is empty', async () => {
            (getBugs as any).mockResolvedValue([]);
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/No bugs recorded yet/));
            logSpy.mockRestore();
        });

        it('displays total bug count', async () => {
            (getBugs as any).mockResolvedValue([makeBug(), makeBug({ id: 'BBBBCCCC' })]);
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            // "Total Bugs:     2"
            expect(output).toMatch(/Total Bugs.*2/);
            logSpy.mockRestore();
        });

        it('displays correct open and resolved counts', async () => {
            const bugs: Bug[] = [
                makeBug({ id: '00000001', status: 'Open' }),
                makeBug({ id: '00000002', status: 'Open' }),
                makeBug({ id: '00000003', status: 'Resolved' }),
            ];
            (getBugs as any).mockResolvedValue(bugs);
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toMatch(/Open.*2/);
            expect(output).toMatch(/Resolved.*1/);
            logSpy.mockRestore();
        });

        it('groups and displays category counts', async () => {
            const bugs: Bug[] = [
                makeBug({ id: '00000001', category: 'Backend' }),
                makeBug({ id: '00000002', category: 'Backend' }),
                makeBug({ id: '00000003', category: 'Frontend' }),
            ];
            (getBugs as any).mockResolvedValue(bugs);
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('Backend: 2');
            expect(output).toContain('Frontend: 1');
            logSpy.mockRestore();
        });

        it('displays overdue count when there are overdue bugs', async () => {
            const bug = makeBug({ dueDate: '2020-01-01' });
            (getBugs as any).mockResolvedValue([bug]);
            (getOverdueBugs as any).mockReturnValue([bug]);
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toMatch(/Overdue.*1/);
            logSpy.mockRestore();
        });

        it('does NOT print overdue line when there are no overdue bugs', async () => {
            (getBugs as any).mockResolvedValue([makeBug()]);
            (getOverdueBugs as any).mockReturnValue([]);
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await handleStats();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).not.toMatch(/Overdue/);
            logSpy.mockRestore();
        });
    });

    // ── handleVersion ─────────────────────────────────────────────────────────

    describe('handleVersion', () => {
        it('logs the version with a leading "v"', () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            handleVersion();
            expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^v\d+\.\d+\.\d+/));
            logSpy.mockRestore();
        });
    });
});
