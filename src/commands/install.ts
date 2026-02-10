import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BUG_DIR, getTagsPath, initStorage } from '../utils/storage';
import { getUserConfig, setUserConfig } from '../utils/config';

export const handleInstall = async () => {
    console.log(chalk.bold.white('Welcome to the Bugbook Installer'));
    console.log(chalk.white('Setting up the necessary files for your bug tracking system.'));

    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'proceed',
            message: 'Initialize Bugbook in this directory?',
            default: true,
        },
    ]);

    if (!answers.proceed) {
        console.log(chalk.white('Installation aborted.'));
        return;
    }

    // Check if global config is already set
    const currentConfig = getUserConfig();
    let configUpdates = false;

    if (!currentConfig.user?.name) {
        const nameAnswer = await inquirer.prompt([{
            type: 'input',
            name: 'name',
            message: 'What is your name? (for bug authorship)',
        }]);
        if (nameAnswer.name) {
            setUserConfig('user.name', nameAnswer.name);
            console.log(chalk.green(`User name set to: ${nameAnswer.name}`));
            configUpdates = true;
        }
    }

    if (!currentConfig.editor) {
        await promptForEditor();
    } else {
        const resetAnswer = await inquirer.prompt([{
            type: 'confirm',
            name: 'reset',
            message: `Editor is already set to '${currentConfig.editor}'. Do you want to change it?`,
            default: false
        }]);
        if (resetAnswer.reset) {
            await promptForEditor();
        }
    }

    async function promptForEditor() {
        const editorAnswer = await inquirer.prompt([{
            type: 'list',
            name: 'editor',
            message: 'Which editor do you prefer for writing bug details?',
            choices: [
                { name: 'VS Code', value: 'code --wait' },
                { name: 'Notepad', value: 'notepad' },
                { name: 'Standard CLI Input (No external editor)', value: 'cli' },
                { name: 'Custom...', value: 'custom' }
            ]
        }]);

        let selectedEditor = editorAnswer.editor;

        if (selectedEditor === 'custom') {
            const customEditor = await inquirer.prompt([{
                type: 'input',
                name: 'cmd',
                message: 'Enter command to open your editor (e.g. "subl -w"):',
                validate: (input: string) => input.trim() !== '' ? true : 'Please enter a command.'
            }]);
            selectedEditor = customEditor.cmd;
        }

        setUserConfig('editor', selectedEditor);
        console.log(chalk.green(`Editor set to: ${selectedEditor}`));
    }

    if (configUpdates) {
        console.log(chalk.white('Configuration saved to .bugbookrc\n'));
    }

    console.log(chalk.white('\nSetting things up...'));

    let created = false;
    const tagsPath = getTagsPath();

    try {
        await initStorage();

        if (!fs.existsSync(tagsPath)) {
            fs.writeFileSync(tagsPath, JSON.stringify(['General', 'Frontend', 'Backend'], null, 2), { mode: 0o600 });
            console.log(chalk.green(`Created file: ${tagsPath}`));
            created = true;
        } else {
            console.log(chalk.white(`File already exists: ${tagsPath}`));
        }

        if (created) {
            console.log(chalk.green('\nBugbook has been successfully installed.'));
        } else {
            console.log(chalk.white('\nBugbook is already installed in this directory.'));
        }
    } catch (error) {
        console.log(chalk.red('Error: Failed to create files. Please check your permissions.'));
        if (error instanceof Error) {
            console.log(chalk.white(error.message));
        }
    }
};

