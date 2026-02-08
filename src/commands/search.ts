import inquirer from 'inquirer';
import chalk from 'chalk';
import Fuse from 'fuse.js';
import { getBugs, ensureProjectInit } from '../utils/storage';

export const handleSearch = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.yellow('No bugs found (project not initialized).'));
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

    const bugs = getBugs();

    const fuse = new Fuse(bugs, {
        keys: ['id', 'error', 'solution', 'category'],
        threshold: 0.4, // Adjust for fuzziness (0.0 = exact, 1.0 = match anything)
        includeScore: true
    });

    const fuseResults = fuse.search(searchQuery);
    const results = fuseResults.map(r => r.item);

    // Fallback for empty query or exact match if needed (though fuse handles empty query poorly, usually returns empty)
    // If query is empty string, Fuse returns empty array.
    // But inquirer ensures we get a string. If user just hits enter on prompt:
    if (searchQuery.trim() === '') {
        console.log(chalk.yellow('Please enter a search term.'));
        return;
    }

    if (results.length > 0) {
        console.log(chalk.bold.green(`\nFound ${results.length} match(es):\n`));
        results.forEach(b => {
            console.log(chalk.gray('--------------------------------------------------'));
            const statusIcon = b.status === 'Resolved' ? '✅' : '🔴';
            console.log(`${chalk.bold('ID:')} ${chalk.cyan(b.id)}  ${statusIcon} ${b.status}`);
            console.log(`${chalk.bold('Category:')} ${chalk.yellow(b.category)}`);
            console.log(`${chalk.bold('Error:')} ${b.error}`);
            console.log(`${chalk.bold('Solution:')} ${b.solution}`);
        });
        console.log(chalk.gray('--------------------------------------------------'));
    } else {
        console.log(chalk.red('No matches found.'));
    }
};
