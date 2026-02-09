import inquirer from 'inquirer';
import chalk from 'chalk';
import { getBugs, saveBugs, ensureProjectInit, BUG_PREVIEW_LENGTH } from '../utils/storage';

export const handleResolve = async (argStr: string) => {
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
        // Interactive selection
        const choices = bugs.map(b => ({
            name: `[${b.id}] ${b.status === 'Resolved' ? '✅' : '🔴'} ${b.error.substring(0, BUG_PREVIEW_LENGTH)}${b.error.length > BUG_PREVIEW_LENGTH ? '...' : ''}`,
            value: b.id
        }));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedId',
                message: chalk.yellow('Select a bug to resolve/re-open:'),
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

    // Toggle status
    const newStatus = bug.status === 'Open' ? 'Resolved' : 'Open';
    bug.status = newStatus;
    saveBugs(bugs);

    const icon = newStatus === 'Resolved' ? '✅' : '🔴';
    console.log(chalk.green(`Bug [${bug.id}] status updated to: ${icon} ${newStatus}`));
};
