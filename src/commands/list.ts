import chalk from 'chalk';
import { getBugs, displayBugs, DEFAULT_LIST_COUNT } from '../utils/storage';

export const handleList = async () => {
    const allBugs = await getBugs();
    if (allBugs.length === 0) {
        console.log(chalk.white('No bugs found.'));
    } else {
        const lastN = allBugs.slice(-DEFAULT_LIST_COUNT);
        console.log(chalk.bold.white(`\nShowing last ${lastN.length} entry(s):\n`));
        displayBugs(lastN);
    }
};
