# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build & Compile:**
- `npm run compile` - Compile TypeScript to JavaScript in `out/` directory
- `npm run watch` - Compile in watch mode for development

**Quality Assurance:**
- `npm run lint` - Run ESLint on source files
- `npm run pretest` - Run both compile and lint before testing
- `npm test` - Run the extension test suite

**Development:**
- Press `F5` in VS Code to launch Extension Development Host with the extension loaded

## Architecture Overview

This is a Visual Studio Code extension that provides a tree view for Task Master tasks. The extension follows VS Code's standard extension architecture:

**Core Components:**
- `src/extension.ts` - Main entry point that activates the extension and registers commands
- `src/taskMasterProvider.ts` - Tree data provider that manages task loading, parsing, and display

**Key Patterns:**
- **Tree Data Provider Pattern**: Uses VS Code's `vscode.TreeDataProvider` interface to display tasks in Explorer sidebar
- **File System Watching**: Automatically refreshes when `.taskmaster` directory files change
- **Multi-format Support**: Parses both JSON and Markdown task files with different structures

**Task File Discovery:**
- Recursively scans `.taskmaster` directory in workspace root
- Supports `.json` and `.md` files
- Excludes common config files (`config.json`, `settings.json`, etc.)
- Skips directories named `config`, `settings`, `.git`

**Task Status & Icons:**
- `completed` - Green pass icon
- `in-progress` - Blue spinning sync icon  
- `blocked` - Red error icon
- `pending` - Gray circle outline icon

**Command Registration:**
- `task-master-viewer.refreshTasks` - Manually refresh task list
- `task-master-viewer.updateTaskStatus` - Change task status via quick pick

## Project Structure

- `src/` - TypeScript source files
- `out/` - Compiled JavaScript output
- `package.json` - Extension manifest with contributions and commands
- `tsconfig.json` - TypeScript configuration targeting ES2020

## Extension Specific Notes

- Extension activates on `onView:taskMasterViewer` event
- Requires workspace with `.taskmaster` directory to function
- Tasks are sorted by priority: critical → high → medium → low
- Context menu allows status updates for individual tasks
- File watcher automatically updates tree when task files change

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run compile` or `npm run watch`
3. Use `F5` to test in Extension Development Host
4. Run `npm run lint` before committing changes