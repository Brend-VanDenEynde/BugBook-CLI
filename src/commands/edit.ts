import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, saveBug, getTags, ensureProjectInit, sanitizeInput, addTag, sanitizeTagName, validateFilePaths, BUG_PREVIEW_LENGTH, MAX_INPUT_LENGTH } from '../utils/storage';

export const handleEdit = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    let bugId = argStr.trim();
    const bugs = await getBugs();

    if (bugs.length === 0) {
        console.log(chalk.white('No bugs found.'));
        return;
    }

    if (!bugId) {
        const choices = bugs.map(b => ({
            name: `[${b.id}] ${b.error.substring(0, BUG_PREVIEW_LENGTH)}${b.error.length > BUG_PREVIEW_LENGTH ? '...' : ''}`,
            value: b.id
        }));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedId',
                message: 'Select a bug to edit:',
                choices,
                pageSize: 10
            }
        ]);
        bugId = answer.selectedId;
    }

    const bug = bugs.find(b => b.id.toLowerCase() === bugId.toLowerCase());

    if (!bug) {
        console.log(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
        return;
    }

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'field',
            message: 'Which field do you want to edit?',
            choices: ['Error Message', 'Solution', 'Category', 'Priority', 'Files', 'Cancel']
        }
    ]);

    if (answers.field === 'Cancel') {
        console.log(chalk.white('Edit cancelled.'));
        return;
    }

    if (answers.field === 'Category') {
        const tags = await getTags();
        const tagAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'tag',
                message: 'Select new category:',
                choices: [...tags, new inquirer.Separator(), 'Create new tag']
            }
        ]);

        let newTag = tagAnswer.tag;
        if (newTag === 'Create new tag') {
            const customTag = await inquirer.prompt([{
                type: 'input',
                name: 'val',
                message: 'Enter new tag name:'
            }]);

            const sanitized = sanitizeTagName(customTag.val);
            if (sanitized) {
                const result = await addTag(sanitized);
                if (result.success) {
                    console.log(chalk.green(result.message));
                }
                newTag = sanitized;
            } else {
                newTag = 'General';
                console.log(chalk.white('Invalid tag name, using "General".'));
            }
        }
        bug.category = newTag;

    } else if (answers.field === 'Error Message') {
        const errAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'val',
                message: 'New error message:',
                default: bug.error,
                validate: (input: string) => {
                    if (!input.trim()) {
                        return 'Error message cannot be empty.';
                    }
                    if (input.length > MAX_INPUT_LENGTH) {
                        return `Input too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
                    }
                    return true;
                }
            }
        ]);
        bug.error = sanitizeInput(errAnswer.val);

    } else if (answers.field === 'Solution') {
        const solAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'val',
                message: 'New solution:',
                default: bug.solution,
                validate: (input: string) => {
                    if (input.length > MAX_INPUT_LENGTH) {
                        return `Input too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
                    }
                    return true;
                }
            }
        ]);
        bug.solution = sanitizeInput(solAnswer.val);

    } else if (answers.field === 'Priority') {
        const priorityAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'val',
                message: 'New priority:',
                choices: ['Low', 'Medium', 'High'],
                default: bug.priority || 'Medium'
            }
        ]);
        bug.priority = priorityAnswer.val;

    } else if (answers.field === 'Files') {
        const filesAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'val',
                message: 'Related files (comma separated):',
                default: bug.files ? bug.files.join(', ') : ''
            }
        ]);
        const inputFiles = filesAnswer.val.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
        bug.files = validateFilePaths(inputFiles);
    }

    await saveBug(bug);
    console.log(chalk.green(`Bug [${bug.id}] updated successfully.`));
};
