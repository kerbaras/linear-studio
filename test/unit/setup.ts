import { vi } from 'vitest';

// Mock VS Code API (not available in unit tests)
vi.mock('vscode', () => {
    // EventEmitter class that properly mimics VS Code's EventEmitter
    class MockEventEmitter<T = any> {
        private listeners: ((data: T) => void)[] = [];
        
        // The event property is a function that registers listeners
        event = (listener: (data: T) => void) => {
            this.listeners.push(listener);
            return { dispose: () => {
                const idx = this.listeners.indexOf(listener);
                if (idx >= 0) this.listeners.splice(idx, 1);
            }};
        };
        
        fire(data: T) {
            this.listeners.forEach(l => l(data));
        }
        
        dispose() {
            this.listeners = [];
        }
    }

    return {
        window: {
            showInformationMessage: vi.fn(),
            showErrorMessage: vi.fn(),
            showWarningMessage: vi.fn(),
            showInputBox: vi.fn(),
            showQuickPick: vi.fn(),
            createTreeView: vi.fn(() => ({ 
                dispose: vi.fn(),
                reveal: vi.fn(),
            })),
            createWebviewPanel: vi.fn(() => ({
                webview: {
                    html: '',
                    options: {},
                    onDidReceiveMessage: vi.fn((handler) => ({ dispose: vi.fn() })),
                    postMessage: vi.fn().mockResolvedValue(true),
                    asWebviewUri: vi.fn((uri) => uri),
                    cspSource: 'vscode-webview://test',
                },
                reveal: vi.fn(),
                dispose: vi.fn(),
                onDidDispose: vi.fn((callback) => ({ dispose: vi.fn() })),
                title: '',
            })),
            activeTextEditor: undefined,
        },
        workspace: {
            getConfiguration: vi.fn(() => ({
                get: vi.fn(),
                update: vi.fn(),
            })),
            onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
            workspaceFolders: [],
        },
        commands: {
            registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
            executeCommand: vi.fn(),
            getCommands: vi.fn().mockResolvedValue([]),
        },
        EventEmitter: MockEventEmitter,
        ThemeIcon: class ThemeIcon {
            constructor(public id: string, public color?: unknown) {}
        },
        ThemeColor: class ThemeColor {
            constructor(public id: string) {}
        },
        TreeItem: class TreeItem {
            label?: string;
            description?: string;
            id?: string;
            tooltip?: unknown;
            iconPath?: unknown;
            command?: unknown;
            contextValue?: string;
            collapsibleState?: number;
            
            constructor(label: string, collapsibleState?: number) {
                this.label = label;
                this.collapsibleState = collapsibleState;
            }
        },
        TreeItemCollapsibleState: { 
            None: 0, 
            Collapsed: 1, 
            Expanded: 2 
        },
        Uri: {
            parse: vi.fn((s) => ({ 
                toString: () => s, 
                fsPath: s,
                scheme: 'https',
            })),
            joinPath: vi.fn((base, ...paths) => ({ 
                toString: () => `${base.fsPath || base}/${paths.join('/')}`,
                fsPath: `${base.fsPath || base}/${paths.join('/')}`,
            })),
            file: vi.fn((path) => ({
                toString: () => path,
                fsPath: path,
                scheme: 'file',
            })),
        },
        env: {
            clipboard: { 
                writeText: vi.fn().mockResolvedValue(undefined),
                readText: vi.fn().mockResolvedValue(''),
            },
            openExternal: vi.fn().mockResolvedValue(true),
        },
        extensions: {
            getExtension: vi.fn(),
        },
        ViewColumn: { 
            One: 1, 
            Two: 2, 
            Three: 3,
            Active: -1,
            Beside: -2,
        },
        MarkdownString: class MarkdownString {
            value: string;
            isTrusted?: boolean;
            supportHtml?: boolean;
            
            constructor(value: string = '') {
                this.value = value;
            }
            
            appendMarkdown(value: string) {
                this.value += value;
                return this;
            }
            
            appendText(value: string) {
                this.value += value;
                return this;
            }
        },
        Disposable: {
            from: (...disposables: unknown[]) => ({
                dispose: () => disposables.forEach((d: any) => d?.dispose?.()),
            }),
        },
        SecretStorage: class SecretStorage {
            private secrets = new Map<string, string>();
            
            get(key: string) {
                return Promise.resolve(this.secrets.get(key));
            }
            
            store(key: string, value: string) {
                this.secrets.set(key, value);
                return Promise.resolve();
            }
            
            delete(key: string) {
                this.secrets.delete(key);
                return Promise.resolve();
            }
        },
    };
});

// Mock Linear SDK
vi.mock('@linear/sdk', () => ({
    LinearClient: vi.fn(() => ({
        viewer: Promise.resolve({
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            assignedIssues: vi.fn(),
        }),
        issue: vi.fn(),
        cycles: vi.fn(),
        projects: vi.fn(),
    })),
}));
