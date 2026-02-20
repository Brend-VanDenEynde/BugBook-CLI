import chalk from 'chalk';
import inquirer from 'inquirer';
import { createCompletion } from '../utils/completion';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Detect the current shell from environment variables.
 */
const detectShell = (): string | null => {
    const shell = process.env.SHELL || process.env.ComSpec || '';
    if (shell.includes('bash')) return 'bash';
    if (shell.includes('zsh')) return 'zsh';
    if (shell.includes('fish')) return 'fish';
    if (shell.includes('pwsh') || shell.includes('powershell')) return 'powershell';
    return null;
};

/**
 * Get shell RC file path.
 */
const getShellRcPath = (shell: string): string => {
    const home = process.env.HOME || process.env.USERPROFILE || '~';
    switch (shell) {
        case 'bash':
            return `${home}/.bashrc`;
        case 'zsh':
            return `${home}/.zshrc`;
        case 'fish':
            return `${home}/.config/fish/config.fish`;
        default:
            return '';
    }
};

/**
 * Generate completion setup script for a specific shell.
 */
export const generateCompletionScript = (shell: string): string => {
    // Return the appropriate completion script based on shell
    switch (shell) {
        case 'bash':
            return `# Bugbook completion for Bash\neval "$(bugbook --completion-bash)"`;
        case 'zsh':
            return `# Bugbook completion for Zsh\neval "$(bugbook --completion-zsh)"`;
        case 'fish':
            return `# Bugbook completion for Fish\neval "$(bugbook --completion-fish)"`;
        default:
            return `# Bugbook completion\n# Unsupported shell: ${shell}`;
    }
};

/**
 * Handle completion setup command (auto-detect shell).
 */
export const handleCompletionSetup = async () => {
    const shell = detectShell();

    if (!shell || shell === 'powershell') {
        console.log(chalk.yellow('Could not auto-detect a supported shell (bash, zsh, fish).'));
        console.log(chalk.white('Please use "bugbook completion install" to select a shell manually.'));
        return;
    }

    try {
        const completion = createCompletion();
        (completion as any).setupShellInitFile(shell);

        const rcPath = getShellRcPath(shell);
        console.log(chalk.green(`✓ Shell completion setup script added to ${rcPath}`));
        console.log(chalk.white('\nTo activate completions, run:'));
        console.log(chalk.cyan(`  source ${rcPath}`));
        console.log(chalk.white('\nOr restart your terminal.'));
    } catch (error) {
        console.error(chalk.red('Error setting up completions:'), error instanceof Error ? error.message : error);
        console.log(chalk.white('\nYou can manually add completions by running:'));
        console.log(chalk.cyan('  bugbook completion generate'));
    }
};

/**
 * Handle completion install command (interactive shell selection).
 */
export const handleCompletionInstall = async () => {
    const answer = await inquirer.prompt([{
        type: 'list',
        name: 'shell',
        message: 'Select your shell:',
        choices: ['bash', 'zsh', 'fish', 'Manual (show script)'],
        default: 'bash'
    }]);

    if (answer.shell === 'Manual (show script)') {
        await handleCompletionGenerate();
        return;
    }

    try {
        const completion = createCompletion();
        (completion as any).setupShellInitFile(answer.shell);

        const rcPath = getShellRcPath(answer.shell);
        console.log(chalk.green(`✓ Shell completion setup script added to ${rcPath}`));
        console.log(chalk.white('\nTo activate completions, run:'));
        console.log(chalk.cyan(`  source ${rcPath}`));
        console.log(chalk.white('\nOr restart your terminal.'));
    } catch (error) {
        console.error(chalk.red('Error installing completions:'), error instanceof Error ? error.message : error);
        console.log(chalk.white('\nYou can manually add completions by running:'));
        console.log(chalk.cyan('  bugbook completion generate'));
    }
};

/**
 * Handle completion generate command (output script for manual installation).
 */
export const handleCompletionGenerate = async () => {
    const answer = await inquirer.prompt([{
        type: 'list',
        name: 'shell',
        message: 'Generate completion script for:',
        choices: ['bash', 'zsh', 'fish'],
        default: 'bash'
    }]);

    const script = generateCompletionScript(answer.shell);
    const rcPath = getShellRcPath(answer.shell);

    console.log(chalk.white('\nAdd the following to your shell configuration file:'));
    console.log(chalk.cyan(`  ${rcPath}`));
    console.log(chalk.white('\n--- Copy below ---'));
    console.log(chalk.gray(script));
    console.log(chalk.white('--- End ---\n'));

    console.log(chalk.white('After adding, run:'));
    console.log(chalk.cyan(`  source ${rcPath}`));
};

/**
 * Handle completion uninstall command.
 */
export const handleCompletionUninstall = async () => {
    const shell = detectShell();

    if (!shell || shell === 'powershell') {
        console.log(chalk.yellow('Could not auto-detect shell.'));
        console.log(chalk.white('Please manually remove completion lines from your shell RC file.'));
        return;
    }

    const rcPath = getShellRcPath(shell);
    console.log(chalk.white('To uninstall completions, remove the bugbook completion lines from:'));
    console.log(chalk.cyan(`  ${rcPath}`));
    console.log(chalk.white('\nLook for lines containing "bugbook" completion setup.'));
};

/**
 * Main completion command handler.
 */
export const handleCompletion = async (args: string[]) => {
    const subcommand = args[0];

    if (!subcommand) {
        console.log(chalk.bold.white('Bugbook Shell Completion\n'));
        console.log(chalk.white('Commands:'));
        console.log(`  ${chalk.white('install')}    - Interactive installation (select shell)`);
        console.log(`  ${chalk.white('setup')}      - Quick setup (auto-detect shell)`);
        console.log(`  ${chalk.white('generate')}   - Generate script for manual installation`);
        console.log(`  ${chalk.white('uninstall')}  - Show uninstallation instructions`);
        console.log('');
        console.log(chalk.white('Examples:'));
        console.log(chalk.gray('  bugbook completion install'));
        console.log(chalk.gray('  bugbook completion setup'));
        return;
    }

    switch (subcommand) {
        case 'install':
            await handleCompletionInstall();
            break;
        case 'setup':
            await handleCompletionSetup();
            break;
        case 'generate':
            await handleCompletionGenerate();
            break;
        case 'uninstall':
            await handleCompletionUninstall();
            break;
        default:
            console.log(chalk.red(`Unknown completion subcommand: '${subcommand}'`));
            console.log(chalk.white('Run "bugbook completion" for usage.'));
    }
};
