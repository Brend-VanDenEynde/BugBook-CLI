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
    } else {
        throw new Error('Invalid config key. Supported keys: user.name, user.email');
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
};
