# GitHub Integration Guide

**Bugbook** now supports seamless integration with GitHub Issues, allowing you to sync your local bug reports directly to your GitHub repository. This feature bridges the gap between local development tracking and team-wide issue management.

## Overview

The GitHub integration allows you to:
- Authenticate with GitHub using a Personal Access Token
- Automatically detect your GitHub repository from git configuration
- Push bugs from Bugbook to GitHub Issues with one command
- Maintain bidirectional linking between local bugs and GitHub issues
- Track sync status and pending bugs
- Preserve all bug metadata (priority, category, files, solution) in GitHub

## Quick Start

### 1. Authenticate with GitHub

First, you need to set up GitHub authentication:

```bash
bugbook github auth
```

This will prompt you to enter your GitHub Personal Access Token. The token is validated and stored securely in your global configuration.

**Creating a GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Bugbook CLI")
4. **Select the `repo` scope** (full control of private repositories)
   - ⚠️ **IMPORTANT**: You MUST select the full **`repo`** scope
   - This is required for both public AND private repositories
   - Do NOT select only `public_repo` - it will cause 404 errors on private repos
   - The `repo` scope includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
5. **Verify the following repository permissions are enabled:**
   - ✅ **Read access to metadata** (automatically included)
   - ✅ **Read and Write access to issues** (required to create/update issues)
