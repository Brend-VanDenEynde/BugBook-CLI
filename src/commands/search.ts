import inquirer from 'inquirer';
import { parseBugs, ensureProjectInit } from '../utils/storage';

export const handleSearch = async (argStr: string) => {
    if (!ensureProjectInit()) {
        console.log('No bugs found.');
        return;
    }

    let searchQuery = argStr;

    if (!searchQuery) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'query',
                message: 'Search (ID or text):'
            }
        ]);
        searchQuery = answer.query;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const bugs = parseBugs();
    const results = bugs.filter(b =>
        b.id.toLowerCase() === lowerQuery ||
        b.content.toLowerCase().includes(lowerQuery)
    );

    if (results.length > 0) {
        console.log(`\nFound ${results.length} match(es):\n`);
        results.forEach(r => {
            console.log(r.content);
            console.log('---');
        });
    } else {
        console.log('No matches found.');
    }
};
