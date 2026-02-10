import inquirer from 'inquirer';
import chalk from 'chalk';
import { getTags, getBugCounts, addTag, sanitizeTagName } from '../utils/storage';

export const handleTags = async () => {
    const validTags = await getTags();
    const counts = await getBugCounts();
    console.log(chalk.bold.white('\nAvailable Tags:'));
    validTags.forEach(tag => {
        const count = counts[tag] || 0;
        console.log(`  - ${tag} (${count})`);
    });
    console.log('');
};

export const handleNewTag = async () => {
    const { newTag } = await inquirer.prompt([
        {
            type: 'input',
            name: 'newTag',
            message: 'Enter new tag name:'
        }
    ]);

    const sanitized = sanitizeTagName(newTag);
    if (!sanitized) {
        console.log(chalk.red('Error: Invalid tag name. Use only letters, numbers, spaces, and hyphens.'));
        return;
    }

    const result = await addTag(sanitized);
    if (result.success) {
        console.log(chalk.green(result.message));
    } else {
        console.log(chalk.red(`Error: ${result.message}`));
    }
};
