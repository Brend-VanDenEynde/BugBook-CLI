# Changelog

All notable changes to Bugbook will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-09

### Added
- Initial release
- `add` command - Add new bug entries with category tags
- `list` command - Show the last 5 bugs
- `search` command - Fuzzy search bugs by ID or text
- `edit` command - Edit existing bug entries
- `delete` command - Delete bugs with confirmation
- `resolve` command - Toggle Open/Resolved status
- `stats` command - Display bug statistics
- `tags` command - List all tags with usage counts
- `new-tag` command - Create new category tags
- `version` command - Show version info
- `help` command - Display available commands
- `install` command - Initialize Bugbook in a directory
- Interactive REPL mode when run without arguments

### Security
- Input sanitization to prevent markdown injection
- Path validation to prevent system directory access
- Status field validation
- Input length limits (2000 characters max)
- Tag name validation (alphanumeric, spaces, hyphens only)
