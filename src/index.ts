import figlet from 'figlet';
import readline from 'readline';

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
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data);
    console.log('\nBugbook CLI Tool v0.1');
    console.log('-----------------------');
    console.log('Welcome to the Bugbook interface.\n');
    console.log('Type "help" for a list of commands.\n');

    const promptLoop = () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'bugbook> '
        });

        rl.question('bugbook> ', async (line) => {
            rl.close(); // Close RL to release stdin for inquirer or next loop
            const args = line.trim().split(' ');
            const command = args[0];
            const argStr = args.slice(1).join(' ');

            switch (command) {
                case 'quit':
                case 'exit':
                    console.log('Goodbye!');
                    process.exit(0);
                    break; // Unreachable
                case 'version':
                    handleVersion();
                    break;
                case 'help':
                    console.log('Available commands:');
                    console.log('  add      - Add a new bug entry');
                    console.log('  list     - Show the last 5 bugs');
                    console.log('  search   - Search bugs by ID or text (usage: search [query])');
                    console.log('  tags     - List all tags with usage counts');
                    console.log('  new-tag  - Create a new tag');
                    console.log('  version  - Show version information');
                    console.log('  quit     - Exit the application');
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
                    console.log(`Unknown command: '${command}'`);
                    break;
            }
            // Resume loop
            promptLoop();
        });
    };

    promptLoop();
});