6. Set expiration (90 days recommended for security)
7. Click "Generate token"
8. Copy the token immediately (you won't be able to see it again)

**Required Token Settings Summary:**

When creating your token, ensure these settings:
- **Scopes**: `repo` (checked)
- **Repository permissions**:
  - Metadata: Read access ✓
  - Issues: Read and Write access ✓

These permissions are automatically included when you select the `repo` scope.

**Non-interactive authentication:**
```bash
bugbook github auth --token ghp_xxxxxxxxxxxx
```

### 2. Check Status

View your GitHub integration status and pending bugs:

```bash
bugbook github status
```

This shows:
- Authentication status (whether your token is valid)
- Configured repository
- Number of open bugs
- Number of bugs already synced to GitHub
- Number of bugs pending sync
- List of pending bugs (up to 5 most recent)

### 3. Push Bugs to GitHub

Push your bugs to GitHub Issues:

```bash
bugbook github push
```

This will:
1. Show you how many bugs will be pushed
2. Ask for confirmation
3. Create GitHub issues for each bug
4. Link the local bug to the GitHub issue
5. Display success/failure for each bug

## Commands

### `bugbook github auth`

Authenticate with GitHub and optionally detect your repository.

**Usage:**
```bash
# Interactive prompt
bugbook github auth

# Non-interactive with token
bugbook github auth --token ghp_xxxxxxxxxxxx
```

**What it does:**
- Validates your GitHub Personal Access Token
- Saves the token to global config (`~/.bugbook/config.json`)
- Attempts to detect repository from `.git/config`
- Saves detected owner and repo to config

### `bugbook github status`

Display GitHub integration status and sync statistics.

**Usage:**
```bash
bugbook github status
```

**Output includes:**
- ✓ Authentication status (valid/invalid)
- ✓ Repository configuration (owner/repo)
- Open bugs count
- Synced bugs count
- Pending bugs (not yet pushed to GitHub)
- List of pending bugs with IDs

### `bugbook github push`

Push bugs to GitHub Issues.

**Usage:**
```bash
# Push all unsynced bugs
bugbook github push

# Push specific bug(s) by ID
bugbook github push A1B2C3D4
bugbook github push A1B2C3D4 B2C3D4E5

# Dry run (see what would be pushed without pushing)
bugbook github push --dry-run

# Force push (re-push already synced bugs)
bugbook github push --force

# Combine flags
bugbook github push A1B2C3D4 --force
```

**Flags:**
- `--dry-run` - Show what would be pushed without actually creating issues
- `--force` - Push bugs even if they've already been synced to GitHub

**Behavior:**
- Only pushes bugs with status "Open" by default
- Skips bugs that already have a `github_issue_number` (unless `--force`)
- Shows confirmation prompt before pushing
- Updates each bug with GitHub issue number and URL
- Displays results with success/failure count

## How It Works

### Bug to Issue Conversion

When a bug is pushed to GitHub, it's converted to a well-formatted issue:

**Issue Title:** First line of the error message (up to 256 characters)

**Issue Body:**
```markdown
## Error
[Full error message from bug]

## Solution
[Solution if provided]

## Related Files
- `path/to/file1.js`
- `path/to/file2.ts`

## Metadata
- **BugBook ID**: A1B2C3D4
- **Category**: authentication
- **Priority**: High
- **Author**: Your Name
- **Due Date**: 2025-03-15
- **Created**: 2025-01-15T10:30:00.000Z

---
*Created from [BugBook](https://github.com/Brend-VanDenEynde/bugbook)*
```

**Labels:**
- Category label (e.g., `authentication`)
- Priority label (e.g., `priority:high`, `priority:medium`, `priority:low`)

### Bidirectional Linking

After pushing, each bug is updated with:
- `github_issue_number` - The issue number on GitHub
- `github_issue_url` - Direct URL to the issue
- `last_synced` - Timestamp of last sync

You can view these details when listing or searching bugs.

### Repository Detection

Bugbook automatically detects your GitHub repository by reading `.git/config` and looking for:
- HTTPS remotes: `https://github.com/owner/repo.git`
- SSH remotes: `git@github.com:owner/repo.git`

If detection fails or you're not in a git repository, you can set it manually:
```bash
bugbook config github.owner <username>
bugbook config github.repo <repo-name>
```

## Configuration

GitHub settings are stored in your global config (`~/.bugbook/config.json`):

```json
{
  "github": {
    "token": "ghp_xxxxxxxxxxxx",
    "owner": "yourusername",
    "repo": "yourrepo",
    "auto_labels": true,
    "label_prefix": "bug:"
  }
}
```

**Configuration options:**

| Key | Description | Default |
|-----|-------------|---------|
| `github.token` | GitHub Personal Access Token | - |
| `github.owner` | Repository owner (username or org) | - |
| `github.repo` | Repository name | - |
| `github.auto_labels` | Automatically add category and priority labels | `true` |
| `github.label_prefix` | Prefix for bug labels (reserved for future use) | `"bug:"` |

**Viewing configuration:**
```bash
bugbook config github.token
bugbook config github.owner
bugbook config github.repo
```

**Setting configuration:**
```bash
bugbook config github.owner myusername
bugbook config github.repo myproject
bugbook config github.auto_labels false
```

## Workflow Examples

### First-Time Setup

```bash
# 1. Initialize bugbook in your project
cd my-project
bugbook init

# 2. Authenticate with GitHub
bugbook github auth

# 3. Add some bugs
bugbook add

# 4. Push to GitHub
bugbook github push
```

### Daily Workflow

```bash
# Add a new bug during development
bugbook add

# Check what needs to be synced
bugbook github status

# Push new bugs to GitHub
bugbook github push

# View issues on GitHub
# Visit: https://github.com/owner/repo/issues
```

### Sync Specific Bugs

```bash
# Add multiple bugs
bugbook add
bugbook add
bugbook add

# List bugs to get their IDs
bugbook list

# Push only specific bugs
bugbook github push A1B2C3D4 B2C3D4E5
```

### Re-push After Editing

```bash
# Edit a bug locally
bugbook edit A1B2C3D4

# Re-push to GitHub (update the issue)
bugbook github push A1B2C3D4 --force
```

## Security & Privacy

- **Token Storage**: GitHub tokens are stored in `~/.bugbook/config.json` with file system permissions
- **Token Validation**: Tokens are validated before being saved
- **Scope Requirements**: Only `repo` scope is needed (read/write access to repositories)
- **Local First**: All data remains local; GitHub sync is optional and explicit

**Best Practices:**
- Use a dedicated token for Bugbook (makes revocation easier)
- Don't share your token or commit config files with tokens
- Regenerate tokens periodically
- Revoke tokens you're no longer using

## Troubleshooting

### "Invalid GitHub token" error

**Problem:** Token validation fails

**Solutions:**
1. Ensure token starts with `ghp_` or `github_pat_`
2. Verify the token has `repo` scope
3. Check if token has expired
4. Generate a new token and re-authenticate

### "Repository not configured" error

**Problem:** Owner/repo not detected or set

**Solutions:**
1. Run `bugbook github auth` from within a git repository
2. Manually set owner and repo:
   ```bash
   bugbook config github.owner myusername
   bugbook config github.repo myrepo
   ```
3. Verify git remote is pointing to GitHub:
   ```bash
   git remote -v
   ```

### "404 Not Found" error when pushing

**Problem:** `GitHub API error: 404 - {"message":"Not Found",...}`

This is the **most common error** and usually means wrong token permissions.

**Solutions:**

1. **Check if repository is private:**
   - Private repositories require the full `repo` scope
   - `public_repo` scope only works for public repositories

2. **Verify token scope and permissions:**
   ```bash
   # Go to https://github.com/settings/tokens
   # Check your token has:
   # - Full "repo" scope checked
   # - Read access to metadata
   # - Read and Write access to issues
   ```

3. **Create new token with correct scope:**
   - Go to https://github.com/settings/tokens/new
   - Select the **full `repo` scope** (not just `public_repo`)
   - Verify these repository permissions are enabled:
     - ✅ Read access to metadata
     - ✅ Read and Write access to issues
   - Re-authenticate: `bugbook github auth --token YOUR_NEW_TOKEN`

4. **Verify repository exists:**
   ```bash
   # Check the URL works
   git remote -v
   ```

5. **Confirm you have write access:**
   - You must be the owner or have write permissions to create issues

**Quick fix:**
```bash
# Revoke old token and create new one with repo scope
bugbook github auth
# Follow the prompts and use new token
bugbook github push
```

### "No bugs to push" message

**Possible reasons:**
- All bugs are already synced (use `--force` to re-push)
- No bugs with status "Open" (resolved bugs aren't pushed)
- No bugs exist (use `bugbook add` first)

**Check status:**
```bash
bugbook github status
bugbook list
```

### Rate Limiting

GitHub API has rate limits:
- **Authenticated requests**: 5,000 per hour
- **Unauthenticated**: 60 per hour (not applicable here)

Bugbook makes 1 API call per bug pushed, so you're unlikely to hit limits during normal use.

### Permission Errors

If you get permission errors when creating issues:
1. Verify token has `repo` scope
2. Confirm you have write access to the repository
3. Check repository isn't archived or read-only

## Future Enhancements

Potential features under consideration:
- **Pull from GitHub**: Import GitHub issues as bugs
- **Two-way sync**: Update bugs when issues are modified
- **Bulk operations**: Close multiple issues at once
- **Custom templates**: Define issue body format
- **Labels management**: Auto-create labels if they don't exist
- **Assignees**: Assign issues to team members
- **Milestones**: Link bugs to GitHub milestones

## API Reference

The GitHub integration is built on the native Node.js `https` module and uses GitHub's REST API v3.

**Endpoints used:**
- `GET /user` - Verify token
- `POST /repos/{owner}/{repo}/issues` - Create issue
- `PATCH /repos/{owner}/{repo}/issues/{number}` - Update issue
- `GET /repos/{owner}/{repo}/issues` - List issues

**Documentation:**
- [GitHub REST API](https://docs.github.com/en/rest)
- [Creating Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## Contributing

Found a bug in the GitHub integration? Have ideas for improvements?

1. Report issues at: https://github.com/Brend-VanDenEynde/bugbook/issues
2. Submit pull requests with enhancements
3. Share your workflow and use cases

---

**Need Help?**
- Run `bugbook github help` for command summary
- Run `bugbook help` for general commands
- Check the [main README](./README.md) for installation and setup
