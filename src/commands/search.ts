import inquirer from 'inquirer';
import chalk from 'chalk';
import { parseBugs, ensureProjectInit } from '../utils/storage';

export const handleSearch = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.yellow('No bugs found.'));
        return;
    }

    let searchQuery = argStr;

    if (!searchQuery) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'query',
                message: chalk.yellow('Search (ID or text):')
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
        console.log(chalk.bold.green(`\nFound ${results.length} match(es):\n`));
        results.forEach(r => {
            console.log(chalk.gray('--------------------------------------------------'));
            // Highlight the search term?
            // For now just print.
            console.log(r.content);
        });
        console.log(chalk.gray('--------------------------------------------------'));
    } else {
        console.log(chalk.red('No matches found.'));
    }
};
