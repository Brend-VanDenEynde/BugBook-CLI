import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, saveBug, getTags, ensureProjectInit, sanitizeInput, addTag, sanitizeTagName, validateFilePaths, BUG_PREVIEW_LENGTH, MAX_INPUT_LENGTH } from '../utils/storage';
import { getUserConfig, resolveEditorCommand } from '../utils/config';

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

        const answer = await inquirer.prompt([{
            type: 'list',
            name: 'selectedId',
            message: 'Select a bug to edit:',
            choices,
            pageSize: 10
        }] as any);
        bugId = answer.selectedId;
    }

    const bug = bugs.find(b => b.id.toLowerCase() === bugId.toLowerCase());

    if (!bug) {
        console.log(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
        return;
    }

    const config = getUserConfig();
    const useEditor = config.editor && config.editor !== 'cli';

    if (config.editor) {
        process.env.VISUAL = resolveEditorCommand(config.editor);
    }

    // Field selection
    const fieldAnswer = await inquirer.prompt([{
        type: 'list',
        name: 'field',
        message: 'Which field do you want to edit?',
        choices: [
            { name: 'Error Message', value: 'Error Message' },
            { name: 'Solution', value: 'Solution' },
            { name: 'Category', value: 'Category' },
            { name: 'Priority', value: 'Priority' },
            { name: 'Files', value: 'Files' },
            { name: 'Cancel', value: 'Cancel' }
        ]
    }] as any);

    if (fieldAnswer.field === 'Cancel') {
        console.log(chalk.white('Edit cancelled.'));
        return;
    }

    if (fieldAnswer.field === 'Category') {
        const tags = await getTags();
        const tagAnswer = await inquirer.prompt([{
            type: 'list',
            name: 'tag',
            message: 'Select new category:',
            choices: [
                ...tags.map(t => ({ name: t, value: t })),
                { name: '── Create new tag ──', value: '__new_tag__' }
            ]
        }] as any);

        let newTag = tagAnswer.tag;
        if (newTag === '__new_tag__') {
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

    } else if (fieldAnswer.field === 'Error Message') {
        const errAnswer = await inquirer.prompt([{
            type: useEditor ? 'editor' : 'input',
            name: 'val',
            message: 'New error message:',
            default: bug.error,
            validate: (input: string) => {
                if (!input.trim()) return 'Error message cannot be empty.';
                if (input.length > MAX_INPUT_LENGTH) return `Input too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
                return true;
            }
        }] as any);
        bug.error = sanitizeInput(errAnswer.val);

    } else if (fieldAnswer.field === 'Solution') {
        const solAnswer = await inquirer.prompt([{
            type: useEditor ? 'editor' : 'input',
            name: 'val',
            message: 'New solution:',
            default: bug.solution,
            validate: (input: string) => {
                if (input.length > MAX_INPUT_LENGTH) return `Input too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
                return true;
            }
        }] as any);
        bug.solution = sanitizeInput(solAnswer.val);

    } else if (fieldAnswer.field === 'Priority') {
        const priorityAnswer = await inquirer.prompt([{
            type: 'list',
            name: 'val',
            message: 'New priority:',
            choices: [
                { name: 'Low', value: 'Low' },
                { name: 'Medium', value: 'Medium' },
                { name: 'High', value: 'High' }
            ],
            default: bug.priority || 'Medium'
        }] as any);
        bug.priority = priorityAnswer.val;

    } else if (fieldAnswer.field === 'Files') {
        const filesAnswer = await inquirer.prompt([{
            type: 'input',
            name: 'val',
            message: 'Related files (comma separated):',
            default: bug.files ? bug.files.join(', ') : ''
        }]);
        const inputFiles = filesAnswer.val.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
        bug.files = validateFilePaths(inputFiles);
    }

    await saveBug(bug);
    console.log(chalk.green(`Bug [${bug.id}] updated successfully.`));
};
