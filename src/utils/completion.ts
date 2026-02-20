import omelette from 'omelette';
import { getAllBugIds } from './storage';

/**
 * Get bug IDs for completion (fast, reads filenames only).
 */
export const getBugIdsForCompletion = async (): Promise<string[]> => {
    try {
        return await getAllBugIds();
    } catch {
        return [];
    }
};

/**
 * All available bugbook commands.
 */
const COMMANDS = [
    'init',
    'add',
    'list',
    'search',
    'edit',
    'delete',
    'resolve',
    'comment',
    'stats',
    'tags',
    'new-tag',
    'export',
    'version',
    'config',
    'github',
    'completion',
    'help'
];

/**
 * Commands that accept bug IDs as arguments.
 */
const COMMANDS_WITH_BUG_IDS = ['edit', 'delete', 'resolve', 'comment'];

/**
 * Create and configure the omelette completion instance.
 */
export const createCompletion = () => {
    const completion = omelette('bugbook');

    // Setup completion tree
    completion.on('complete', function (this: any, fragment: string, data: any) {
        if (data.line.trim() === 'bugbook' || data.before.trim() === 'bugbook') {
            // Complete commands
            return this.reply(COMMANDS);
        }

        // Extract the command from the line
        const parts = data.line.trim().split(/\s+/);
        const command = parts[1]; // parts[0] is 'bugbook'

        // If the command accepts bug IDs, complete with bug IDs
        if (command && COMMANDS_WITH_BUG_IDS.includes(command)) {
            getBugIdsForCompletion().then((bugIds) => {
                this.reply(bugIds);
            });
            return;
        }

        // For 'list' command, complete with flags
        if (command === 'list') {
            const listFlags = [
                '--priority',
                '--status',
                '--tagged',
                '--author',
                '--sort',
                '--order',
                '--limit'
            ];
            return this.reply(listFlags);
        }

        // For 'resolve' command, complete with flags and bug IDs
        if (command === 'resolve') {
            const resolveFlags = [
                '--all-tagged',
                '--all-status',
                '-y',
                '--no-confirm'
            ];
            getBugIdsForCompletion().then((bugIds) => {
                this.reply([...resolveFlags, ...bugIds]);
            });
            return;
        }

        // For 'github' command, complete with subcommands
        if (command === 'github') {
            const githubSubcommands = ['auth', 'push', 'status'];
            return this.reply(githubSubcommands);
        }

        // For 'completion' command, complete with subcommands
        if (command === 'completion') {
            const completionSubcommands = ['install', 'setup', 'generate', 'uninstall'];
            return this.reply(completionSubcommands);
        }

        // For 'config' command, complete with subcommands
        if (command === 'config') {
            const configSubcommands = ['get', 'set', 'list'];
            return this.reply(configSubcommands);
        }

        // Default: no completions
        return this.reply([]);
    });

    return completion;
};
