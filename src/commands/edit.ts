import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, saveBugs, getTags, ensureProjectInit } from '../utils/storage';

export const handleEdit = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Bugbook is not initialized.'));
        return;
    }

    let bugId = argStr.trim();
    const bugs = getBugs();

    if (bugs.length === 0) {
        console.log(chalk.yellow('No bugs found.'));
        return;
    }

    if (!bugId) {
        const choices = bugs.map(b => ({
            name: `[${b.id}] ${b.error.substring(0, 50)}...`,
            value: b.id
        }));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedId',
                message: chalk.yellow('Select a bug to edit:'),
                choices,
                pageSize: 10
            }
        ]);
        bugId = answer.selectedId;
    }

    const bug = bugs.find(b => b.id.toLowerCase() === bugId.toLowerCase());

    if (!bug) {
        console.log(chalk.red(`Bug with ID '${bugId}' not found.`));
        return;
    }

    // Interactive edit prompt
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'field',
            message: chalk.yellow('Which field do you want to edit?'),
            choices: ['Error Message', 'Solution', 'Category', 'Cancel']
        }
    ]);

    if (answers.field === 'Cancel') {
        console.log(chalk.yellow('Edit cancelled.'));
        return;
    }

    if (answers.field === 'Category') {
        const tagAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'tag',
                message: chalk.yellow('Select new category:'),
                choices: [...getTags(), new inquirer.Separator(), 'Create new tag']
            }
        ]);

        let newTag = tagAnswer.tag;
        if (newTag === 'Create new tag') {
            const customTag = await inquirer.prompt([{
                type: 'input',
                name: 'val',
                message: 'Enter new tag name:'
            }]);
            newTag = customTag.val.trim() || 'General';
        }
        bug.category = newTag;

    } else if (answers.field === 'Error Message') {
        const errAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'val',
                message: chalk.yellow('New error message:'),
                default: bug.error
            }
        ]);
        bug.error = errAnswer.val;

    } else if (answers.field === 'Solution') {
        const solAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'val',
                message: chalk.yellow('New solution:'),
                default: bug.solution
            }
        ]);
        bug.solution = solAnswer.val;
    }

    saveBugs(bugs);
    console.log(chalk.green(`Bug [${bug.id}] updated successfully.`));
};
