export const Commands = {
    // Authentication
    Authenticate: 'linear-studio.authenticate',
    Logout: 'linear-studio.logout',
    
    // Issue actions
    ViewIssue: 'linear-studio.viewIssue',
    StartWork: 'linear-studio.startWork',
    CopyIssueLink: 'linear-studio.copyIssueLink',
    OpenInBrowser: 'linear-studio.openInBrowser',
    
    // Tree view actions
    RefreshIssues: 'linear-studio.refreshIssues',
    FilterByCycle: 'linear-studio.filterByCycle',
    FilterByProject: 'linear-studio.filterByProject',
    ClearFilters: 'linear-studio.clearFilters',
} as const;

export const Views = {
    IssuesTree: 'linearStudio.issues',
    WelcomeView: 'linearStudio.welcome',
} as const;

export const ConfigKeys = {
    AutoRefreshInterval: 'linear-studio.autoRefreshInterval',
    DefaultTeam: 'linear-studio.defaultTeam',
} as const;

export const ContextKeys = {
    Authenticated: 'linear-studio.authenticated',
} as const;
