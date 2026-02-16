import chalk from 'chalk';
import { getBugs, saveBug, ensureProjectInit, validateBugId } from '../utils/storage';
import { selectBugPrompt } from '../utils/prompts';

export const handleResolve = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.error(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    let bugId = argStr.trim();

    if (bugId && !validateBugId(bugId)) {
        console.error(chalk.red('Error: Invalid bug ID format.'));
        return;
    }

    const bugs = await getBugs();

    if (bugs.length === 0) {
        console.log(chalk.white('No bugs found.'));
        return;
    }

    if (!bugId) {
        bugId = await selectBugPrompt(bugs, 'Select a bug to resolve/re-open:');
    }

    const bug = bugs.find(b => b.id.toUpperCase() === bugId.toUpperCase());

    if (!bug) {
        console.error(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
        return;
    }

    const newStatus = bug.status === 'Open' ? 'Resolved' : 'Open';
    bug.status = newStatus;
    await saveBug(bug);

    const icon = newStatus === 'Resolved' ? '✅' : '🔴';
    console.log(chalk.green(`Bug [${bug.id}] status updated to: ${icon} ${newStatus}`));
};
