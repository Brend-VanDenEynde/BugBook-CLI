import fs from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BUG_DIR, BUG_PATH, TAGS_PATH } from '../utils/storage';

export const handleInstall = async () => {
    console.log(chalk.cyan('Welcome to the Bugbook Installer'));
    console.log(chalk.gray('We are about to set up the necessary files for your bug tracking system.'));

    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'proceed',
            message: chalk.yellow('Are you sure you want to initialize Bugbook in this directory?'),
            default: true,
        },
    ]);

    if (!answers.proceed) {
        console.log(chalk.red('Installation aborted.'));
        process.exit(0);
    }

    console.log(chalk.blue('\nSetting things up...'));

    let created = false;

    if (!fs.existsSync(BUG_DIR)) {
        fs.mkdirSync(BUG_DIR);
        console.log(`Created directory: ${chalk.green(BUG_DIR)}`);
        created = true;
    }

    if (!fs.existsSync(BUG_PATH)) {
        fs.writeFileSync(BUG_PATH, '# Bugbook Storage\n\n');
        console.log(`Created file: ${chalk.green(BUG_PATH)}`);
        created = true;
    }

    if (!fs.existsSync(TAGS_PATH)) {
        fs.writeFileSync(TAGS_PATH, 'General\nFrontend\nBackend\n');
        console.log(`Created file: ${chalk.green(TAGS_PATH)}`);
        created = true;
    }

    if (created) {
        console.log(chalk.magenta('\nBugbook has been successfully installed.'));
    } else {
        console.log(chalk.yellow('\nBugbook is already installed in this directory.'));
    }

    process.exit(0);
};
