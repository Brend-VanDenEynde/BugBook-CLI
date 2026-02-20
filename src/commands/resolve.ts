import chalk from 'chalk';
import inquirer from 'inquirer';
import { getBugs, saveBug, ensureProjectInit, validateBugId, Bug, BugStatus } from '../utils/storage';
import { selectBugPrompt } from '../utils/prompts';
import { getGitHubConfig, closeGitHubIssue, reopenGitHubIssue } from '../utils/github';

interface ResolveOptions {
    bugIds: string[];
    allTagged?: string;
    allStatus?: BugStatus;
    noConfirm?: boolean;
}

const parseResolveArgs = (argStr: string): ResolveOptions => {
    const options: ResolveOptions = {
        bugIds: []
    };

    const parts = argStr.trim().split(/\s+/).filter(p => p);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (part === '--all-tagged' && parts[i + 1]) {
            options.allTagged = parts[i + 1];
            i++;
        } else if (part === '--all-status' && parts[i + 1]) {
            const status = parts[i + 1];
            if (status === 'Open' || status === 'Resolved') {
                options.allStatus = status;
            }
            i++;
        } else if (part === '-y' || part === '--no-confirm') {
            options.noConfirm = true;
        } else if (!part.startsWith('--') && !part.startsWith('-')) {
            // This is a bug ID
            options.bugIds.push(part);
        }
    }

    return options;
};

const resolveSingleBug = async (bug: Bug): Promise<{ success: boolean; newStatus: BugStatus; githubClosed?: boolean }> => {
    const newStatus: BugStatus = bug.status === 'Open' ? 'Resolved' : 'Open';
    bug.status = newStatus;

    let githubClosed: boolean | undefined;

    // Auto-close or reopen the linked GitHub issue if configured
    if (bug.github_issue_number) {
        const githubConfig = getGitHubConfig();
        if (githubConfig.token && githubConfig.owner && githubConfig.repo) {
            try {
                if (newStatus === 'Resolved') {
                    await closeGitHubIssue(bug.github_issue_number, githubConfig.owner, githubConfig.repo, githubConfig.token);
                    bug.github_issue_closed = true;
                    githubClosed = true;
                } else {
                    await reopenGitHubIssue(bug.github_issue_number, githubConfig.owner, githubConfig.repo, githubConfig.token);
                    bug.github_issue_closed = false;
                    githubClosed = false;
                }
            } catch {
                // Non-fatal: GitHub sync failed, local status still saved
            }
        }
    }

    await saveBug(bug);
    return { success: true, newStatus, githubClosed };
};

