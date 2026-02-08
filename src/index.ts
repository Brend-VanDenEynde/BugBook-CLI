#!/usr/bin/env node
import figlet from 'figlet';
import readline from 'readline';

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
                console.log('  version  - Show version information');
                console.log('  quit     - Exit the application');
                break;
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
