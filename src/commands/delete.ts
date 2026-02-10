import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, saveBugs, ensureProjectInit, BUG_PREVIEW_LENGTH } from '../utils/storage';

export const handleDelete = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    let bugId = argStr.trim();
    const bugs = await getBugs();

    if (bugs.length === 0) {
        console.log(chalk.white('No bugs to delete.'));
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
                message: 'Select a bug to delete:',
                choices,
                pageSize: 10
            }
        ]);
        bugId = answer.selectedId;
    }

    const bugIndex = bugs.findIndex(b => b.id.toLowerCase() === bugId.toLowerCase());

    if (bugIndex === -1) {
        console.log(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
        return;
    }

    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete bug [${bugs[bugIndex].id}]?`,
            default: false
        }
    ]);

    if (confirm) {
        bugs.splice(bugIndex, 1);
        await saveBugs(bugs);
        console.log(chalk.green(`Bug [${bugId}] deleted successfully.`));
    } else {
        console.log(chalk.white('Deletion cancelled.'));
    }
};
