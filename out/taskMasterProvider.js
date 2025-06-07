"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskMasterProvider = exports.TaskItem = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class TaskItem extends vscode.TreeItem {
    constructor(task, collapsibleState, isSubtask = false) {
        super(`${task.id}. ${task.title}`, collapsibleState);
        this.task = task;
        this.collapsibleState = collapsibleState;
        this.isSubtask = isSubtask;
        this.tooltip = this.task.description || this.task.title;
        this.description = `[${this.task.status}]${this.task.priority ? ` - ${this.task.priority}` : ''}`;
        this.contextValue = 'task';
        // Add click command to open task file
        const taskFileName = `task_${String(this.task.id).padStart(3, '0')}.txt`;
        this.command = {
            command: 'task-master-viewer.openTaskFile',
            title: 'Open Task File',
            arguments: [this.task.id, taskFileName]
        };
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
        this.currentSortOrder = 'id';
        this.loadTasks();
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
    setSortOrder(sortOrder) {
        this.currentSortOrder = sortOrder;
        this.sortTasks();
        this._onDidChangeTreeData.fire();
    }
    getSortOrder() {
        return this.currentSortOrder;
    }
    sortTasks() {
        this.tasks.sort((a, b) => this.compareTasksBySortOrder(a, b));
        // Also sort subtasks
        this.tasks.forEach(task => {
            if (task.subtasks) {
                task.subtasks.sort((a, b) => this.compareTasksBySortOrder(a, b));
            }
        });
    }
    compareTasksBySortOrder(a, b) {
        switch (this.currentSortOrder) {
            case 'id':
                const aId = parseInt(a.id.toString());
                const bId = parseInt(b.id.toString());
                return aId - bId;
            case 'priority':
                const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                const aPriority = priorityOrder[a.priority || 'medium'];
                const bPriority = priorityOrder[b.priority || 'medium'];
                return aPriority - bPriority;
            case 'status':
                const statusOrder = { 'in-progress': 0, 'pending': 1, 'blocked': 2, 'completed': 3 };
                const aStatus = statusOrder[a.status || 'pending'];
                const bStatus = statusOrder[b.status || 'pending'];
                return aStatus - bStatus;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
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
            // Return subtasks if this element has them
            if (element.task.subtasks && element.task.subtasks.length > 0) {
                return Promise.resolve(element.task.subtasks.map(subtask => new TaskItem(subtask, subtask.subtasks && subtask.subtasks.length > 0
                    ? vscode.TreeItemCollapsibleState.Collapsed
                    : vscode.TreeItemCollapsibleState.None, true // isSubtask
                )));
            }
            return Promise.resolve([]);
        }
        else {
            console.log('getChildren - Total tasks:', this.tasks.length);
            console.log('getChildren - Tasks:', this.tasks);
            return Promise.resolve(this.tasks.map(task => new TaskItem(task, task.subtasks && task.subtasks.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None)));
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
                    // Handle tasks.json file specially
                    if (path.basename(file) === 'tasks.json') {
                        const tasksData = JSON.parse(content);
                        if (Array.isArray(tasksData.tasks)) {
                            console.log(`Processing tasks.json with ${tasksData.tasks.length} tasks`);
                            tasksData.tasks.forEach((taskData) => {
                                const task = this.parseTaskData(taskData, file);
                                if (task) {
                                    console.log('Parsed task from tasks.json:', task);
                                    this.tasks.push(task);
                                }
                            });
                        }
                    }
                    else {
                        const task = this.parseTaskFile(content, file);
                        if (task) {
                            console.log('Parsed task:', task);
                            this.tasks.push(task);
                        }
                    }
                }
                catch (error) {
                    console.error(`Error reading task file ${file}:`, error);
                }
            }
            this.sortTasks();
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
                // Skip directories named 'config' or 'settings'
                if (!['config', 'settings', '.git'].includes(entry.name)) {
                    files.push(...await this.findTaskFiles(fullPath));
                }
            }
            else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
                // Skip common configuration files (but include tasks.json)
                const skipFiles = ['config.json', 'settings.json', '.taskmaster.json', 'README.md'];
                if (!skipFiles.includes(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
        return files;
    }
    parseTaskData(taskData, filePath) {
        try {
            const task = {
                id: taskData.id?.toString() || 'unknown',
                title: taskData.title || 'Untitled Task',
                description: taskData.description || taskData.details,
                status: (taskData.status || 'pending').toLowerCase(),
                priority: taskData.priority?.toLowerCase(),
                dependencies: taskData.dependencies,
                file: filePath
            };
            // Parse subtasks if they exist
            if (Array.isArray(taskData.subtasks) && taskData.subtasks.length > 0) {
                task.subtasks = taskData.subtasks.map((subtaskData) => this.parseTaskData(subtaskData, filePath)).filter((subtask) => subtask !== null);
            }
            return task;
        }
        catch (error) {
            console.error('Error parsing task data:', error);
            return null;
        }
    }
    parseTaskFile(content, filePath) {
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath);
        if (fileExt === '.json') {
            try {
                const data = JSON.parse(content);
                // Check if this is actually a task file (has required fields)
                if (!data.title && !data.name && !data.task) {
                    console.log(`Skipping non-task JSON file: ${fileName}`);
                    return null;
                }
                // Handle different JSON structures
                let taskData = data;
                // If the JSON has a 'task' property, use that
                if (data.task && typeof data.task === 'object') {
                    taskData = data.task;
                }
                // If the JSON has 'tasks' array, skip it (it's a collection file)
                if (Array.isArray(data.tasks)) {
                    console.log(`Skipping tasks collection file: ${fileName}`);
                    return null;
                }
                return {
                    id: taskData.id || fileName.replace('.json', ''),
                    title: taskData.title || taskData.name || fileName.replace('.json', ''),
                    description: taskData.description || taskData.details,
                    status: (taskData.status || 'pending').toLowerCase(),
                    priority: taskData.priority?.toLowerCase(),
                    dependencies: taskData.dependencies || taskData.depends_on,
                    file: filePath
                };
            }
            catch (error) {
                console.error(`Error parsing JSON task file ${fileName}:`, error);
                return null;
            }
        }
        else if (fileExt === '.md') {
            const lines = content.split('\n');
            const task = {
                id: fileName.replace('.md', ''),
                title: fileName.replace('.md', ''),
                status: 'pending',
                file: filePath
            };
            // Parse markdown content
            let inDescription = false;
            let description = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('# ')) {
                    task.title = line.substring(2).trim();
                    inDescription = true;
                }
                else if (line.toLowerCase().startsWith('status:')) {
                    const status = line.substring(7).trim().toLowerCase();
                    if (['pending', 'in-progress', 'completed', 'blocked'].includes(status)) {
                        task.status = status;
                    }
                    inDescription = false;
                }
                else if (line.toLowerCase().startsWith('priority:')) {
                    const priority = line.substring(9).trim().toLowerCase();
                    if (['low', 'medium', 'high', 'critical'].includes(priority)) {
                        task.priority = priority;
                    }
                    inDescription = false;
                }
                else if (line.toLowerCase().startsWith('id:')) {
                    task.id = line.substring(3).trim();
                    inDescription = false;
                }
                else if (inDescription && line.trim() && !line.startsWith('#')) {
                    description.push(line.trim());
                }
            }
            if (description.length > 0) {
                task.description = description.join(' ').substring(0, 100);
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