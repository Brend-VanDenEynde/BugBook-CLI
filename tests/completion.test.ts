
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    generateCompletionScript,
    handleCompletion,
    handleCompletionUninstall,
    handleCompletionSetup
} from '../src/commands/completion';

// Mock the omelette-based completion utility (createCompletion calls omelette internals)
vi.mock('../src/utils/completion', () => ({
    createCompletion: vi.fn().mockReturnValue({ setupShellInitFile: vi.fn() })
}));

// Mock inquirer (handleCompletionInstall / handleCompletionGenerate prompt)
vi.mock('inquirer', () => ({
    default: { prompt: vi.fn() }
}));

describe('Shell Completion', () => {
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
    });

    // ── generateCompletionScript ──────────────────────────────────────────────

    describe('generateCompletionScript', () => {
        it('generates a bash completion script', () => {
            const script = generateCompletionScript('bash');
            expect(script).toContain('Bash');
            expect(script).toContain('bugbook --completion-bash');
        });

        it('generates a zsh completion script', () => {
            const script = generateCompletionScript('zsh');
            expect(script).toContain('Zsh');
            expect(script).toContain('bugbook --completion-zsh');
        });

        it('generates a fish completion script', () => {
            const script = generateCompletionScript('fish');
            expect(script).toContain('Fish');
            expect(script).toContain('bugbook --completion-fish');
        });

        it('returns unsupported-shell message for unknown shells', () => {
            const script = generateCompletionScript('cmd');
            expect(script).toContain('Unsupported shell: cmd');
        });
    });

    // ── handleCompletion router ───────────────────────────────────────────────

    describe('handleCompletion', () => {
        it('prints help text when called with no subcommand', async () => {
            await handleCompletion([]);
            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('Bugbook Shell Completion');
            expect(output).toContain('install');
            expect(output).toContain('setup');
        });

        it('prints error message for unknown subcommand', async () => {
            await handleCompletion(['unknown-cmd']);
            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain("Unknown completion subcommand: 'unknown-cmd'");
        });
    });

    // ── handleCompletionUninstall ─────────────────────────────────────────────

    describe('handleCompletionUninstall', () => {
        it('shows RC file path for bash shell', async () => {
            const originalShell = process.env.SHELL;
            process.env.SHELL = '/bin/bash';

            await handleCompletionUninstall();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('.bashrc');

            process.env.SHELL = originalShell;
        });

        it('shows RC file path for zsh shell', async () => {
            const originalShell = process.env.SHELL;
            process.env.SHELL = '/usr/bin/zsh';

            await handleCompletionUninstall();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('.zshrc');

            process.env.SHELL = originalShell;
        });

        it('shows fallback message when shell cannot be detected', async () => {
            const originalShell = process.env.SHELL;
            const originalComSpec = process.env.ComSpec;
            process.env.SHELL = '';
            process.env.ComSpec = '';

            await handleCompletionUninstall();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('manually remove');

            process.env.SHELL = originalShell;
            process.env.ComSpec = originalComSpec;
        });
    });

    // ── handleCompletionSetup ─────────────────────────────────────────────────

    describe('handleCompletionSetup', () => {
        it('shows warning when shell cannot be auto-detected', async () => {
            const originalShell = process.env.SHELL;
            const originalComSpec = process.env.ComSpec;
            process.env.SHELL = '';
            process.env.ComSpec = '';

            await handleCompletionSetup();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('Could not auto-detect');

            process.env.SHELL = originalShell;
            process.env.ComSpec = originalComSpec;
        });

        it('reports success and shows activation instructions for bash', async () => {
            const originalShell = process.env.SHELL;
            process.env.SHELL = '/bin/bash';

            await handleCompletionSetup();

            const output = logSpy.mock.calls.map(c => String(c[0])).join('\n');
            expect(output).toContain('.bashrc');

            process.env.SHELL = originalShell;
        });
    });
});
