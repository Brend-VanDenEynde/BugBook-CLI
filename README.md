# Bugbook

**Bugbook** is a lightweight, CLI-based bug tracking tool designed for developers who want to keep track of bugs and solutions directly from their terminal. It stores your bug reports locally in your project directory using individual JSON files, making it easy to version control and share with your team.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)
![Version](https://img.shields.io/badge/version-0.5.0-green.svg)
[![npm](https://img.shields.io/npm/v/bugbook.svg)](https://www.npmjs.com/package/bugbook)
[![npm downloads](https://img.shields.io/npm/dm/bugbook.svg)](https://www.npmjs.com/package/bugbook)

## Features

-   **Local Storage**: Bugs are stored as individual JSON files in a `.bugbook/bugs/` directory within your project.
-   **Priority & Due Dates**: Assign priorities (High/Medium/Low) and due dates with overdue warnings.
-   **Comments**: Add timestamped notes to any bug for ongoing tracking.
-   **Tagging System**: Organize bugs by categories (e.g., specific files, modules, or types of errors).
-   **Fuzzy Search**: Quickly find past solutions by error message, ID, priority, or file name.
-   **Advanced List Filtering & Sorting** ✨ NEW: Filter bugs by priority, status, tags, and author. Sort by priority, date, status, or due date.
-   **Bulk Resolve Operations** ✨ NEW: Resolve multiple bugs at once with filtering support (by tag, status) and batch operations.
-   **Shell Auto-Completion** ✨ NEW: Tab completion for commands and bug IDs in bash, zsh, and fish shells.
-   **Configurable Editor**: Set your preferred text editor (VS Code, Notepad, Vim, etc.) for detailed bug descriptions.
-   **Interactive Init**: Guided setup for user details and preferences.
-   **Export**: Export your bug database to a Markdown report (`BUGS.md`).
-   **Statistics**: Get an overview of open, resolved, and overdue bugs.
-   **Interactive CLI**: Easy-to-use command-line interface with prompts.
-   **GitHub Integration**: Sync bugs to GitHub Issues with one command! Requires GitHub token with `repo` scope. See [GitHub Integration Guide](./GITHUB_INTEGRATION.md)

## Installation

### From npm

```bash
npm install -g bugbook
```

### From Source

1.  Clone the repository:
    ```bash
    git clone https://github.com/Brend-VanDenEynde/BugBook-CLI.git
    cd BugBook-CLI
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

4.  Link the command globally to use `bugbook` anywhere:
    ```bash
    npm link
    ```

## Usage

After installing, you can run the tool directly.

### 1. Initialize

Navigate to your project directory and run:

```bash
bugbook init
```

This creates a `.bugbook` folder where your bugs and tags will be stored.

### 2. Open Bugbook (Interactive)

To open the interactive menu, simply run:

```bash
bugbook
```

### 3. Direct Commands

You can also run commands directly:

```bash
bugbook <command> [arguments]
```

### Commands

| Command | Description |
| :--- | :--- |
| `init` | Initialize Bugbook in the current directory. |
| `add` | Report a new bug with error, solution, priority, files, and due date. |
| `list [options]` | List bugs with filtering and sorting. Supports `--priority`, `--status`, `--tagged`, `--author`, `--sort`, `--order`, `--limit`. |
| `search [query]` | Fuzzy search for bugs by ID, text, priority, or file name. |
| `edit [ID]` | Edit an existing bug's details (error, solution, category, priority, files, due date). |
| `delete [ID]` | Delete a bug by ID (with confirmation). |
| `resolve [IDs] [options]` | Resolve/re-open bugs. Supports multiple IDs, `--all-tagged`, `--all-status`, `-y`/`--no-confirm`. |
| `comment [ID]` | Add a timestamped comment/note to a bug. |
| `stats` | Show an overview of bugs (Open, Resolved, Overdue, Top Categories). |
| `tags` | List all available tags and their usage counts. |
| `new-tag` | Create a new tag category. |
| `export [--out file]` | Export bugs to a Markdown file (default: `BUGS.md`). |
| `config [key] [value]` | View or set global configuration (user.name, editor). |
| `github [subcommand]` | GitHub Issues integration (auth, push, status). |
| `completion [subcommand]` | Setup shell auto-completion (install, setup, generate, uninstall). |
| `version` | Show the current version of Bugbook. |
| `help` | Display the help menu. |

### Examples
    
**Initialize (First time only):**
```bash
bugbook init
```

**Adding a Bug:**
```bash
bugbook add
# Follow the interactive prompts for error, solution, priority, files, and due date
```

**Searching for a Solution:**
```bash
bugbook search "null pointer"
```

**Adding a Comment:**
```bash
bugbook comment ABC123
```

**Export to Markdown:**
```bash
bugbook export --out report.md
```

**List Bugs with Filtering:**
```bash
bugbook list --priority High --status Open
bugbook list --tagged Frontend --sort dueDate --order asc
bugbook list --author john --limit 10
```

**Bulk Resolve Operations:**
```bash
bugbook resolve ABC123 DEF456 GHI789
bugbook resolve --all-tagged Backend
bugbook resolve --all-status Open --all-tagged Frontend -y
```

**Setup Shell Completion:**

Tab completion is offered automatically during `bugbook init`. You can also set it up manually:

```bash
bugbook completion setup     # Auto-detect shell and install
bugbook completion install   # Interactive shell selection
```

After setup, restart your terminal or run `source ~/.bashrc` (or `~/.zshrc` for zsh).

## Contributing

Contributions are welcome! If you have ideas for improvements or new features, feel free to fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the [ISC](LICENSE) License.

