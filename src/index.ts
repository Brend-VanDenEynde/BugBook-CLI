#!/usr/bin/env node
import figlet from 'figlet';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const BUG_DIR = '.bugbook';
const BUG_FILE = 'bugs.md';
const BUG_PATH = path.join(process.cwd(), BUG_DIR, BUG_FILE);

// Handle CLI arguments
if (process.argv.includes('install')) {
    if (!fs.existsSync(BUG_DIR)) {
        fs.mkdirSync(BUG_DIR);
        console.log(`Created directory: ${BUG_DIR}`);
    }
    if (!fs.existsSync(BUG_PATH)) {
        fs.writeFileSync(BUG_PATH, '# Bugbook Storage\n\n');
        console.log(`Created file: ${BUG_PATH}`);
    } else {
        console.log('Bugbook is already installed in this directory.');
    }
    process.exit(0);
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

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'bugbook> '
    });

    rl.prompt();

    rl.on('line', (line) => {
        const command = line.trim();

        switch (command) {
            case 'quit':
                console.log('Goodbye!');
                process.exit(0);
                break;
            case 'version':
                console.log('v0.1');
                break;
            case 'help':
                console.log('Available commands:');
                console.log('  add      - Add a new bug entry');
                console.log('  version  - Show version information');
                console.log('  quit     - Exit the application');
                break;
            case 'add':
                if (!fs.existsSync(BUG_PATH)) {
                    console.log('Error: Bugbook is not installed in this directory.');
                    console.log('Run "bugbook install" first.');
                    break;
                }

                rl.question('Bug error message: ', (errorMsg) => {
                    rl.question('Bug solutions: ', (solutionMsg) => {
                        const entry = `\n## [${new Date().toLocaleString()}]\n**Error:** ${errorMsg}\n**Solution:** ${solutionMsg}\n---\n`;

                        try {
                            fs.appendFileSync(BUG_PATH, entry);
                            console.log('Bug added successfully!');
                        } catch (e) {
                            console.log('Error saving bug entry:', e);
                        }

                        rl.prompt();
                    });
                });
                return; // Return to avoid double prompt from the main loop
            case '':
                break;
            default:
                console.log(`Unknown command: '${command}'`);
                break;
        }
        rl.prompt();
    }).on('close', () => {
        console.log('Goodbye!');
        process.exit(0);
    });
});
