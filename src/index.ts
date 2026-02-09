#!/usr/bin/env node
import figlet from 'figlet';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import packageJson from '../package.json';
import { BUG_DIR } from './utils/storage';

import { handleInstall } from './commands/install';
import { handleAdd } from './commands/add';
import { handleList } from './commands/list';
import { handleSearch } from './commands/search';
import { handleTags, handleNewTag } from './commands/tags';
import { handleVersion } from './commands/version';
import { handleDelete } from './commands/delete';
import { handleEdit } from './commands/edit';
import { handleResolve } from './commands/resolve';
import { handleStats } from './commands/stats';

// Shared help text printer
const printHelp = (includeQuit = false) => {
    console.log(chalk.bold('Available commands:'));
    console.log(`  ${chalk.cyan('add')}      - Add a new bug entry`);
    console.log(`  ${chalk.cyan('list')}     - Show the last 5 bugs`);
    console.log(`  ${chalk.cyan('search')}   - Search bugs (fuzzy) by ID or text`);
    console.log(`  ${chalk.cyan('edit')}     - Edit an existing bug`);
    console.log(`  ${chalk.cyan('delete')}   - Delete a bug`);
    console.log(`  ${chalk.cyan('resolve')}  - Toggle Open/Resolved status`);
    console.log(`  ${chalk.cyan('stats')}    - Show bug statistics`);
    console.log(`  ${chalk.cyan('tags')}     - List all tags with usage counts`);
    console.log(`  ${chalk.cyan('new-tag')}  - Create a new tag`);
    console.log(`  ${chalk.cyan('version')}  - Show version information`);
    if (includeQuit) {
        console.log(`  ${chalk.cyan('quit')}     - Exit the application`);
    } else {
        console.log(`  ${chalk.cyan('help')}     - Show this help menu`);
    }
};

/**
 * Unified command handler to avoid code duplication
 */
const executeCommand = async (command: string, argStr: string, isInteractive: boolean): Promise<boolean> => {
    switch (command) {
        case 'quit':
        case 'exit':
            if (isInteractive) {
                console.log(chalk.magenta('Goodbye!'));
                process.exit(0);
            }
            return false;
        case 'install':
            if (!isInteractive) {
                await handleInstall();
            }
            return true;
        case 'add':
            await handleAdd();
            return true;
        case 'list':
            handleList();
            return true;
        case 'search':
            await handleSearch(argStr);
            return true;
        case 'delete':
            await handleDelete(argStr);
            return true;
        case 'edit':
            await handleEdit(argStr);
            return true;
        case 'resolve':
            await handleResolve(argStr);
            return true;
        case 'stats':
            handleStats();
            return true;
        case 'tags':
            handleTags();
            return true;
        case 'new-tag':
            await handleNewTag();
            return true;
        case 'version':
            handleVersion();
            return true;
        case 'help':
            printHelp(isInteractive);
            return true;
        case '':
            return true;
        default:
            console.log(chalk.red(`Unknown command: '${command}'`));
            if (!isInteractive) {
                console.log(`Run "${chalk.cyan('bugbook help')}" for a list of commands.`);
            }
            return false;
    }
};

// Handle CLI arguments
const args = process.argv.slice(2);
const command = args[0];
const restArgs = args.slice(1).join(' ');

async function main() {
    if (command === undefined) {
        startApp();
    } else {
        await executeCommand(command, restArgs, false);
    }
}

main();

function startApp() {
    if (!fs.existsSync(BUG_DIR)) {
        console.log(chalk.red('\nBugbook is not installed in this directory.'));
        console.log(chalk.yellow('Please run "bugbook install" first to set up.\n'));
        process.exit(1);
    }

    console.clear();

    figlet('BUGBOOK', (err, data) => {
        if (err) {
            console.log(chalk.red('Something went wrong...'));
            console.dir(err);
            return;
        }
        console.log(chalk.blue(data));
        console.log(chalk.cyan.bold(`\nBugbook CLI Tool v${packageJson.version}`));
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
                rl.close();
                const parts = line.trim().split(' ');
                const cmd = parts[0];
                const argStr = parts.slice(1).join(' ');

                await executeCommand(cmd, argStr, true);
                promptLoop();
            });
        };

        promptLoop();
    });
}
