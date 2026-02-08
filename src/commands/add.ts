import fs from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateId, getTags, TAGS_PATH, BUG_PATH, ensureProjectInit } from '../utils/storage';

export const handleAdd = async () => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Error: Bugbook is not installed in this directory.'));
        console.log(`Run "${chalk.cyan('bugbook install')}" first.`);
        return;
    }

    console.log(chalk.bold.blue('\nAdd New Bug Entry'));

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'errorMsg',
            message: chalk.yellow('Bug error message:')
        },
        {
            type: 'input',
            name: 'solutionMsg',
            message: chalk.yellow('Bug solutions:')
        },
        {
            type: 'list',
            name: 'tag',
            message: chalk.yellow('Select a category/tag:'),
            choices: [...getTags(), new inquirer.Separator(), 'Create new tag'],
            pageSize: 10
        }
    ]);

    let selectedTag = answers.tag;

    if (selectedTag === 'Create new tag') {
        const newTagAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'newTagName',
                message: chalk.yellow('Enter new tag name:')
            }
        ]);
        selectedTag = newTagAnswer.newTagName.trim() || 'General';

        // Save new tag if unique
        if (!getTags().includes(selectedTag)) {
            fs.appendFileSync(TAGS_PATH, `${selectedTag}\n`);
            console.log(chalk.green(`New tag '${selectedTag}' created.`));
        }
    }

    const id = generateId();
    const timestamp = new Date().toLocaleString();
    const entry = `\n## [${timestamp}]\n**ID:** ${id}\n**Category:** ${selectedTag}\n**Error:** ${answers.errorMsg}\n**Solution:** ${answers.solutionMsg}\n---\n`;

    try {
        fs.appendFileSync(BUG_PATH, entry);
        console.log(chalk.green(`\n✔ Bug added successfully!`));
        console.log(`ID: ${chalk.cyan(id)}`);
    } catch (e) {
        console.log(chalk.red('Error saving bug entry:'), e);
    }
};
