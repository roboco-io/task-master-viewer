# Task Master Viewer

A Visual Studio Code extension that provides a graphical interface for viewing and managing Task Master tasks directly within VS Code.

## Features

- **📋 Task Tree View**: Display all Task Master tasks in an organized tree structure within the Explorer sidebar
- **🎯 Visual Status Indicators**: Color-coded icons for different task states:
  - ✅ Completed (green)
  - 🔄 In-progress (blue, animated)
  - ❌ Blocked (red)
  - ⭕ Pending (gray outline)
- **⚡ Priority-based Sorting**: Tasks automatically sorted by priority level (critical → high → medium → low)
- **🔄 Quick Status Updates**: Right-click context menu to change task status instantly
- **🔍 Auto-refresh**: Real-time updates when task files are modified
- **📁 Multi-format Support**: Works with both JSON and Markdown task files

## Requirements

- Visual Studio Code 1.74.0 or higher
- A workspace with Task Master initialized (`.taskmaster` directory present)

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open Quick Open
3. Type `ext install task-master-viewer`
4. Press Enter and click Install

## Usage

1. **Open a Task Master Project**: Open any workspace containing a `.taskmaster` directory
2. **View Tasks**: The "Task Master" panel will appear in the Explorer sidebar
3. **Refresh Tasks**: Click the refresh button (🔄) in the panel header to reload tasks
4. **Update Status**: Right-click any task and select "Update Status" to change its state

## Supported Task Formats

### JSON Format
```json
{
  "id": "task-001",
  "title": "Implement feature X",
  "description": "Detailed description of the task",
  "status": "pending",
  "priority": "high",
  "dependencies": ["task-000"],
  "tags": ["feature", "backend"]
}
```

### Markdown Format
```markdown
# Task Title

Detailed description of the task goes here...

status: pending
priority: medium
tags: frontend, ui
```

## Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Task Master: Refresh Tasks` | Reload all tasks from disk | Click refresh button |
| `Task Master: Update Status` | Change task status | Right-click on task |

## Configuration

This extension currently has no configurable settings. All tasks are automatically loaded from the `.taskmaster` directory in your workspace root.

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-org/task-master-viewer.git
cd task-master-viewer-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
npm run watch
```

### Testing

Press `F5` in VS Code to launch the Extension Development Host with the extension loaded.

## Known Issues

- Currently supports only single workspace folders (multi-root workspaces not yet supported)
- Task files must be located in `.taskmaster` directory at workspace root
- Large numbers of tasks (>1000) may impact performance

## Troubleshooting

**Tasks not appearing?**
- Ensure `.taskmaster` directory exists in your workspace root
- Check that task files have `.json` or `.md` extensions
- Click the refresh button to reload tasks

**Status updates not working?**
- Verify you have write permissions to the task files
- Check VS Code output panel for error messages

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This extension is licensed under the MIT License.

## Release Notes

### 0.0.1

- Initial release of Task Master Viewer
- Basic task viewing functionality
- Status update support
- Priority-based sorting
- Auto-refresh on file changes