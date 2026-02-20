
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { getUserConfig, setUserConfig, setupEditor } from '../src/utils/config';

// Mock synchronous fs — config.ts uses `import fs from 'fs'` with esModuleInterop
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn()
    }
}));

describe('Config Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── getUserConfig ─────────────────────────────────────────────────────────

    describe('getUserConfig', () => {
        it('returns empty object when config file does not exist', () => {
            (fs.existsSync as any).mockReturnValue(false);
            expect(getUserConfig()).toEqual({});
        });

        it('parses and returns config when file exists with valid JSON', () => {
            const config = { user: { name: 'Alice', email: 'alice@example.com' } };
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(JSON.stringify(config));
            expect(getUserConfig()).toEqual(config);
        });

        it('returns empty object when file contains invalid JSON', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue('not-valid-json{{{');
            expect(getUserConfig()).toEqual({});
        });

        it('returns github sub-object when present', () => {
            const config = { github: { token: 'ghp_abc', owner: 'org', repo: 'proj' } };
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(JSON.stringify(config));
            expect(getUserConfig()).toMatchObject({ github: { token: 'ghp_abc' } });
        });
    });

    // ── setUserConfig ─────────────────────────────────────────────────────────

    describe('setUserConfig', () => {
        // All setUserConfig calls internally read the existing config first
        beforeEach(() => {
            // Start with an empty config file
            (fs.existsSync as any).mockReturnValue(false);
        });

        it('saves user.name to config', () => {
            setUserConfig('user.name', 'Alice');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.user?.name).toBe('Alice');
        });

        it('saves user.email to config', () => {
            setUserConfig('user.email', 'alice@example.com');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.user?.email).toBe('alice@example.com');
        });

        it('saves github.token to config', () => {
            setUserConfig('github.token', 'ghp_abc123');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.github?.token).toBe('ghp_abc123');
        });

        it('saves github.owner to config', () => {
            setUserConfig('github.owner', 'myorg');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.github?.owner).toBe('myorg');
        });

        it('saves github.repo to config', () => {
            setUserConfig('github.repo', 'myrepo');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.github?.repo).toBe('myrepo');
        });

        it('saves github.auto_labels (boolean) to config', () => {
            setUserConfig('github.auto_labels', false);
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.github?.auto_labels).toBe(false);
        });

        it('saves editor to config', () => {
            setUserConfig('editor', 'vim');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.editor).toBe('vim');
        });

        it('throws for unknown config key', () => {
            expect(() => setUserConfig('invalid.key', 'value')).toThrow('Invalid config key');
        });

        it('writes file with mode 0o600 (owner-only permissions)', () => {
            setUserConfig('editor', 'nano');
            const opts = (fs.writeFileSync as any).mock.calls[0][2];
            expect(opts?.mode).toBe(0o600);
        });

        it('preserves existing config fields when setting a new key', () => {
            // Existing config already has user.name
            const existing = { user: { name: 'Bob' } };
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(JSON.stringify(existing));

            setUserConfig('user.email', 'bob@example.com');
            const written = JSON.parse((fs.writeFileSync as any).mock.calls[0][1]);
            expect(written.user?.name).toBe('Bob');
            expect(written.user?.email).toBe('bob@example.com');
        });
    });

    // ── setupEditor ───────────────────────────────────────────────────────────

    describe('setupEditor', () => {
        afterEach(() => {
            delete process.env.VISUAL;
        });

        it('returns false when no editor is configured', () => {
            (fs.existsSync as any).mockReturnValue(false);
            expect(setupEditor()).toBe(false);
        });

        it('returns false when editor is set to "cli"', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(JSON.stringify({ editor: 'cli' }));
            expect(setupEditor()).toBe(false);
        });

        it('returns true and sets VISUAL env var when editor is configured', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(JSON.stringify({ editor: 'vim' }));
            const result = setupEditor();
            expect(result).toBe(true);
            expect(process.env.VISUAL).toBe('vim');
        });

        it('wraps VS Code in "cmd /c" on Windows when setting VISUAL', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(JSON.stringify({ editor: 'code --wait' }));

            setupEditor();
            expect(process.env.VISUAL).toBe('cmd /c code --wait');

            Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
        });
    });
});
