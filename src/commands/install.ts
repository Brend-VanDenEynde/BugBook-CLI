import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BUG_DIR, BUG_PATH, TAGS_PATH } from '../utils/storage';

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
        process.exit(0);
    }

    console.log(chalk.white('\nSetting things up...'));

    let created = false;

    try {
        if (!fs.existsSync(BUG_DIR)) {
            fs.mkdirSync(BUG_DIR);
            console.log(chalk.green(`Created directory: ${BUG_DIR}`));
            created = true;
        }

        if (!fs.existsSync(BUG_PATH)) {
            fs.writeFileSync(BUG_PATH, '# Bugbook Storage\n\n');
            console.log(chalk.green(`Created file: ${BUG_PATH}`));
            created = true;
        }

        if (!fs.existsSync(TAGS_PATH)) {
            fs.writeFileSync(TAGS_PATH, 'General\nFrontend\nBackend\n');
            console.log(chalk.green(`Created file: ${TAGS_PATH}`));
            created = true;
        }

        if (created) {
            console.log(chalk.green('\nBugbook has been successfully installed.'));
        } else {
            console.log(chalk.white('\nBugbook is already installed in this directory.'));
        }
    } catch (error) {
        console.log(chalk.red('Error: Failed to create files. Please check your permissions.'));
        console.log(chalk.white((error as Error).message));
        process.exit(1);
    }

    process.exit(0);
};
