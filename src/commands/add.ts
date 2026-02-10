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

    const tags = await getTags();
    const answers = await inquirer.prompt([
        {
            type: 'editor',
            name: 'errorMsg',
            message: 'Bug error message:',
            validate: (input: string) => {
                if (!input.trim()) {
                    return 'Error message cannot be empty.';
                }
                return true;
            }
        },
        {
            type: 'editor',
            name: 'solutionMsg',
            message: 'Bug solution:',
        },
        {
            type: 'list',
            name: 'priority',
            message: 'Priority:',
            choices: ['Low', 'Medium', 'High'],
            default: 'Medium'
        },
        {
            type: 'input',
            name: 'files',
            message: 'Related files (comma separated, optional):'
        },
        {
            type: 'list',
            name: 'tag',
            message: 'Select a category/tag:',
            choices: [...tags, new inquirer.Separator(), 'Create new tag'],
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
            const result = await addTag(sanitized);
            if (result.success) {
                console.log(chalk.green(result.message));
            }
            selectedTag = sanitized;
        } else {
            selectedTag = 'General';
            console.log(chalk.white('Invalid tag name, using "General".'));
        }
    }

    const files = answers.files ? answers.files.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0) : [];

    const newBug: Bug = {
        id: generateId(),
        timestamp: new Date().toLocaleString(),
        category: selectedTag,
        error: sanitizeInput(answers.errorMsg),
        solution: sanitizeInput(answers.solutionMsg),
        status: 'Open',
        priority: answers.priority,
        files: files
    };

    try {
        await addBug(newBug);
        console.log(chalk.green(`\n✔ Bug added successfully!`));
        console.log(chalk.white(`ID: ${newBug.id}`));
    } catch (e) {
        console.log(chalk.red('Error saving bug entry:'), e);
    }
};
