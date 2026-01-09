// Minimal types for VS Code Git extension API
// Full version: https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts

import { Uri, Event } from 'vscode';

export interface GitExtension {
    getAPI(version: 1): API;
}

export interface API {
    readonly repositories: Repository[];
    readonly onDidOpenRepository: Event<Repository>;
    readonly onDidCloseRepository: Event<Repository>;
}

export interface Repository {
    readonly rootUri: Uri;
    readonly state: RepositoryState;
    
    checkout(treeish: string): Promise<void>;
    createBranch(name: string, checkout: boolean, ref?: string): Promise<void>;
    fetch(remote?: string, ref?: string): Promise<void>;
    push(remote?: string, name?: string, setUpstream?: boolean): Promise<void>;
}

export interface RepositoryState {
    readonly HEAD: Branch | undefined;
    readonly refs: Ref[];
    readonly remotes: Remote[];
}

export interface Branch {
    readonly name: string;
    readonly commit?: string;
    readonly upstream?: { name: string; remote: string };
}

export interface Ref {
    readonly type: RefType;
    readonly name?: string;
    readonly commit?: string;
}

export const enum RefType {
    Head = 0,
    RemoteHead = 1,
    Tag = 2,
}

export interface Remote {
    readonly name: string;
    readonly fetchUrl?: string;
    readonly pushUrl?: string;
}
