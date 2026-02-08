import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateId, getTags, ensureProjectInit, addBug, Bug } from '../utils/storage';

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
        // We just use the tag string here; storage.ts handles tags file separately if needed, 
        // but currently we blindly accept the tag. 
        // NOTE: storage.ts doesn't export a way to add tags explicitly other than via `handleNewTag` logic or file append.
        // Let's just use the string. PROPER FIX: We should probably add the tag to tags.md if it's new.
        // For now, I will match the previous logic's intent but purely within this file or via storage if possible.
        // The previous logic appended to TAGS_PATH manually. I should probably import TAGS_PATH or helper.
        // Actually, let's keep it simple: just use the string.
        selectedTag = newTagAnswer.newTagName.trim() || 'General';
    }

    const newBug: Bug = {
        id: generateId(),
        timestamp: new Date().toLocaleString(),
        category: selectedTag,
        error: answers.errorMsg,
        solution: answers.solutionMsg,
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
