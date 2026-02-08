import fs from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getTags, getBugCounts, TAGS_PATH } from '../utils/storage';

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

    const tag = newTag.trim();
    if (tag) {
        const currentTags = getTags();
        if (!currentTags.includes(tag)) {
            fs.appendFileSync(TAGS_PATH, `${tag}\n`);
            console.log(chalk.green(`Tag '${tag}' added.`));
        } else {
            console.log(chalk.red('Tag already exists.'));
        }
    }
};
