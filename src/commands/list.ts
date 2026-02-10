import chalk from 'chalk';
import { getBugs, displayBugs, getOverdueBugs, DEFAULT_LIST_COUNT } from '../utils/storage';

export const handleList = async () => {
    const allBugs = await getBugs();
    if (allBugs.length === 0) {
        console.log(chalk.white('No bugs found.'));
    } else {
        const lastN = allBugs.slice(-DEFAULT_LIST_COUNT);
        console.log(chalk.bold.white(`\nShowing last ${lastN.length} entry(s):\n`));
        displayBugs(lastN);

        // Overdue warnings
        const overdue = getOverdueBugs(allBugs);
        if (overdue.length > 0) {
            console.log(chalk.red.bold(`\n⚠️  ${overdue.length} overdue bug(s):`));
            overdue.forEach(b => {
                console.log(chalk.red(`  - [${b.id}] Due: ${b.dueDate} — ${b.error.substring(0, 40)}${b.error.length > 40 ? '...' : ''}`));
            });
            console.log('');
        }
    }
};
