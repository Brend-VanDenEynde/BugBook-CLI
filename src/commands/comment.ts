import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, addComment, getBugById, ensureProjectInit, BUG_PREVIEW_LENGTH, MAX_INPUT_LENGTH, displayBug } from '../utils/storage';
import { getUserConfig, resolveEditorCommand } from '../utils/config';

export const handleComment = async (argStr: string) => {
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
            name: `[${b.id}] ${b.status === 'Resolved' ? '✅' : '🔴'} ${b.error.substring(0, BUG_PREVIEW_LENGTH)}${b.error.length > BUG_PREVIEW_LENGTH ? '...' : ''}`,
            value: b.id
        }));

        const answer = await inquirer.prompt([{
            type: 'list',
            name: 'selectedId',
            message: 'Select a bug to comment on:',
            choices,
            pageSize: 10
        }] as any);
        bugId = answer.selectedId;
    }

    // Validate bug exists before prompting for comment text
    const bug = await getBugById(bugId);
    if (!bug) {
        console.log(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
        return;
    }

    const config = getUserConfig();
    const useEditor = config.editor && config.editor !== 'cli';

    if (useEditor && config.editor) {
        process.env.VISUAL = resolveEditorCommand(config.editor);
    }

    const commentAnswer = await inquirer.prompt([{
        type: useEditor ? 'editor' : 'input',
        name: 'text',
        message: 'Enter your comment:',
        validate: (input: string) => {
            if (!input.trim()) return 'Comment cannot be empty.';
            if (input.length > MAX_INPUT_LENGTH) return `Comment too long. Maximum ${MAX_INPUT_LENGTH} characters.`;
            return true;
        }
    }] as any);

    const result = await addComment(bugId, commentAnswer.text);

    if (result.success) {
        console.log(chalk.green(`\n✔ ${result.message}`));
    } else {
        console.log(chalk.red(result.message));
    }
};
