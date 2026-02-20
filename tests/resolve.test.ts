
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleResolve } from '../src/commands/resolve';
import { Bug } from '../src/utils/storage';

vi.mock('../src/utils/storage', () => ({
    getBugs: vi.fn(),
    saveBug: vi.fn().mockResolvedValue(undefined),
    ensureProjectInit: vi.fn().mockReturnValue(true),
    validateBugId: vi.fn((id: string) => /^[0-9A-Fa-f]{8}$/i.test(id))
}));

vi.mock('../src/utils/prompts', () => ({
    selectBugPrompt: vi.fn()
}));

vi.mock('inquirer', () => ({
    default: { prompt: vi.fn() }
}));

vi.mock('../src/utils/github', () => ({
    getGitHubConfig: vi.fn(),
    closeGitHubIssue: vi.fn().mockResolvedValue(undefined),
    reopenGitHubIssue: vi.fn().mockResolvedValue(undefined)
}));

import { getBugs, saveBug, ensureProjectInit } from '../src/utils/storage';
import { selectBugPrompt } from '../src/utils/prompts';
import inquirer from 'inquirer';
import { getGitHubConfig, closeGitHubIssue, reopenGitHubIssue } from '../src/utils/github';

const makeBug = (overrides: Partial<Bug> = {}): Bug => ({
    id: 'AAAABBBB',
    timestamp: '2024-01-01',
    category: 'Backend',
    error: 'Something went wrong',
    solution: '',
    status: 'Open',
    ...overrides
});

