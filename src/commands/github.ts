import inquirer from 'inquirer';
import chalk from 'chalk';
import { getUserConfig, setUserConfig } from '../utils/config';
import {
    verifyGitHubToken,
    detectGitHubRepo,
    createGitHubIssue,
    getGitHubConfig
} from '../utils/github';
import { getBugs, saveBug, ensureProjectInit } from '../utils/storage';

/**
 * Handle GitHub authentication
 */
export const handleGitHubAuth = async (args: string[]) => {
    // Check for --token flag
    const tokenIndex = args.indexOf('--token');
    let token: string | undefined;

    if (tokenIndex !== -1 && args[tokenIndex + 1]) {
        token = args[tokenIndex + 1];
    } else {
        // Interactive prompt
        const answer = await inquirer.prompt([{
            type: 'password',
            name: 'token',
            message: 'Enter your GitHub Personal Access Token:',
            validate: (input: string) => {
                if (!input.trim()) return 'Token cannot be empty.';
                if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
                    return 'Token should start with ghp_ or github_pat_';
                }
                return true;
            }
        }]);
        token = answer.token;
    }

    if (!token) {
        console.error(chalk.red('Error: No token provided.'));
        return;
    }

    // Verify token
    console.log(chalk.white('Verifying token...'));
    const valid = await verifyGitHubToken(token);

    if (!valid) {
        console.error(chalk.red('Error: Invalid GitHub token.'));
        console.log(chalk.white('\nTo create a token:'));
        console.log(chalk.white('1. Go to https://github.com/settings/tokens'));
        console.log(chalk.white('2. Click "Generate new token (classic)"'));
        console.log(chalk.white('3. Select scope: "repo"'));
        console.log(chalk.white('4. Copy the token and run this command again'));
        return;
    }

    // Save token
    setUserConfig('github.token', token);
    console.log(chalk.green('✓ GitHub token saved successfully!'));

    // Try to detect repository
    const detected = await detectGitHubRepo();
    if (detected) {
        setUserConfig('github.owner', detected.owner);
        setUserConfig('github.repo', detected.repo);
        console.log(chalk.green(`✓ Detected repository: ${detected.owner}/${detected.repo}`));
    } else {
        console.log(chalk.yellow('\n⚠  Could not detect GitHub repository.'));
        console.log(chalk.white('Run this in a git repository, or set manually:'));
        console.log(chalk.white('  bugbook config github.owner <username>'));
        console.log(chalk.white('  bugbook config github.repo <repo-name>'));
    }
};

/**
 * Show GitHub sync status
 */
