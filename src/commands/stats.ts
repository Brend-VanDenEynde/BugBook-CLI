import chalk from 'chalk';
import { getBugs, getOverdueBugs, ensureProjectInit } from '../utils/storage';

export const handleStats = async () => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Error: Project not initialized.'));
        return;
    }

    const bugs = await getBugs();
    const totalBugs = bugs.length;

    if (totalBugs === 0) {
        console.log(chalk.white('No bugs recorded yet.'));
        return;
    }

    const openBugs = bugs.filter(b => b.status === 'Open').length;
    const resolvedBugs = bugs.filter(b => b.status === 'Resolved').length;
    const overdueBugs = getOverdueBugs(bugs).length;

    const categoryCounts: Record<string, number> = {};
    bugs.forEach(b => {
        const cat = b.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a);

    console.log(chalk.bold.white('\nBugbook Statistics\n'));
    console.log(chalk.white('--------------------------------------------------'));

    console.log(`${chalk.bold.white('Total Bugs:')}     ${totalBugs}`);
    console.log(`${chalk.bold.white('Open:')}           ${openBugs}`);
    console.log(`${chalk.bold.white('Resolved:')}       ${resolvedBugs}`);
    if (overdueBugs > 0) {
        console.log(`${chalk.bold.red('Overdue:')}        ${overdueBugs}`);
    }

    console.log(chalk.white('--------------------------------------------------'));
    console.log(chalk.bold.white('Top Categories:'));

    if (sortedCategories.length === 0) {
        console.log(chalk.white('  No categories found.'));
    } else {
        sortedCategories.forEach(([category, count]) => {
            console.log(`  ${category}: ${count}`);
        });
    }
    console.log(chalk.white('--------------------------------------------------\n'));
};
