# Changelog

All notable changes to this project will be documented in this file.

## [0.4.2] - 2026-02-10

### Improved
- **Lazy initialization**: `validateCwd()` no longer runs on module import — paths are computed on first access via getter functions (`getBugDirPath()`, `getBugsDirPath()`, `getTagsPath()`). Improves testability.
- **Consistent bug IDs**: All bug IDs are now normalized to uppercase consistently in `saveBug()`, `deleteBug()`, and `getBugById()`.
- **Clearer API**: Renamed `validateFilePaths()` → `warnMissingFiles()` to accurately reflect its behavior (warns but always returns all paths). Old name available as deprecated alias.
- **No more process.exit()**: Removed all `process.exit()` calls from `install.ts` — the command handler now returns naturally.

## [0.4.1] - 2026-02-10

### Fixed
- **Corrupt file resilience**: `getBugs()` now catches parse errors per file instead of failing on all bugs when one file is corrupt.
- **Performance**: `addComment()` now reads a single bug file directly via new `getBugById()` helper instead of loading all bugs from disk.
- **Performance**: `migrateIfNeeded()` result is now cached — migration checks only run once per process.
- **Comment command**: Eliminated redundant double bug lookup (was reading all bugs twice).
- Removed unused `readdirSync`/`statSync` imports and unused loop variable.

## [0.4.0] - 2026-02-10

### Added
- **Comment System**: New `bugbook comment <id>` command to add timestamped notes to bugs without editing them. Supports editor mode.
- **Due Dates**: Bugs can now have optional due dates (`YYYY-MM-DD`) set during `add` or changed via `edit`.
- **Deadline Warnings**: `list` command shows overdue bug warnings. `stats` command displays overdue count.
- **Enhanced Export**: Markdown export now includes due dates and comments.

## [0.3.0] - 2026-02-10

### Added
- **Configurable Editor**: Users can now set their preferred editor (VS Code, Vim, Nano, etc.) using `bugbook config editor "cmd"`.
- **Interactive Install**: `bugbook install` now prompts for user name and editor preference if not set.
- **Richer Search**: Search now includes `priority` and `relatedFiles`.
- **File Validation**: `add` and `edit` commands warn if related files do not exist.
- **Improved Testing**: Added integration tests for commands and file validation logic.

## [0.2.0] - 2026-02-10

### Added
- **Global Configuration**: New `config` command to set user details (name, email) which are automatically attached to new bugs.
- **Richer Data**: Bugs now support `priority` levels (High, Medium, Low) and related `files`.
- **Export**: New `export` command to generate a Markdown report (`BUGS.md`) of all bugs.
- **External Editor**: The `add` command now opens your default editor for entering error messages and solutions, making it easier to paste large blocks of text or code.
- **Tags Management**: Enhanced tag management including creating new tags on the fly.

### Changed
- **Storage Engine**: Refactored storage to use individual JSON files for each bug (`.bugbook/bugs/BUG-ID.json`). This significantly reduces git merge conflicts when working in teams.
- **Migration**: Automatic migration system that converts existing `bugs.json` and `bugs.md` files to the new individual file format.
- **CLI Interface**: improved prompts and colors for better readability.

### Fixed
- Fixed issues with legacy file parsing.
- Improved error handling during file operations.

## [0.1.0] - Initial Release
- Basic bug tracking functionalities: add, list, delete, edit, resolve.
- Search capabilities (fuzzy search).
- Tagging system.
