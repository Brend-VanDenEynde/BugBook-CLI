import figlet from 'figlet';
import readline from 'readline';
import chalk from 'chalk';

import { handleInstall } from './commands/install';
import { handleAdd } from './commands/add';
import { handleList } from './commands/list';
import { handleSearch } from './commands/search';
import { handleTags, handleNewTag } from './commands/tags';
import { handleVersion } from './commands/version';

// Handle CLI arguments
if (process.argv.includes('install')) {
    handleInstall();
}

console.clear();

figlet('BUGBOOK', (err, data) => {
    if (err) {
        console.log(chalk.red('Something went wrong...'));
        console.dir(err);
        return;
    }
    console.log(chalk.blue(data));
    console.log(chalk.cyan.bold('\nBugbook CLI Tool v0.1'));
    console.log(chalk.gray('-----------------------'));
    console.log(chalk.white('Welcome to the Bugbook interface.\n'));
    console.log(chalk.yellow('Type "help" for a list of commands.\n'));

    const promptLoop = () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.green('bugbook> ')
        });

        rl.question(chalk.green('bugbook> '), async (line) => {
            rl.close(); // Close RL to release stdin for inquirer or next loop
            const args = line.trim().split(' ');
            const command = args[0];
            const argStr = args.slice(1).join(' ');

            switch (command) {
                case 'quit':
                case 'exit':
                    console.log(chalk.magenta('Goodbye!'));
                    process.exit(0);
                    break; // Unreachable
                case 'version':
                    handleVersion();
                    break;
                case 'help':
                    console.log(chalk.bold('Available commands:'));
                    console.log(`  ${chalk.cyan('add')}      - Add a new bug entry`);
                    console.log(`  ${chalk.cyan('list')}     - Show the last 5 bugs`);
                    console.log(`  ${chalk.cyan('search')}   - Search bugs by ID or text (usage: search [query])`);
                    console.log(`  ${chalk.cyan('tags')}     - List all tags with usage counts`);
                    console.log(`  ${chalk.cyan('new-tag')}  - Create a new tag`);
                    console.log(`  ${chalk.cyan('version')}  - Show version information`);
                    console.log(`  ${chalk.cyan('quit')}     - Exit the application`);
                    break;
                case 'tags':
                    handleTags();
                    break;
                case 'new-tag':
                    await handleNewTag();
                    break;
                case 'list':
                    handleList();
                    break;
                case 'search':
                    await handleSearch(argStr);
                    break;
                case 'add':
                    await handleAdd();
                    break;
                case '':
                    break;
                default:
                    console.log(chalk.red(`Unknown command: '${command}'`));
                    break;
            }
            // Resume loop
            promptLoop();
        });
    };

    promptLoop();
});
