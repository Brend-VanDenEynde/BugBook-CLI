import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateId, getTags, ensureProjectInit, addBug, Bug, sanitizeInput, addTag, sanitizeTagName, MAX_INPUT_LENGTH } from '../utils/storage';

export const handleAdd = async () => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Error: Bugbook is not installed in this directory.'));
        console.log(chalk.white('Run "bugbook install" first.'));
        return;
    }

    console.log(chalk.bold.white('\nAdd New Bug Entry'));

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'errorMsg',
            message: 'Bug error message:',
            validate: (input: string) => {
                if (!input.trim()) {
                    return 'Error message cannot be empty.';
                }
                if (input.length > MAX_INPUT_LENGTH) {
                    return `Input too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'solutionMsg',
            message: 'Bug solution:',
            validate: (input: string) => {
                if (input.length > MAX_INPUT_LENGTH) {
                    return `Input too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
                }
                return true;
            }
        },
        {
            type: 'list',
            name: 'tag',
            message: 'Select a category/tag:',
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
                message: 'Enter new tag name:'
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
            console.log(chalk.white('Invalid tag name, using "General".'));
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
        console.log(chalk.white(`ID: ${newBug.id}`));
    } catch (e) {
        console.log(chalk.red('Error saving bug entry:'), e);
    }
};
