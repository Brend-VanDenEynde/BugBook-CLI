import inquirer from 'inquirer';
import chalk from 'chalk';
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

    const lowerQuery = searchQuery.toLowerCase();
    const bugs = getBugs();
    const results = bugs.filter(b =>
        b.id.toLowerCase() === lowerQuery ||
        b.error.toLowerCase().includes(lowerQuery) ||
        b.solution.toLowerCase().includes(lowerQuery) ||
        b.category.toLowerCase().includes(lowerQuery)
    );

    if (results.length > 0) {
        console.log(chalk.bold.green(`\nFound ${results.length} match(es):\n`));
        results.forEach(b => {
            console.log(chalk.gray('--------------------------------------------------'));
            const statusIcon = b.status === 'Resolved' ? '✅' : '🔴';
            console.log(`${chalk.bold('ID:')} ${chalk.cyan(b.id)}  ${statusIcon} ${b.status}`);
            console.log(`${chalk.bold('Category:')} ${chalk.yellow(b.category)}`);
            console.log(`${chalk.bold('Error:')} ${b.error}`);
            // console.log(`${chalk.bold('Solution:')} ${b.solution}`); // Optional: maybe too long? No, show it.
            console.log(`${chalk.bold('Solution:')} ${b.solution}`);
        });
        console.log(chalk.gray('--------------------------------------------------'));
    } else {
        console.log(chalk.red('No matches found.'));
    }
};
