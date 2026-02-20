
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleList } from '../src/commands/list';
import { Bug } from '../src/utils/storage';

vi.mock('../src/utils/storage', () => ({
    getBugs: vi.fn(),
    displayBugs: vi.fn(),
    getOverdueBugs: vi.fn().mockReturnValue([]),
    DEFAULT_LIST_COUNT: 5
}));

import { getBugs, displayBugs, getOverdueBugs } from '../src/utils/storage';

// Sample bug fixtures
const makeBug = (overrides: Partial<Bug> = {}): Bug => ({
    id: 'AAAABBBB',
    timestamp: '2024-01-01T00:00:00Z',
    category: 'Backend',
    error: 'Error message',
    solution: '',
    status: 'Open',
    ...overrides
});

const bugs: Bug[] = [
    makeBug({ id: 'AAA00001', timestamp: '2024-01-01', category: 'Backend', error: 'Error 1', status: 'Open',     priority: 'High',   author: 'Alice' }),
    makeBug({ id: 'BBB00002', timestamp: '2024-01-02', category: 'Frontend', error: 'Error 2', status: 'Resolved', priority: 'Low',    author: 'Bob'   }),
    makeBug({ id: 'CCC00003', timestamp: '2024-01-03', category: 'Backend', error: 'Error 3', status: 'Open',     priority: 'Medium', author: 'Alice' }),
    makeBug({ id: 'DDD00004', timestamp: '2024-01-04', category: 'Backend', error: 'Error 4', status: 'Open',     priority: 'High'                    }),
];

describe('handleList', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        (getOverdueBugs as any).mockReturnValue([]);
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
    });

    it('prints "No bugs found." when there are no bugs at all', async () => {
        (getBugs as any).mockResolvedValue([]);
        await handleList('');
        expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/No bugs found/));
        expect(displayBugs).not.toHaveBeenCalled();
    });

    it('calls displayBugs when bugs exist and no filter is specified', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('');
        expect(displayBugs).toHaveBeenCalled();
    });

    it('filters by --priority and only shows matching bugs', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--priority High');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        expect(shown.every(b => b.priority === 'High')).toBe(true);
        expect(shown.length).toBeGreaterThan(0);
    });

    it('filters by --status and only shows matching bugs', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--status Resolved');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        expect(shown.every(b => b.status === 'Resolved')).toBe(true);
    });

    it('filters by --tagged (matches category case-insensitively)', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--tagged backend');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        expect(shown.every(b => b.category.toLowerCase() === 'backend')).toBe(true);
        expect(shown.length).toBe(3);
    });

    it('filters by --author (substring match)', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--author Alice');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        expect(shown.every(b => b.author?.toLowerCase().includes('alice'))).toBe(true);
    });

    it('prints "No bugs match the specified filters." when nothing matches', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        // Only BBB00002 is Low+Resolved; Low+Open does not exist
        await handleList('--priority Low --status Open');
        expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/No bugs match/));
        expect(displayBugs).not.toHaveBeenCalled();
    });

    it('respects --limit when a filter is active', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        // 3 Open bugs, limit to 1
        await handleList('--status Open --limit 1');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        expect(shown.length).toBe(1);
    });

    it('sorts by priority (descending) when --sort priority is set', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--status Open --sort priority');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        // All open: High=2, Medium=1. With desc order, High first.
        expect(shown[0].priority).toBe('High');
    });

    it('sorts by date ascending when --sort date --order asc is set', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--status Open --sort date --order asc');
        const shown = (displayBugs as any).mock.calls[0][0] as Bug[];
        // Oldest first: AAA00001 (2024-01-01)
        expect(shown[0].id).toBe('AAA00001');
    });

    it('prints overdue warning when getOverdueBugs returns bugs', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        (getOverdueBugs as any).mockReturnValue([bugs[0]]);
        await handleList('--status Open');
        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toMatch(/overdue/i);
    });

    it('shows filter info in output header when filters are active', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--status Open');
        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toContain('Filters:');
    });

    it('ignores invalid priority value and applies no filter', async () => {
        (getBugs as any).mockResolvedValue(bugs);
        await handleList('--priority Critical'); // not a valid priority
        // hasFilters stays false, so shows all bugs via DEFAULT_LIST_COUNT
        expect(displayBugs).toHaveBeenCalled();
    });
});
