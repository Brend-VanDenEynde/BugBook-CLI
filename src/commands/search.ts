import inquirer from 'inquirer';
import chalk from 'chalk';
import Fuse from 'fuse.js';
import { getBugs, ensureProjectInit, displayBugs } from '../utils/storage';

export const handleSearch = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Error: Project not initialized.'));
        return;
    }

    let searchQuery = argStr;

    if (!searchQuery || searchQuery.trim() === '') {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'query',
                message: 'Search (ID or text):',
                validate: (input: string) => {
                    if (!input.trim()) {
                        return 'Please enter a search term.';
                    }
                    return true;
                }
            }
        ]);
        searchQuery = answer.query;
    }

    if (!searchQuery || searchQuery.trim() === '') {
        console.log(chalk.red('Error: Please enter a search term.'));
        return;
    }

    const bugs = await getBugs();

    const fuse = new Fuse(bugs, {
        keys: ['id', 'error', 'solution', 'category', 'priority', 'files'],
        threshold: 0.4,
        includeScore: true
    });

    const fuseResults = fuse.search(searchQuery.trim());
    const results = fuseResults.map(r => r.item);

    if (results.length > 0) {
        console.log(chalk.green(`\nFound ${results.length} match(es):\n`));
        displayBugs(results);
    } else {
        console.log(chalk.white('No matches found.'));
    }
};
