import inquirer from 'inquirer';
import { Bug, BUG_PREVIEW_LENGTH } from './storage';

/**
 * Shared interactive bug picker prompt.
 * Used by delete, edit, resolve, and comment commands.
 */
export const selectBugPrompt = async (bugs: Bug[], message: string): Promise<string> => {
    const choices = bugs.map(b => ({
        name: `[${b.id}] ${b.status === 'Resolved' ? '✅' : '🔴'} ${b.error.substring(0, BUG_PREVIEW_LENGTH)}${b.error.length > BUG_PREVIEW_LENGTH ? '...' : ''}`,
        value: b.id
    }));

    const answer = await inquirer.prompt([{
        type: 'list',
        name: 'selectedId',
        message,
        choices,
        pageSize: 10
    }] as any);

    return answer.selectedId;
};
