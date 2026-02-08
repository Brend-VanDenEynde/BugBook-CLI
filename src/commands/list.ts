import chalk from 'chalk';
import { getBugs } from '../utils/storage';

export const handleList = () => {
    const allBugs = getBugs();
    if (allBugs.length === 0) {
        console.log(chalk.yellow('No bugs found.'));
    } else {
        const last5 = allBugs.slice(-5);
        console.log(chalk.bold.blue(`\nShowing last ${last5.length} entry(s):\n`));
        last5.forEach(b => {
            console.log(chalk.gray('--------------------------------------------------'));
            const statusIcon = b.status === 'Resolved' ? '✅' : '🔴';
            console.log(`${chalk.bold('ID:')} ${chalk.cyan(b.id)}  ${statusIcon} ${b.status}`);
            console.log(`${chalk.bold('Category:')} ${chalk.yellow(b.category)}`);
            console.log(`${chalk.bold('Error:')} ${b.error}`);
            console.log(`${chalk.bold('Solution:')} ${b.solution}`);
        });
        console.log(chalk.gray('--------------------------------------------------'));
    }
};
