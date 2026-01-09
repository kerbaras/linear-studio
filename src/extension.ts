import * as vscode from 'vscode';
import { Container } from './container';
import { registerCommands } from './commands';
import { ContextKeys } from './constants';

export async function activate(context: vscode.ExtensionContext) {
    // Initialize dependency injection container
    await Container.initialize(context);
    
    // Register all commands
    registerCommands(context);
    
    // Set context for conditional UI
    await vscode.commands.executeCommand(
        'setContext', 
        ContextKeys.Authenticated, 
        Container.authService.isAuthenticated
    );
}

export function deactivate() {
    Container.dispose();
}
