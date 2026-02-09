import chalk from 'chalk';
import packageJson from '../../package.json';

export const handleVersion = () => {
    console.log(`v${packageJson.version}`);
};
