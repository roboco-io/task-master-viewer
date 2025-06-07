import * as vscode from 'vscode';
import { TaskMasterProvider } from './taskMasterProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Task Master Viewer is now active!');
    vscode.window.showInformationMessage('Task Master Viewer activated!');

    const provider = new TaskMasterProvider(context);
    
    const treeView = vscode.window.createTreeView('taskMasterViewer', {
        treeDataProvider: provider,
        showCollapseAll: true
    });
    
    context.subscriptions.push(treeView);
    
    context.subscriptions.push(
        vscode.commands.registerCommand('task-master-viewer.refreshTasks', () => provider.refresh())
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('task-master-viewer.updateTaskStatus', (task) => {
            provider.updateTaskStatus(task);
        })
    );

    if (vscode.workspace.workspaceFolders) {
        provider.refresh();
    }
}

export function deactivate() {}