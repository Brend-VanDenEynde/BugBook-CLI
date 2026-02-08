import chalk from 'chalk';
import { parseBugs } from '../utils/storage';

export const handleList = () => {
    const allBugs = parseBugs();
    if (allBugs.length === 0) {
        console.log(chalk.yellow('No bugs found.'));
    } else {
        const last5 = allBugs.slice(-5);
        console.log(chalk.bold.blue(`\nShowing last ${last5.length} entry(s):\n`));
        last5.forEach(r => {
            console.log(chalk.gray('--------------------------------------------------'));
            // Highlight keys if possible, but keep simple for now as content is markdown-ish
            // Just printing content might be plain, maybe we can colorize keys in the content?
            // Since content is a single string, we just print it.
            // Replacing bold markdown markers with colors for display could be cool but might be complex.
            // Let's just print it for now, maybe add a color to the border.
            console.log(r.content);
        });
        console.log(chalk.gray('--------------------------------------------------'));
    }
};
