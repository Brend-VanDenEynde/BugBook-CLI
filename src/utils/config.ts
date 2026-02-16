import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILE = '.bugbookrc';
const HOME_DIR = os.homedir();
const CONFIG_PATH = path.join(HOME_DIR, CONFIG_FILE);

export interface UserConfig {
    user?: {
        name?: string;
        email?: string;
    };
    editor?: string;
    github?: {
        token?: string;
        owner?: string;
        repo?: string;
        auto_labels?: boolean;
        label_prefix?: string;
    };
}

export const getUserConfig = (): UserConfig => {
    if (!fs.existsSync(CONFIG_PATH)) {
        return {};
    }
    try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return {};
    }
};

export const setUserConfig = (key: string, value: string | boolean): void => {
    const config = getUserConfig();
    const parts = key.split('.');

    if (parts.length === 2 && parts[0] === 'user') {
        if (!config.user) config.user = {};
        if (parts[1] === 'name') config.user.name = value as string;
        if (parts[1] === 'email') config.user.email = value as string;
    } else if (parts.length === 2 && parts[0] === 'github') {
        if (!config.github) config.github = {};
        if (parts[1] === 'token') config.github.token = value as string;
        if (parts[1] === 'owner') config.github.owner = value as string;
        if (parts[1] === 'repo') config.github.repo = value as string;
        if (parts[1] === 'auto_labels') config.github.auto_labels = value as boolean;
        if (parts[1] === 'label_prefix') config.github.label_prefix = value as string;
    } else if (key === 'editor') {
        config.editor = value as string;
    } else {
        throw new Error('Invalid config key. Supported keys: user.name, user.email, editor, github.*');
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
};

/**
 * Resolves the editor command to ensure it runs correctly on the current platform.
 * Specifically handles 'code' on Windows by wrapping it in 'cmd /c' to execute the batch file.
 */
export const resolveEditorCommand = (editor: string): string => {
    const unsafeChars = /[;&|`$(){}]/g;
    if (unsafeChars.test(editor)) {
        console.warn('Warning: Unsafe characters detected in editor command and will be stripped.');
        editor = editor.replace(unsafeChars, '');
    }

    if (process.platform === 'win32' && (editor === 'code' || editor.startsWith('code '))) {
        // Wrap VS Code in cmd /c to ensure batch file execution on Windows via spawn
        // e.g. "code --wait" -> "cmd /c code --wait"
        return `cmd /c ${editor}`;
    }
    return editor;
};

/**
 * Sets up the editor environment for inquirer's 'editor' prompt type.
 * Encapsulates the repeated pattern of checking config and setting VISUAL env var.
 * @returns true if an external editor is configured, false for CLI input mode.
 */
export const setupEditor = (): boolean => {
    const config = getUserConfig();
    const useEditor = !!(config.editor && config.editor !== 'cli');
    if (useEditor && config.editor) {
        process.env.VISUAL = resolveEditorCommand(config.editor);
    }
    return useEditor;
};
