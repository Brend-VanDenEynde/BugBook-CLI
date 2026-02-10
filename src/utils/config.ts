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

export const setUserConfig = (key: string, value: string): void => {
    const config = getUserConfig();
    const parts = key.split('.');

    if (parts.length === 2 && parts[0] === 'user') {
        if (!config.user) config.user = {};
        if (parts[1] === 'name') config.user.name = value;
        if (parts[1] === 'email') config.user.email = value;
    } else if (key === 'editor') {
        config.editor = value;
    } else {
        throw new Error('Invalid config key. Supported keys: user.name, user.email, editor');
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
};

/**
 * Resolves the editor command to ensure it runs correctly on the current platform.
 * Specifically handles 'code' on Windows by wrapping it in 'cmd /c' to execute the batch file.
 */
export const resolveEditorCommand = (editor: string): string => {
    if (process.platform === 'win32' && (editor === 'code' || editor.startsWith('code '))) {
        // Wrap VS Code in cmd /c to ensure batch file execution on Windows via spawn
        // e.g. "code --wait" -> "cmd /c code --wait"
        return `cmd /c ${editor}`;
    }
    return editor;
};
