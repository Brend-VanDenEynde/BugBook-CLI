import chalk from 'chalk';
import { getBugs, ensureProjectInit } from '../utils/storage';

export const handleStats = () => {
    if (!ensureProjectInit()) {
        console.log(chalk.yellow('No bugs found (project not initialized).'));
        return;
    }

    const bugs = getBugs();
    const totalBugs = bugs.length;

    if (totalBugs === 0) {
        console.log(chalk.yellow('No bugs recorded yet.'));
        return;
    }

    const openBugs = bugs.filter(b => b.status === 'Open').length;
    const resolvedBugs = bugs.filter(b => b.status === 'Resolved').length;

    const categoryCounts: Record<string, number> = {};
    bugs.forEach(b => {
        const cat = b.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a);

    console.log(chalk.bold.blue('\nBugbook Statistics\n'));
    console.log(chalk.gray('--------------------------------------------------'));

    console.log(`${chalk.bold('Total Bugs:')}     ${chalk.white(totalBugs)}`);
    console.log(`${chalk.bold('Open:')}           ${chalk.red(openBugs)}`);
    console.log(`${chalk.bold('Resolved:')}       ${chalk.green(resolvedBugs)}`);

    console.log(chalk.gray('--------------------------------------------------'));
    console.log(chalk.bold.cyan('Top Categories:'));

    if (sortedCategories.length === 0) {
        console.log(chalk.gray('  No categories found.'));
    } else {
        sortedCategories.forEach(([category, count]) => {
            console.log(`  ${chalk.white(category)}: ${chalk.yellow(count)}`);
        });
    }
    console.log(chalk.gray('--------------------------------------------------\n'));
};
