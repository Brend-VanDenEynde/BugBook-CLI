# Bugbook

**Bugbook** is a lightweight, CLI-based bug tracking tool designed for developers who want to keep track of bugs and solutions directly from their terminal. It stores your bug reports locally in your project directory using Markdown, making it easy to version control and share with your team.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)

## Features

-   **Local Storage**: Bugs are stored in a `.bugbook` directory within your project.
-   **Markdown Support**: Bug reports are saved in `bugs.md`, readable on GitHub/GitLab.
-   **Tagging System**: Organize bugs by categories (e.g., specific files, modules, or types of errors).
-   **Search Functionality**: Quickly find past solutions by error message, ID, or content.
-   **Interactive CLI**: Easy-to-use command-line interface with prompts.

## Installation

Currently, Bugbook is designed to be run locally from the source.

1.  Clone the repository:
    ```bash
    git clone https://github.com/Brend-VanDenEynde/bugbook.git
    cd bugbook
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

After linking, you can run the tool directly.

### 1. Initialize

Navigate to your project directory and run:

```bash
bugbook install
```

This creates a `.bugbook` folder where your bugs and tags will be stored.

### 2. Open Bugbook (Interactive)

To open the interactive menu, simply run:

```bash
bugbook
```

### 3. Direct Commands

You can also run commands directly without opening the menu:

```bash
[command]
```

### Commands

| Command | Description |
| :--- | :--- |
| `add` | Report a new bug. You will be prompted for the error message, solution, and tags. |
| `list` | Show the last 5 reported bugs. |
| `search [query]` | Search for bugs by ID or text content. |
| `edit [ID]` | Edit an existing bug's error, solution, or category. |
| `delete [ID]` | Delete a bug by ID. |
| `resolve [ID]` | Toggle a bug's status between Open and Resolved. |
| `tags` | List all available tags and their usage counts. |
| `new-tag` | Create a new tag category. |
| `version` | Show the current version of Bugbook. |
| `help` | Display the help menu. |

### Examples
    
**1. Initialize (First time only):**
```bash
bugbook install
```

**2. Adding a Bug:**
```bash
# Inside of the bugbook cli
add
# Follow the interactive prompts...
```

**3. Searching for a Solution:**
```bash
# Inside of the bugbook cli
search "null pointer"
```

## Contributing

Contributions are welcome! If you have ideas for improvements or new features, feel free to fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Requesta

## License

This project is licensed under the [ISC](https://opensource.org/licenses/ISC) License.
