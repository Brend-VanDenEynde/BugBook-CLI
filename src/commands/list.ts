import { parseBugs } from '../utils/storage';

export const handleList = () => {
    const allBugs = parseBugs();
    if (allBugs.length === 0) {
        console.log('No bugs found.');
    } else {
        const last5 = allBugs.slice(-5);
        console.log(`\nShowing last ${last5.length} entry(s):\n`);
        last5.forEach(r => {
            console.log(r.content);
            console.log('---');
        });
    }
};
