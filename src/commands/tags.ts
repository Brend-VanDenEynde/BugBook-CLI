import inquirer from 'inquirer';
import chalk from 'chalk';
import { getTags, getBugCounts, addTag, sanitizeTagName } from '../utils/storage';

export const handleTags = () => {
    const validTags = getTags();
    const counts = getBugCounts();
    console.log(chalk.bold.blue('\nAvailable Tags:'));
    validTags.forEach(tag => {
        const count = counts[tag] || 0;
        console.log(`- ${chalk.cyan(tag)} (${chalk.yellow(count)})`);
    });
    console.log('');
};

export const handleNewTag = async () => {
    const { newTag } = await inquirer.prompt([
        {
            type: 'input',
            name: 'newTag',
            message: chalk.yellow('Enter new tag name:')
        }
    ]);

    const sanitized = sanitizeTagName(newTag);
    if (!sanitized) {
        console.log(chalk.red('Invalid tag name. Use only letters, numbers, spaces, and hyphens.'));
        return;
    }

    const result = addTag(sanitized);
    if (result.success) {
        console.log(chalk.green(result.message));
    } else {
        console.log(chalk.red(result.message));
    }
};