describe('handleResolve', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        (ensureProjectInit as any).mockReturnValue(true);
        (saveBug as any).mockResolvedValue(undefined);
        (getGitHubConfig as any).mockReturnValue({});  // no GitHub config by default
        (closeGitHubIssue as any).mockResolvedValue(undefined);
        (reopenGitHubIssue as any).mockResolvedValue(undefined);
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('prints error and returns when project is not initialized', async () => {
        (ensureProjectInit as any).mockReturnValue(false);
        await handleResolve('');
        expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/not initialized/i));
        expect(getBugs).not.toHaveBeenCalled();
    });

    it('prints "No bugs found." when there are no bugs', async () => {
        (getBugs as any).mockResolvedValue([]);
        await handleResolve('');
        expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/No bugs found/));
    });

    it('prints error for an invalid hex bug ID', async () => {
        (getBugs as any).mockResolvedValue([makeBug()]);
        await handleResolve('INVALID!');
        expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/Invalid bug ID format/));
        expect(saveBug).not.toHaveBeenCalled();
    });

    it('resolves a single Open bug by ID (no confirm needed for 1 bug)', async () => {
        const bug = makeBug({ id: 'AAAABBBB', status: 'Open' });
        (getBugs as any).mockResolvedValue([bug]);

        await handleResolve('AAAABBBB');

        expect(saveBug).toHaveBeenCalledWith(expect.objectContaining({ id: 'AAAABBBB', status: 'Resolved' }));
        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toContain('Resolved');
    });

    it('toggles a Resolved bug back to Open', async () => {
        const bug = makeBug({ id: 'AAAABBBB', status: 'Resolved' });
        (getBugs as any).mockResolvedValue([bug]);

        await handleResolve('AAAABBBB');

        expect(saveBug).toHaveBeenCalledWith(expect.objectContaining({ status: 'Open' }));
    });

    it('prints warning for a bug ID that does not exist in the list', async () => {
        (getBugs as any).mockResolvedValue([makeBug({ id: 'AAAABBBB' })]);

        // CCCCDDDD is a valid hex format but not in the list
        await handleResolve('CCCCDDDD');

        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toContain('No bugs match the specified criteria');
    });

    it('resolves all Open bugs when --all-status Open --no-confirm is passed', async () => {
        const bugs: Bug[] = [
            makeBug({ id: 'AAAABBBB', status: 'Open' }),
            makeBug({ id: 'CCCCDDDD', status: 'Open' }),
            makeBug({ id: 'EEEEFFFF', status: 'Resolved' }),
        ];
        (getBugs as any).mockResolvedValue(bugs);
        (inquirer.prompt as any).mockResolvedValue({ confirm: true });

        await handleResolve('--all-status Open --no-confirm');

        // Only the 2 Open bugs should be saved (toggled to Resolved)
        expect(saveBug).toHaveBeenCalledTimes(2);
        const savedIds = (saveBug as any).mock.calls.map((c: any) => c[0].id);
        expect(savedIds).toContain('AAAABBBB');
        expect(savedIds).toContain('CCCCDDDD');
        expect(savedIds).not.toContain('EEEEFFFF');
    });

    it('resolves all bugs in a category with --all-tagged --no-confirm', async () => {
        const bugs: Bug[] = [
            makeBug({ id: 'AAAABBBB', category: 'Backend', status: 'Open' }),
            makeBug({ id: 'CCCCDDDD', category: 'Frontend', status: 'Open' }),
        ];
        (getBugs as any).mockResolvedValue(bugs);
        (inquirer.prompt as any).mockResolvedValue({ confirm: true });

        await handleResolve('--all-tagged Backend --no-confirm');

        expect(saveBug).toHaveBeenCalledTimes(1);
        expect((saveBug as any).mock.calls[0][0].id).toBe('AAAABBBB');
    });

    it('prints success summary after bulk resolve', async () => {
        const bugs: Bug[] = [
            makeBug({ id: 'AAAABBBB', status: 'Open' }),
            makeBug({ id: 'CCCCDDDD', status: 'Open' }),
        ];
        (getBugs as any).mockResolvedValue(bugs);
        (inquirer.prompt as any).mockResolvedValue({ confirm: true });

        await handleResolve('--all-status Open --no-confirm');

        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toContain('Summary');
        expect(output).toMatch(/Success.*2/);
    });

    it('calls selectBugPrompt when no args are provided', async () => {
        const bug = makeBug({ id: 'AAAABBBB' });
        (getBugs as any).mockResolvedValue([bug]);
        (selectBugPrompt as any).mockResolvedValue('AAAABBBB');

        await handleResolve('');

        expect(selectBugPrompt).toHaveBeenCalled();
    });

    // ── GitHub issue sync ─────────────────────────────────────────────────────

    it('closes GitHub issue when Open bug is resolved', async () => {
        const bug = makeBug({ id: 'AAAABBBB', status: 'Open', github_issue_number: 42 });
        (getBugs as any).mockResolvedValue([bug]);
        (getGitHubConfig as any).mockReturnValue({ token: 'ghp_t', owner: 'o', repo: 'r' });

        await handleResolve('AAAABBBB');

        expect(closeGitHubIssue).toHaveBeenCalledWith(42, 'o', 'r', 'ghp_t');
        expect(reopenGitHubIssue).not.toHaveBeenCalled();
        expect(saveBug).toHaveBeenCalledWith(expect.objectContaining({ github_issue_closed: true }));
    });

    it('reopens GitHub issue when Resolved bug is toggled back to Open', async () => {
        const bug = makeBug({ id: 'AAAABBBB', status: 'Resolved', github_issue_number: 42 });
        (getBugs as any).mockResolvedValue([bug]);
        (getGitHubConfig as any).mockReturnValue({ token: 'ghp_t', owner: 'o', repo: 'r' });

        await handleResolve('AAAABBBB');

        expect(reopenGitHubIssue).toHaveBeenCalledWith(42, 'o', 'r', 'ghp_t');
        expect(closeGitHubIssue).not.toHaveBeenCalled();
        expect(saveBug).toHaveBeenCalledWith(expect.objectContaining({ github_issue_closed: false }));
    });

    it('does not call GitHub when bug has no linked issue', async () => {
        const bug = makeBug({ status: 'Open' });  // no github_issue_number
        (getBugs as any).mockResolvedValue([bug]);
        (getGitHubConfig as any).mockReturnValue({ token: 'ghp_t', owner: 'o', repo: 'r' });

        await handleResolve('AAAABBBB');

        expect(closeGitHubIssue).not.toHaveBeenCalled();
        expect(saveBug).toHaveBeenCalled();
    });

    it('does not call GitHub when GitHub is not configured', async () => {
        const bug = makeBug({ status: 'Open', github_issue_number: 10 });
        (getBugs as any).mockResolvedValue([bug]);
        // getGitHubConfig returns {} (no token/owner/repo) — set in beforeEach

        await handleResolve('AAAABBBB');

        expect(closeGitHubIssue).not.toHaveBeenCalled();
    });

    it('GitHub sync failure is non-fatal (local save still happens)', async () => {
        const bug = makeBug({ status: 'Open', github_issue_number: 42 });
        (getBugs as any).mockResolvedValue([bug]);
        (getGitHubConfig as any).mockReturnValue({ token: 'ghp_t', owner: 'o', repo: 'r' });
        (closeGitHubIssue as any).mockRejectedValue(new Error('Network failure'));

        await handleResolve('AAAABBBB');

        expect(saveBug).toHaveBeenCalledWith(expect.objectContaining({ status: 'Resolved' }));
    });

    it('output includes GitHub feedback when issue is closed', async () => {
        const bug = makeBug({ id: 'AAAABBBB', status: 'Open', github_issue_number: 42 });
        (getBugs as any).mockResolvedValue([bug]);
        (getGitHubConfig as any).mockReturnValue({ token: 'ghp_t', owner: 'o', repo: 'r' });

        await handleResolve('AAAABBBB');

        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toContain('GitHub #42 closed');
    });

    it('output includes GitHub feedback when issue is reopened', async () => {
        const bug = makeBug({ id: 'AAAABBBB', status: 'Resolved', github_issue_number: 42 });
        (getBugs as any).mockResolvedValue([bug]);
        (getGitHubConfig as any).mockReturnValue({ token: 'ghp_t', owner: 'o', repo: 'r' });

        await handleResolve('AAAABBBB');

        const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
        expect(output).toContain('GitHub #42 reopened');
    });
});
