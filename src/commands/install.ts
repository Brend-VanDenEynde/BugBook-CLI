import fs from 'fs';
import { BUG_DIR, BUG_PATH, TAGS_PATH } from '../utils/storage';

export const handleInstall = () => {
    if (!fs.existsSync(BUG_DIR)) {
        fs.mkdirSync(BUG_DIR);
        console.log(`Created directory: ${BUG_DIR}`);
    }
    if (!fs.existsSync(BUG_PATH)) {
        fs.writeFileSync(BUG_PATH, '# Bugbook Storage\n\n');
        console.log(`Created file: ${BUG_PATH}`);
    }
    if (!fs.existsSync(TAGS_PATH)) {
        fs.writeFileSync(TAGS_PATH, 'General\nFrontend\nBackend\n');
        console.log(`Created file: ${TAGS_PATH}`);
    } else {
        console.log('Bugbook is already installed in this directory.');
    }
    process.exit(0);
};
