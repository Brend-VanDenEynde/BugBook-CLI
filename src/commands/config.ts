import chalk from 'chalk';
import { getUserConfig, setUserConfig } from '../utils/config';

export const config = async (args: string[]): Promise<void> => {
    if (args.length === 0) {
        // List config
        const conf = getUserConfig();
        console.log(chalk.bold('Current Configuration:'));
        console.log(JSON.stringify(conf, null, 2));
        return;
    }

    if (args.length === 2) {
        // Set config
        const key = args[0];
        const value = args[1];
        try {
            setUserConfig(key, value);
            console.log(chalk.green(`Config saved: ${key} = ${value}`));
        } catch (error: any) {
            console.error(chalk.red(error.message));
        }
        return;
    }

    console.log(chalk.yellow('Usage: bugbook config <key> <value>'));
    console.log(chalk.yellow('Example: bugbook config user.name "John Doe"'));
    console.log(chalk.yellow('Example: bugbook config editor "code --wait"'));
};
