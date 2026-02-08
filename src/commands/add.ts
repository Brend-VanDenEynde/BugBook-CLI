import fs from 'fs';
import inquirer from 'inquirer';
import { generateId, getTags, TAGS_PATH, BUG_PATH, ensureProjectInit } from '../utils/storage';

export const handleAdd = async () => {
    if (!ensureProjectInit()) {
        console.log('Error: Bugbook is not installed in this directory.');
        console.log('Run "bugbook install" first.');
        return;
    }

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'errorMsg',
            message: 'Bug error message:'
        },
        {
            type: 'input',
            name: 'solutionMsg',
            message: 'Bug solutions:'
        },
        {
            type: 'list',
            name: 'tag',
            message: 'Select a category/tag:',
            choices: [...getTags(), new inquirer.Separator(), 'Create new tag'],
            pageSize: 10
        }
    ]);

    let selectedTag = answers.tag;

    if (selectedTag === 'Create new tag') {
        const newTagAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'newTagName',
                message: 'Enter new tag name:'
            }
        ]);
        selectedTag = newTagAnswer.newTagName.trim() || 'General';

        // Save new tag if unique
        if (!getTags().includes(selectedTag)) {
            fs.appendFileSync(TAGS_PATH, `${selectedTag}\n`);
        }
    }

    const id = generateId();
    const entry = `\n## [${new Date().toLocaleString()}]\n**ID:** ${id}\n**Category:** ${selectedTag}\n**Error:** ${answers.errorMsg}\n**Solution:** ${answers.solutionMsg}\n---\n`;

    try {
        fs.appendFileSync(BUG_PATH, entry);
        console.log(`Bug added successfully! ID: ${id}`);
    } catch (e) {
        console.log('Error saving bug entry:', e);
    }
};
