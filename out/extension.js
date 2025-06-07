"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskMasterProvider_1 = require("./taskMasterProvider");
function activate(context) {
    console.log('Task Master Viewer is now active!');
    vscode.window.showInformationMessage('Task Master Viewer activated!');
    const provider = new taskMasterProvider_1.TaskMasterProvider(context);
    const treeView = vscode.window.createTreeView('taskMasterViewer', {
        treeDataProvider: provider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);
    context.subscriptions.push(vscode.commands.registerCommand('task-master-viewer.refreshTasks', () => provider.refresh()));
    context.subscriptions.push(vscode.commands.registerCommand('task-master-viewer.updateTaskStatus', (task) => {
        provider.updateTaskStatus(task);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('task-master-viewer.openTaskFile', async (taskId, fileName) => {
        if (vscode.workspace.workspaceFolders) {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const taskFilePath = vscode.Uri.file(`${workspaceRoot}/.taskmaster/tasks/${fileName}`);
            try {
                const document = await vscode.workspace.openTextDocument(taskFilePath);
                await vscode.window.showTextDocument(document);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Could not open task file: ${fileName}`);
                console.error('Error opening task file:', error);
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('task-master-viewer.sortTasks', async () => {
        const currentSort = provider.getSortOrder();
        const sortOptions = [
            { label: '📋 ID (Task Number)', value: 'id', description: currentSort === 'id' ? 'Currently selected' : '' },
            { label: '🔥 Priority', value: 'priority', description: currentSort === 'priority' ? 'Currently selected' : '' },
            { label: '📊 Status', value: 'status', description: currentSort === 'status' ? 'Currently selected' : '' },
            { label: '🔤 Title', value: 'title', description: currentSort === 'title' ? 'Currently selected' : '' }
        ];
        const selected = await vscode.window.showQuickPick(sortOptions, {
            placeHolder: 'Select task sorting order',
            title: 'Task Master: Sort Tasks'
        });
        if (selected) {
            provider.setSortOrder(selected.value);
            vscode.window.showInformationMessage(`Tasks sorted by ${selected.label.replace(/[📋🔥📊🔤] /, '')}`);
        }
    }));
    if (vscode.workspace.workspaceFolders) {
        provider.refresh();
    }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map