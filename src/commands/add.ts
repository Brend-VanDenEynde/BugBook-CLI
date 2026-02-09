import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateId, getTags, ensureProjectInit, addBug, Bug, sanitizeInput, addTag, sanitizeTagName } from '../utils/storage';

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

        const sanitized = sanitizeTagName(newTagAnswer.newTagName);
        if (sanitized) {
            const result = addTag(sanitized);
            if (result.success) {
                console.log(chalk.green(result.message));
            }
            selectedTag = sanitized;
        } else {
            selectedTag = 'General';
            console.log(chalk.yellow('Invalid tag name, using "General".'));
        }
    }

    const newBug: Bug = {
        id: generateId(),
        timestamp: new Date().toLocaleString(),
        category: selectedTag,
        error: sanitizeInput(answers.errorMsg),
        solution: sanitizeInput(answers.solutionMsg),
        status: 'Open'
    };

    try {
        addBug(newBug);
        console.log(chalk.green(`\n✔ Bug added successfully!`));
        console.log(`ID: ${chalk.cyan(newBug.id)}`);
    } catch (e) {
        console.log(chalk.red('Error saving bug entry:'), e);
    }
};
