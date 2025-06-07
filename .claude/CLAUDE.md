# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Task Master Viewer is a VS Code extension that provides a GUI for viewing and managing Task Master tasks. It displays tasks from the `.taskmaster` directory in a tree view within VS Code's Explorer sidebar.

## Project Structure

```
task-master-viewer/
├── src/
│   ├── extension.ts          # Main extension entry point
│   └── taskMasterProvider.ts # TreeDataProvider implementation
├── package.json             # Extension manifest and dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Extension documentation
```

## Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linter
npm run lint

# Test the extension
# Press F5 in VS Code to launch Extension Development Host
```

## Architecture

### Key Components

1. **TaskMasterProvider**: Implements `vscode.TreeDataProvider` to display tasks in tree view
   - Watches `.taskmaster` directory for changes
   - Parses both JSON and Markdown task files
   - Sorts tasks by priority
   - Handles task status updates

2. **TaskItem**: Tree item representation with status-based icons
   - Completed: ✓ (green)
   - In-progress: 🔄 (spinning)
   - Blocked: ❌ (red)
   - Pending: ○ (outline)

### Task File Formats

The extension supports two task file formats:

**JSON Format:**
```json
{
  "id": "task-001",
  "title": "Task Title",
  "status": "pending|in-progress|completed|blocked",
  "priority": "low|medium|high|critical"
}
```

**Markdown Format:**
```markdown
# Task Title
status: pending
priority: high
```

## Extension Features

- TreeView in Explorer sidebar showing all tasks
- Auto-refresh when task files change
- Right-click context menu to update task status
- Priority-based sorting
- Visual status indicators with themed icons