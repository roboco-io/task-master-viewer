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
    if (vscode.workspace.workspaceFolders) {
        provider.refresh();
    }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map