"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskMasterProvider = exports.TaskItem = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class TaskItem extends vscode.TreeItem {
    constructor(task, collapsibleState) {
        super(task.title, collapsibleState);
        this.task = task;
        this.collapsibleState = collapsibleState;
        this.tooltip = this.task.description || this.task.title;
        this.description = `[${this.task.status}]${this.task.priority ? ` - ${this.task.priority}` : ''}`;
        this.contextValue = 'task';
        switch (this.task.status) {
            case 'completed':
                this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'in-progress':
                this.iconPath = new vscode.ThemeIcon('sync~spin');
                break;
            case 'blocked':
                this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
    }
}
exports.TaskItem = TaskItem;
class TaskMasterProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.tasks = [];
        this.watchTaskMasterFiles();
    }
    watchTaskMasterFiles() {
        if (vscode.workspace.workspaceFolders) {
            const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], '.taskmaster/**/*');
            this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
            this.watcher.onDidChange(() => this.refresh());
            this.watcher.onDidCreate(() => this.refresh());
            this.watcher.onDidDelete(() => this.refresh());
        }
    }
    refresh() {
        this.loadTasks();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No workspace folder open');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve([]);
        }
        else {
            console.log('getChildren - Total tasks:', this.tasks.length);
            console.log('getChildren - Tasks:', this.tasks);
            return Promise.resolve(this.tasks.map(task => new TaskItem(task, vscode.TreeItemCollapsibleState.None)));
        }
    }
    async loadTasks() {
        this.tasks = [];
        if (!vscode.workspace.workspaceFolders) {
            return;
        }
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const taskMasterDir = path.join(workspaceRoot, '.taskmaster');
        console.log('Loading tasks from:', taskMasterDir);
        vscode.window.showInformationMessage(`Loading tasks from: ${taskMasterDir}`);
        if (!fs.existsSync(taskMasterDir)) {
            console.log('Task Master directory not found:', taskMasterDir);
            return;
        }
        try {
            const taskFiles = await this.findTaskFiles(taskMasterDir);
            console.log('Found task files:', taskFiles);
            for (const file of taskFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf-8');
                    console.log(`Reading file ${file}:`, content.substring(0, 100));
                    const task = this.parseTaskFile(content, file);
                    if (task) {
                        console.log('Parsed task:', task);
                        this.tasks.push(task);
                    }
                }
                catch (error) {
                    console.error(`Error reading task file ${file}:`, error);
                }
            }
            this.tasks.sort((a, b) => {
                const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                const aPriority = priorityOrder[a.priority || 'medium'];
                const bPriority = priorityOrder[b.priority || 'medium'];
                return aPriority - bPriority;
            });
        }
        catch (error) {
            console.error('Error loading tasks:', error);
        }
    }
    async findTaskFiles(dir) {
        const files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await this.findTaskFiles(fullPath));
            }
            else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
                files.push(fullPath);
            }
        }
        return files;
    }
    parseTaskFile(content, filePath) {
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath);
        if (fileExt === '.json') {
            try {
                const data = JSON.parse(content);
                return {
                    id: data.id || fileName,
                    title: data.title || data.name || fileName,
                    description: data.description,
                    status: data.status || 'pending',
                    priority: data.priority,
                    dependencies: data.dependencies,
                    file: filePath
                };
            }
            catch (error) {
                console.error('Error parsing JSON task file:', error);
            }
        }
        else if (fileExt === '.md') {
            const lines = content.split('\n');
            const task = {
                id: fileName,
                title: fileName.replace('.md', ''),
                status: 'pending',
                file: filePath
            };
            for (const line of lines) {
                if (line.startsWith('# ')) {
                    task.title = line.substring(2).trim();
                }
                else if (line.toLowerCase().includes('status:')) {
                    const status = line.split(':')[1].trim().toLowerCase();
                    if (['pending', 'in-progress', 'completed', 'blocked'].includes(status)) {
                        task.status = status;
                    }
                }
                else if (line.toLowerCase().includes('priority:')) {
                    const priority = line.split(':')[1].trim().toLowerCase();
                    if (['low', 'medium', 'high', 'critical'].includes(priority)) {
                        task.priority = priority;
                    }
                }
            }
            return task;
        }
        return null;
    }
    async updateTaskStatus(item) {
        const task = item.task;
        const statusOptions = ['pending', 'in-progress', 'completed', 'blocked'];
        const newStatus = await vscode.window.showQuickPick(statusOptions, {
            placeHolder: `Current status: ${task.status}`,
            title: 'Update Task Status'
        });
        if (newStatus && task.file) {
            try {
                let content = fs.readFileSync(task.file, 'utf-8');
                if (task.file.endsWith('.json')) {
                    const data = JSON.parse(content);
                    data.status = newStatus;
                    content = JSON.stringify(data, null, 2);
                }
                else if (task.file.endsWith('.md')) {
                    const statusRegex = /status:\s*\w+/i;
                    if (statusRegex.test(content)) {
                        content = content.replace(statusRegex, `status: ${newStatus}`);
                    }
                    else {
                        content = content + `\n\nstatus: ${newStatus}`;
                    }
                }
                fs.writeFileSync(task.file, content);
                vscode.window.showInformationMessage(`Task status updated to: ${newStatus}`);
                this.refresh();
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to update task status: ${error}`);
            }
        }
    }
    dispose() {
        if (this.watcher) {
            this.watcher.dispose();
        }
    }
}
exports.TaskMasterProvider = TaskMasterProvider;
//# sourceMappingURL=taskMasterProvider.js.map