export const handleGitHubStatus = async () => {
    if (!ensureProjectInit()) {
        console.error(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    const config = getUserConfig();
    const githubConfig = config.github || {};

    console.log(chalk.bold.white('\nGitHub Integration Status\n'));

    // Authentication
    if (githubConfig.token) {
        const valid = await verifyGitHubToken(githubConfig.token);
        if (valid) {
            console.log(chalk.green('✓ Authenticated: Yes'));
        } else {
            console.log(chalk.red('✗ Authenticated: No (invalid token)'));
        }
    } else {
        console.log(chalk.red('✗ Authenticated: No'));
        console.log(chalk.white('  Run: bugbook github auth'));
    }

    // Repository
    if (githubConfig.owner && githubConfig.repo) {
        console.log(chalk.green(`✓ Repository: ${githubConfig.owner}/${githubConfig.repo}`));
    } else {
        console.log(chalk.yellow('⚠  Repository: Not configured'));
        const detected = await detectGitHubRepo();
        if (detected) {
            console.log(chalk.white(`  Detected: ${detected.owner}/${detected.repo}`));
            console.log(chalk.white(`  Run: bugbook github auth (to save)`));
        }
    }

    // Bug statistics
    const bugs = await getBugs();
    const openBugs = bugs.filter(b => b.status === 'Open');
    const syncedBugs = bugs.filter(b => b.github_issue_number);
    const pendingBugs = openBugs.filter(b => !b.github_issue_number);

    console.log(chalk.white(`\nOpen bugs: ${openBugs.length}`));
    console.log(chalk.white(`Synced to GitHub: ${syncedBugs.length}`));
    console.log(chalk.white(`Pending sync: ${pendingBugs.length}`));

    if (pendingBugs.length > 0) {
        console.log(chalk.white('\nPending bugs:'));
        pendingBugs.slice(0, 5).forEach(bug => {
            const preview = bug.error.split('\n')[0].substring(0, 60);
            console.log(chalk.gray(`  - [${bug.id}] ${preview}`));
        });
        if (pendingBugs.length > 5) {
            console.log(chalk.gray(`  ... and ${pendingBugs.length - 5} more`));
        }
        console.log(chalk.white('\nRun: bugbook github push'));
    }

    console.log('');
};

/**
 * Push bugs to GitHub Issues
 */
export const handleGitHubPush = async (args: string[]) => {
    if (!ensureProjectInit()) {
        console.error(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    const config = getUserConfig();
    const githubConfig = config.github || {};

    // Validate configuration
    if (!githubConfig.token) {
        console.error(chalk.red('Error: GitHub token not configured.'));
        console.log(chalk.white('Run: bugbook github auth'));
        return;
    }

    if (!githubConfig.owner || !githubConfig.repo) {
        console.error(chalk.red('Error: GitHub repository not configured.'));
        const detected = await detectGitHubRepo();
        if (detected) {
            console.log(chalk.white(`Detected: ${detected.owner}/${detected.repo}`));
            console.log(chalk.white('Run: bugbook github auth (to save)'));
        } else {
            console.log(chalk.white('Set manually:'));
            console.log(chalk.white('  bugbook config github.owner <username>'));
            console.log(chalk.white('  bugbook config github.repo <repo-name>'));
        }
        return;
    }

    // Parse flags
    const dryRun = args.includes('--dry-run');
    const force = args.includes('--force');
    const specificBugIds = args.filter(arg => !arg.startsWith('--'));

    // Get bugs to push
    let bugs = await getBugs();

    // Filter for open bugs
    bugs = bugs.filter(b => b.status === 'Open');

    // Filter by specific IDs if provided
    if (specificBugIds.length > 0) {
        bugs = bugs.filter(b => specificBugIds.some(id => id.toUpperCase() === b.id.toUpperCase()));
    }

    // Filter out already synced bugs unless --force
    if (!force) {
        bugs = bugs.filter(b => !b.github_issue_number);
    }

    if (bugs.length === 0) {
        console.log(chalk.white('No bugs to push.'));
        return;
    }

    if (dryRun) {
        console.log(chalk.white(`\nDry run: Would push ${bugs.length} bug(s):\n`));
        bugs.forEach(bug => {
            const preview = bug.error.split('\n')[0].substring(0, 60);
            console.log(chalk.gray(`  - [${bug.id}] ${preview}`));
        });
        console.log(chalk.white('\nRun without --dry-run to push.'));
        return;
    }

    // Confirm
    const confirmAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Push ${bugs.length} bug(s) to GitHub Issues?`,
        default: true
    }]);

    if (!confirmAnswer.confirm) {
        console.log(chalk.white('Cancelled.'));
        return;
    }

    // Push bugs
    console.log(chalk.white(`\nPushing ${bugs.length} bug(s) to GitHub...\n`));

    let successCount = 0;
    let failCount = 0;

    for (const bug of bugs) {
        try {
            const issue = await createGitHubIssue(
                bug,
                githubConfig.owner!,
                githubConfig.repo!,
                githubConfig.token!
            );

            // Update bug with GitHub metadata
            bug.github_issue_number = issue.number;
            bug.github_issue_url = issue.html_url;
            bug.github_issue_closed = false;
            bug.last_synced = new Date().toISOString();
            await saveBug(bug);

            console.log(chalk.green(`✓ [${bug.id}] → Issue #${issue.number}`));
            successCount++;
        } catch (error: any) {
            console.error(chalk.red(`✗ [${bug.id}] Failed: ${error.message}`));
            failCount++;
        }
    }

    console.log(chalk.white(`\nDone! ${chalk.green(successCount)} succeeded, ${failCount > 0 ? chalk.red(failCount) : failCount} failed.`));

    if (successCount > 0) {
        console.log(chalk.white(`\nView issues: https://github.com/${githubConfig.owner}/${githubConfig.repo}/issues`));
    }
};

/**
 * Main GitHub command router
 */
export const handleGitHub = async (args: string[]) => {
    const subcommand = args[0];
    const restArgs = args.slice(1);

    switch (subcommand) {
        case 'auth':
            await handleGitHubAuth(restArgs);
            break;
        case 'status':
            await handleGitHubStatus();
            break;
        case 'push':
            await handleGitHubPush(restArgs);
            break;
        case 'help':
        case undefined:
            printGitHubHelp();
            break;
        default:
            console.error(chalk.red(`Unknown github subcommand: ${subcommand}`));
            printGitHubHelp();
    }
};

const printGitHubHelp = () => {
    console.log(chalk.bold.white('GitHub Integration Commands:'));
    console.log(`  ${chalk.white('github auth')}      - Authenticate with GitHub`);
    console.log(`  ${chalk.white('github status')}    - Show sync status`);
    console.log(`  ${chalk.white('github push')}      - Push bugs to GitHub Issues`);
    console.log(`\n${chalk.bold.white('Examples:')}`);
    console.log(`  ${chalk.gray('bugbook github auth')}`);
    console.log(`  ${chalk.gray('bugbook github auth --token ghp_xxx')}`);
    console.log(`  ${chalk.gray('bugbook github push')}`);
    console.log(`  ${chalk.gray('bugbook github push A1B2C3D4')}`);
    console.log(`  ${chalk.gray('bugbook github push --dry-run')}`);
    console.log(`  ${chalk.gray('bugbook github push --force')}`);
};
