import * as vscode from 'vscode';
import { IssueService, IssueFilter } from '../../linear/issueService';
import { IssueDTO } from '../../linear/types';
import { Commands } from '../../constants';

type TreeNode = CycleNode | IssueNode;

export class IssuesTreeProvider implements vscode.TreeDataProvider<TreeNode> {
    // EventEmitter pattern for refresh (like atlascode)
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    private _filter: IssueFilter = {};
    
    constructor(private readonly issueService: IssueService) {}
    
    refresh(clearCache = false): void {
        if (clearCache) {
            this.issueService.clearCache();
        }
        this._onDidChangeTreeData.fire(undefined);
    }
    
    setFilter(filter: IssueFilter): void {
        this._filter = filter;
        this.refresh(true);
    }
    
    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (!element) {
            // Root level: fetch and group issues
            try {
                const issues = await this.issueService.getMyAssignedIssues(this._filter);
                
                if (issues.length === 0) {
                    return []; // Empty state handled by viewsWelcome
                }
                
                return this.groupIssuesByCycle(issues);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Failed to fetch issues: ${message}`);
                return [];
            }
        }
        
        if (element instanceof CycleNode) {
            return element.children;
        }
        
        return [];
    }
    
    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }
    
    private groupIssuesByCycle(issues: IssueDTO[]): TreeNode[] {
        const cycleMap = new Map<string, { name: string; dateRange?: string; issues: IssueDTO[] }>();
        const noCycle: IssueDTO[] = [];
        
        for (const issue of issues) {
            if (issue.cycle) {
                const existing = cycleMap.get(issue.cycle.id);
                if (existing) {
                    existing.issues.push(issue);
                } else {
                    cycleMap.set(issue.cycle.id, {
                        name: issue.cycle.name,
                        dateRange: this.formatDateRange(issue.cycle.startsAt, issue.cycle.endsAt),
                        issues: [issue],
                    });
                }
            } else {
                noCycle.push(issue);
            }
        }
        
        const nodes: TreeNode[] = [];
        
        // Active cycles first, sorted by name
        const sortedCycles = [...cycleMap.entries()].sort((a, b) => 
            a[1].name.localeCompare(b[1].name)
        );
        
        for (const [cycleId, { name, dateRange, issues: cycleIssues }] of sortedCycles) {
            const issueNodes = cycleIssues.map(i => new IssueNode(i));
            nodes.push(new CycleNode(cycleId, name, dateRange, issueNodes));
        }
        
        // Backlog/No Cycle at the end
        if (noCycle.length > 0) {
            const issueNodes = noCycle.map(i => new IssueNode(i));
            nodes.push(new CycleNode('no-cycle', 'Backlog', undefined, issueNodes));
        }
        
        return nodes;
    }
    
    private formatDateRange(start?: string, end?: string): string | undefined {
        if (!start || !end) {return undefined;}
        const startDate = new Date(start);
        const endDate = new Date(end);
        const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
        return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
    }
}

// ─── Tree Node Classes ─────────────────────────────────────────────

export class CycleNode extends vscode.TreeItem {
    constructor(
        public readonly cycleId: string,
        name: string,
        dateRange: string | undefined,
        public readonly children: IssueNode[]
    ) {
        // Format: "Sprint 24 (Dec 2-15)" with issue count
        const label = dateRange ? `${name} (${dateRange})` : name;
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        
        this.iconPath = new vscode.ThemeIcon('history');
        this.contextValue = 'cycle';
        this.description = `${children.length} issue${children.length !== 1 ? 's' : ''}`;
    }
}

export class IssueNode extends vscode.TreeItem {
    constructor(public readonly issue: IssueDTO) {
        super(issue.title, vscode.TreeItemCollapsibleState.None);
        
        this.id = `issue-${issue.id}`;
        this.description = issue.identifier; // e.g., "ENG-123"
        
        // Rich tooltip with labels
        const labels = issue.labels.map(l => `#${l.name}`).join(' ');
        this.tooltip = new vscode.MarkdownString(
            `**${issue.identifier}**: ${issue.title}\n\n` +
            `Status: ${issue.state?.name || 'Unknown'}\n\n` +
            (labels ? `Labels: ${labels}` : '')
        );
        
        // Status-based icon with color
        this.iconPath = this.getStatusIcon(issue.state?.type);
        
        // Context value for menus (matching atlascode pattern)
        this.contextValue = `issue:${issue.state?.type || 'unknown'}`;
        
        // Command to open issue on click
        this.command = {
            command: Commands.ViewIssue,
            title: 'View Issue',
            arguments: [issue]
        };
    }
    
    private getStatusIcon(stateType?: string): vscode.ThemeIcon {
        switch (stateType) {
            case 'completed': 
                return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
            case 'started': 
                return new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.blue'));
            case 'unstarted': 
                return new vscode.ThemeIcon('circle-outline');
            case 'backlog':
                return new vscode.ThemeIcon('circle-large-outline');
            case 'canceled': 
                return new vscode.ThemeIcon('circle-slash', new vscode.ThemeColor('charts.gray'));
            default: 
                return new vscode.ThemeIcon('issue-opened');
        }
    }
}
