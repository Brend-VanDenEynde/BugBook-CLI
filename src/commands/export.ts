import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

import { getBugs, Bug, ensureProjectInit } from '../utils/storage';

export const handleExport = async (args: string[]) => {
    if (!ensureProjectInit()) {
        console.error(chalk.red('Error: Bugbook is not initialized.'));
        return;
    }

    const bugs = await getBugs();
    if (bugs.length === 0) {
        console.log(chalk.white('No bugs to export.'));
        return;
    }

    // Default output file
    let outputFile = 'BUGS.md';

    // Simple argument parsing (native parser or minimal manual)
    // args: [--out filename] [--format markdown]
    // For now assume markdown default

    const outIndex = args.indexOf('--out');
    if (outIndex !== -1 && args[outIndex + 1]) {
        outputFile = args[outIndex + 1];
    }

    const resolvedOut = path.resolve(outputFile);
    if (!resolvedOut.startsWith(process.cwd())) {
        console.error(chalk.red('Error: Output path must be within the current directory.'));
        return;
    }

    const content = generateMarkdown(bugs);

    try {
        await fs.writeFile(outputFile, content);
        console.log(chalk.green(`Successfully exported ${bugs.length} bugs to ${outputFile}`));
    } catch (error: any) {
        console.error(chalk.red(`Failed to export: ${error.message}`));
    }
};

export const generateMarkdown = (bugs: Bug[]): string => {
    let md = '# BugBook Report\n\n';
    md += `Generated on: ${new Date().toISOString()}\n\n`;

    // Group by status? Or just list.
    // Let's list Open first, then Resolved.
    const openBugs = bugs.filter(b => b.status === 'Open');
    const resolvedBugs = bugs.filter(b => b.status === 'Resolved');

    md += '## Open Bugs\n\n';
    if (openBugs.length === 0) {
        md += '_No open bugs._\n\n';
    } else {
        openBugs.forEach(b => md += formatBugMd(b));
    }

    md += '## Resolved Bugs\n\n';
    if (resolvedBugs.length === 0) {
        md += '_No resolved bugs._\n\n';
    } else {
        resolvedBugs.forEach(b => md += formatBugMd(b));
    }

    return md;
};

const formatBugMd = (bug: Bug): string => {
    let entry = `### [${bug.id}] ${bug.error.split('\n')[0]}\n`;
    entry += `- **Category**: ${bug.category}\n`;
    entry += `- **Priority**: ${bug.priority || 'Medium'}\n`;
    if (bug.author) entry += `- **Author**: ${bug.author}\n`;
    if (bug.dueDate) entry += `- **Due Date**: ${bug.dueDate}\n`;
    entry += `- **Date**: ${bug.timestamp}\n\n`;

    entry += `**Error**:\n\`\`\`\n${bug.error}\n\`\`\`\n\n`;

    if (bug.solution) {
        entry += `**Solution**:\n${bug.solution}\n\n`;
    }

    if (bug.files && bug.files.length > 0) {
        entry += `**Related Files**:\n`;
        bug.files.forEach(f => entry += `- \`${f}\`\n`);
        entry += '\n';
    }

    if (bug.comments && bug.comments.length > 0) {
        entry += `**Comments** (${bug.comments.length}):\n`;
        bug.comments.forEach(c => {
            const authorStr = c.author ? ` (${c.author})` : '';
            entry += `> _${c.timestamp}${authorStr}_: ${c.text}\n\n`;
        });
    }

    entry += '---\n\n';
    return entry;
};
