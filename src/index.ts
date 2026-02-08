import figlet from 'figlet';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const BUG_DIR = '.bugbook';
const BUG_FILE = 'bugs.md';
const TAGS_FILE = 'tags.md';
const BUG_PATH = path.join(process.cwd(), BUG_DIR, BUG_FILE);
const TAGS_PATH = path.join(process.cwd(), BUG_DIR, TAGS_FILE);

const getTags = (): string[] => {
    if (fs.existsSync(TAGS_PATH)) {
        const fileContent = fs.readFileSync(TAGS_PATH, 'utf-8');
        return fileContent.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    }
    return ['General'];
};

const getBugCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    if (fs.existsSync(BUG_PATH)) {
        const fileContent = fs.readFileSync(BUG_PATH, 'utf-8');
        const regex = /\*\*Category:\*\* (.*)/g;
        let match;
        while ((match = regex.exec(fileContent)) !== null) {
            const tag = match[1].trim();
            counts[tag] = (counts[tag] || 0) + 1;
        }
    }
    return counts;
};

// Helper to generate short ID
const generateId = (): string => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
};

const parseBugs = (): { id: string; content: string }[] => {
    if (!fs.existsSync(BUG_PATH)) return [];
    const content = fs.readFileSync(BUG_PATH, 'utf-8');
    const entries = content.split('---').map(e => e.trim()).filter(e => e.length > 0);

    return entries.map(entry => {
        const idMatch = entry.match(/\*\*ID:\*\* (.*)/);
        return {
            id: idMatch ? idMatch[1].trim() : '',
            content: entry
        };
    });
};

// Handle CLI arguments
if (process.argv.includes('install')) {
    if (!fs.existsSync(BUG_DIR)) {
        fs.mkdirSync(BUG_DIR);
        console.log(`Created directory: ${BUG_DIR}`);
    }
    if (!fs.existsSync(BUG_PATH)) {
        fs.writeFileSync(BUG_PATH, '# Bugbook Storage\n\n');
        console.log(`Created file: ${BUG_PATH}`);
    }
    if (!fs.existsSync(TAGS_PATH)) {
        fs.writeFileSync(TAGS_PATH, 'General\nFrontend\nBackend\n');
        console.log(`Created file: ${TAGS_PATH}`);
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
                    console.log('Goodbye!');
                    process.exit(0);
                    break;
                case 'version':
                    console.log('v0.1');
                    promptLoop();
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
                    promptLoop();
                    break;
                case 'tags':
                    const validTags = getTags();
                    const counts = getBugCounts();
                    console.log('\nAvailable Tags:');
                    validTags.forEach(tag => {
                        const count = counts[tag] || 0;
                        console.log(`- ${tag} (${count})`);
                    });
                    console.log('');
                    promptLoop();
                    break;
                case 'list':
                    const allBugs = parseBugs();
                    if (allBugs.length === 0) {
                        console.log('No bugs found.');
                    } else {
                        const last5 = allBugs.slice(-5);
                        console.log(`\nShowing last ${last5.length} entry(s):\n`);
                        last5.forEach(r => {
                            console.log(r.content);
                            console.log('---');
                        });
                    }
                    promptLoop();
                    break;
                case 'search':
                    if (!fs.existsSync(BUG_PATH)) {
                        console.log('No bugs found.');
                        promptLoop();
                        break;
                    }

                    let searchQuery = argStr;

                    if (!searchQuery) {
                        const answer = await inquirer.prompt([
                            {
                                type: 'input',
                                name: 'query',
                                message: 'Search (ID or text):'
                            }
                        ]);
                        searchQuery = answer.query;
                    }

                    const lowerQuery = searchQuery.toLowerCase();
                    const bugs = parseBugs();
                    const results = bugs.filter(b =>
                        b.id.toLowerCase() === lowerQuery ||
                        b.content.toLowerCase().includes(lowerQuery)
                    );

                    if (results.length > 0) {
                        console.log(`\nFound ${results.length} match(es):\n`);
                        results.forEach(r => {
                            console.log(r.content);
                            console.log('---');
                        });
                    } else {
                        console.log('No matches found.');
                    }
                    promptLoop();
                    break;
                case 'new-tag':
                    const { newTag } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'newTag',
                            message: 'Enter new tag name:'
                        }
                    ]);

                    const tag = newTag.trim();
                    if (tag) {
                        const currentTags = getTags();
                        if (!currentTags.includes(tag)) {
                            fs.appendFileSync(TAGS_PATH, `${tag}\n`);
                            console.log(`Tag '${tag}' added.`);
                        } else {
                            console.log('Tag already exists.');
                        }
                    }
                    promptLoop();
                    break;
                case 'add':
                    if (!fs.existsSync(BUG_PATH)) {
                        console.log('Error: Bugbook is not installed in this directory.');
                        console.log('Run "bugbook install" first.');
                        promptLoop();
                        break;
                    }

                    const answers = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'errorMsg',
                            message: 'Bug error message:'
                        },
                        {
                            type: 'input',
                            name: 'solutionMsg',
                            message: 'Bug solutions:'
                        },
                        {
                            type: 'list',
                            name: 'tag',
                            message: 'Select a category/tag:',
                            choices: [...getTags(), new inquirer.Separator(), 'Create new tag'],
                            pageSize: 10
                        }
                    ]);

                    let selectedTag = answers.tag;

                    if (selectedTag === 'Create new tag') {
                        const newTagAnswer = await inquirer.prompt([
                            {
                                type: 'input',
                                name: 'newTagName',
                                message: 'Enter new tag name:'
                            }
                        ]);
                        selectedTag = newTagAnswer.newTagName.trim() || 'General';

                        // Save new tag if unique
                        if (!getTags().includes(selectedTag)) {
                            fs.appendFileSync(TAGS_PATH, `${selectedTag}\n`);
                        }
                    }

                    const id = generateId();
                    const entry = `\n## [${new Date().toLocaleString()}]\n**ID:** ${id}\n**Category:** ${selectedTag}\n**Error:** ${answers.errorMsg}\n**Solution:** ${answers.solutionMsg}\n---\n`;

                    try {
                        fs.appendFileSync(BUG_PATH, entry);
                        console.log(`Bug added successfully! ID: ${id}`);
                    } catch (e) {
                        console.log('Error saving bug entry:', e);
                    }

                    promptLoop();
                    break;
                case '':
                    promptLoop();
                    break;
                default:
                    console.log(`Unknown command: '${command}'`);
                    promptLoop();
                    break;
            }
        });
    };

    promptLoop();
});
