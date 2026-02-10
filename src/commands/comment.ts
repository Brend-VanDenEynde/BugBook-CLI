import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, addComment, getBugById, ensureProjectInit, MAX_INPUT_LENGTH, displayBug } from '../utils/storage';
import { setupEditor } from '../utils/config';
import { selectBugPrompt } from '../utils/prompts';

export const handleComment = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.error(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    let bugId = argStr.trim();
    const bugs = await getBugs();

    if (bugs.length === 0) {
        console.log(chalk.white('No bugs found.'));
        return;
    }

    if (!bugId) {
        bugId = await selectBugPrompt(bugs, 'Select a bug to comment on:');
    }

    // Validate bug exists before prompting for comment text
    const bug = await getBugById(bugId);
    if (!bug) {
        console.error(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
        return;
    }

    const useEditor = setupEditor();

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
