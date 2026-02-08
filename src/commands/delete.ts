import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, saveBugs, ensureProjectInit } from '../utils/storage';

export const handleDelete = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log(chalk.red('Bugbook is not initialized.'));
        return;
    }

    let bugId = argStr.trim();
    const bugs = getBugs();

    if (bugs.length === 0) {
        console.log(chalk.yellow('No bugs to delete.'));
        return;
    }

    if (!bugId) {
        // Interactive selection
        const choices = bugs.map(b => ({
            name: `[${b.id}] ${b.error.substring(0, 50)}${b.error.length > 50 ? '...' : ''}`,
            value: b.id
        }));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedId',
                message: chalk.yellow('Select a bug to delete:'),
                choices,
                pageSize: 10
            }
        ]);
        bugId = answer.selectedId;
    }

    const bugIndex = bugs.findIndex(b => b.id.toLowerCase() === bugId.toLowerCase());

    if (bugIndex === -1) {
        console.log(chalk.red(`Bug with ID '${bugId}' not found.`));
        return;
    }

    // Confirm deletion
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: chalk.red(`Are you sure you want to delete bug [${bugs[bugIndex].id}]?`),
            default: false
        }
    ]);

    if (confirm) {
        bugs.splice(bugIndex, 1);
        saveBugs(bugs);
        console.log(chalk.green(`Bug [${bugId}] deleted successfully.`));
    } else {
        console.log(chalk.yellow('Deletion cancelled.'));
    }
};