export const handleResolve = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.error(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    const bugs = await getBugs();

    if (bugs.length === 0) {
        console.log(chalk.white('No bugs found.'));
        return;
    }

    // Parse arguments
    const options = parseResolveArgs(argStr);

    // Backward compatible: no arguments means interactive mode
    if (options.bugIds.length === 0 && !options.allTagged && !options.allStatus) {
        const bugId = await selectBugPrompt(bugs, 'Select a bug to resolve/re-open:');
        const bug = bugs.find(b => b.id.toUpperCase() === bugId.toUpperCase());

        if (!bug) {
            console.error(chalk.red(`Error: Bug with ID '${bugId}' not found.`));
            return;
        }

        const result = await resolveSingleBug(bug);
        const icon = result.newStatus === 'Resolved' ? '✅' : '🔴';
        console.log(chalk.green(`Bug [${bug.id}] status updated to: ${icon} ${result.newStatus}`));
        if (bug.github_issue_number !== undefined && result.githubClosed !== undefined) {
            const ghStatus = result.githubClosed ? 'closed' : 'reopened';
            console.log(chalk.gray(`  GitHub issue #${bug.github_issue_number} ${ghStatus}`));
        }
        return;
    }

    // Validate all bug IDs upfront
    const invalidIds: string[] = [];
    for (const id of options.bugIds) {
        if (!validateBugId(id)) {
            invalidIds.push(id);
        }
    }

    if (invalidIds.length > 0) {
        console.error(chalk.red(`Error: Invalid bug ID format: ${invalidIds.join(', ')}`));
        return;
    }

    // Collect bugs to resolve based on filters
    let bugsToResolve: Bug[] = [];

    // Add bugs by ID
    for (const id of options.bugIds) {
        const bug = bugs.find(b => b.id.toUpperCase() === id.toUpperCase());
        if (bug) {
            bugsToResolve.push(bug);
        } else {
            console.log(chalk.yellow(`Warning: Bug with ID '${id}' not found.`));
        }
    }

    // Filter by tag
    if (options.allTagged) {
        const taggedBugs = bugs.filter(b =>
            b.category.toLowerCase() === options.allTagged!.toLowerCase()
        );
        // Merge with existing bugs (avoid duplicates)
        for (const bug of taggedBugs) {
            if (!bugsToResolve.find(b => b.id === bug.id)) {
                bugsToResolve.push(bug);
            }
        }
    }

    // Filter by status
    if (options.allStatus) {
        if (options.allTagged || options.bugIds.length > 0) {
            // Apply status filter to existing selection
            bugsToResolve = bugsToResolve.filter(b => b.status === options.allStatus);
        } else {
            // Filter all bugs by status
            bugsToResolve = bugs.filter(b => b.status === options.allStatus);
        }
    }

    if (bugsToResolve.length === 0) {
        console.log(chalk.yellow('No bugs match the specified criteria.'));
        return;
    }

    // Show preview and confirmation for multiple bugs
    if (bugsToResolve.length > 1) {
        console.log(chalk.bold.white(`\nBugs to update (${bugsToResolve.length}):`));
        bugsToResolve.forEach(b => {
            const statusIcon = b.status === 'Resolved' ? '✅' : '🔴';
            const newStatusIcon = b.status === 'Open' ? '✅' : '🔴';
            const newStatus = b.status === 'Open' ? 'Resolved' : 'Open';
            console.log(`  ${statusIcon} → ${newStatusIcon} [${b.id}] ${b.error.substring(0, 50)}${b.error.length > 50 ? '...' : ''}`);
        });

        if (!options.noConfirm) {
            const answer = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: `Process ${bugsToResolve.length} bug(s)?`,
                default: false
            }]);

            if (!answer.confirm) {
                console.log(chalk.white('Operation cancelled.'));
                return;
            }
        }
    }

    // Process bugs with progress feedback
    const results = {
        success: 0,
        failed: 0,
        errors: [] as { id: string; error: string }[]
    };

    console.log('');
    for (const bug of bugsToResolve) {
        try {
            const result = await resolveSingleBug(bug);
            const icon = result.newStatus === 'Resolved' ? '✅' : '🔴';
            let line = chalk.green(`✓ [${bug.id}] Status updated to: ${icon} ${result.newStatus}`);
            if (bug.github_issue_number !== undefined && result.githubClosed !== undefined) {
                const ghStatus = result.githubClosed ? 'closed' : 'reopened';
                line += chalk.gray(` (GitHub #${bug.github_issue_number} ${ghStatus})`);
            }
            console.log(line);
            results.success++;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.log(chalk.red(`✗ [${bug.id}] Failed: ${errorMsg}`));
            results.failed++;
            results.errors.push({ id: bug.id, error: errorMsg });
        }
    }

    // Display summary
    console.log('');
    console.log(chalk.bold.white('Summary:'));
    console.log(chalk.green(`  ✓ Success: ${results.success}`));
    if (results.failed > 0) {
        console.log(chalk.red(`  ✗ Failed: ${results.failed}`));
        console.log('');
        console.log(chalk.red.bold('Errors:'));
        results.errors.forEach(e => {
            console.log(chalk.red(`  - [${e.id}] ${e.error}`));
        });
    }
};
