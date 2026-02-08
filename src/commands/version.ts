import chalk from 'chalk';

export const handleVersion = () => {
    try {
        const packageJson = require('../../package.json');
        console.log(`v${packageJson.version}`);
    } catch (error) {
        console.log(chalk.red('Could not determine version.'));
    }
};
