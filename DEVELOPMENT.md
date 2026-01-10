# Linear Studio - Development Guide

## Quick Start

```bash
# Clone and install
git clone <repository>
cd linear-studio

# Install extension dependencies
pnpm install

# Install webview dependencies
cd webview-ui && pnpm install && cd ..

# Build everything
pnpm build

# Run extension in VS Code
# Press F5 or use "Run > Start Debugging"
```

## Development Workflow

### 1. Running the Extension

**Option A: VS Code Debugger (Recommended)**
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. The extension will be active in the new window

**Option B: Watch Mode**
```bash
# Terminal 1: Watch extension
pnpm watch

# Terminal 2: Watch webview (if modifying webview UI)
pnpm watch:webview

# Then press F5 in VS Code
```

### 2. Making Changes

1. Modify source files in `src/` or `webview-ui/src/`
2. If in watch mode, changes are automatically compiled
3. Press `Ctrl+Shift+F5` to reload Extension Development Host
4. For webview changes, close and reopen the webview panel

### 3. Testing Changes

```bash
# Run unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit:coverage

# Watch mode for TDD
pnpm test:unit:watch
```

## Project Structure

```
linear-studio/
├── src/                     # Extension TypeScript source
├── webview-ui/              # React webview (separate build)
├── test/                    # All tests
│   ├── unit/               # Vitest unit tests
│   ├── integration/        # VS Code integration tests
│   └── e2e/                # Playwright E2E tests
├── dist/                    # Compiled extension output (gitignored)
├── package.json             # Extension manifest
└── esbuild.js               # Extension build script
```

## Common Development Tasks

### Adding a New Command

1. **Define command ID** in `src/constants.ts`:
   ```typescript
   export const Commands = {
       // ... existing commands
       MY_NEW_COMMAND: 'linear-studio.myNewCommand',
   };
   ```

2. **Add to package.json** under `contributes.commands`:
   ```json
   {
       "command": "linear-studio.myNewCommand",
       "title": "My New Command",
       "category": "Linear Studio"
   }
   ```

3. **Register handler** in `src/commands/index.ts`:
   ```typescript
   context.subscriptions.push(
       vscode.commands.registerCommand(Commands.MY_NEW_COMMAND, async () => {
           // Command logic here
       })
   );
   ```

4. **Add menu entry** (optional) in `package.json` under `contributes.menus`:
   ```json
   {
       "commandPalette": [
           { "command": "linear-studio.myNewCommand" }
       ]
   }
   ```

### Adding a New Service

1. **Create service class** in appropriate directory:
   ```typescript
   // src/myfeature/myService.ts
   export class MyService {
       constructor(private readonly issueService: IssueService) {}

       async doSomething(): Promise<void> {
           // ...
       }
   }
   ```

2. **Add to Container** in `src/container.ts`:
   ```typescript
   private static _myService: MyService;

   static async initialize(context: vscode.ExtensionContext): Promise<void> {
       // ... existing initialization
       this._myService = new MyService(this._issueService);
   }

   static get myService(): MyService { return this._myService; }
   ```

3. **Write tests** in `test/unit/myfeature/myService.test.ts`

### Modifying Issue Data

1. **Update DTO** in `src/linear/types.ts`:
   ```typescript
   export interface IssueDTO {
       // ... existing fields
       newField: string;
   }
   ```

2. **Update conversion** in `src/linear/issueService.ts`:
   ```typescript
   private toIssueDTO(issue: Issue): IssueDTO {
       return {
           // ... existing fields
           newField: issue.newField,
       };
   }
   ```

3. **Update webview types** in `webview-ui/src/types.ts`

4. **Update webview components** to display new field

### Adding Configuration Settings

1. **Define in package.json** under `contributes.configuration`:
   ```json
   {
       "linear-studio.mySetting": {
           "type": "boolean",
           "default": true,
           "description": "Enable my feature"
       }
   }
   ```

2. **Read setting** in code:
   ```typescript
   const config = vscode.workspace.getConfiguration('linear-studio');
   const mySetting = config.get<boolean>('mySetting', true);
   ```

3. **Listen for changes** (optional):
   ```typescript
   vscode.workspace.onDidChangeConfiguration((e) => {
       if (e.affectsConfiguration('linear-studio.mySetting')) {
           // React to change
       }
   });
   ```

## Webview Development

### Architecture

The webview is a separate React application in `webview-ui/`:
- Built with Vite
- Communicates with extension via `postMessage`
- Styled to match VS Code theme

### Development

```bash
# Standalone development (hot reload)
cd webview-ui && pnpm dev

# Build for production
pnpm build:webview
```

### Communication Protocol

**Extension → Webview:**
```typescript
panel.webview.postMessage({
    type: 'update',
    payload: issueData
});
```

**Webview → Extension:**
```typescript
// In React component
const vscode = acquireVsCodeApi();
vscode.postMessage({
    type: 'startWork',
    payload: { issueId: issue.id }
});
```

### Adding New Message Types

1. **Define message type** (both sides):
   ```typescript
   interface MyMessage {
       type: 'myAction';
       payload: { data: string };
   }
   ```

2. **Handle in controller** (`src/views/issueWebview/issueWebviewController.ts`):
   ```typescript
   private handleMessage(message: WebviewMessage) {
       switch (message.type) {
           case 'myAction':
               this.handleMyAction(message.payload);
               break;
       }
   }
   ```

3. **Send from webview**:
   ```typescript
   vscode.postMessage({ type: 'myAction', payload: { data: 'value' } });
   ```

## Debugging

### Extension Debugging

1. Set breakpoints in TypeScript files
2. Press F5 to start debugging
3. Trigger the code path in Extension Development Host
4. Debugger will pause at breakpoints

### Webview Debugging

1. In Extension Development Host, open Command Palette
2. Run "Developer: Open Webview Developer Tools"
3. Use Chrome DevTools to debug React components

### Logging

```typescript
// Use VS Code output channel for extension logs
const outputChannel = vscode.window.createOutputChannel('Linear Studio');
outputChannel.appendLine('Debug message');

// Console.log in webview appears in webview DevTools
console.log('Webview debug');
```

## Build System

### Extension Build (esbuild)

```javascript
// esbuild.js
const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    platform: 'node',
    format: 'cjs',
});
```

### Webview Build (Vite)

```typescript
// webview-ui/vite.config.ts
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../dist/webview',
        rollupOptions: {
            output: {
                entryFileNames: 'index.js',
                assetFileNames: 'index.css',
            },
        },
    },
});
```

### Build Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build extension + webview |
| `pnpm build:extension` | Build extension only |
| `pnpm build:webview` | Build webview only |
| `pnpm watch` | Watch extension for changes |
| `pnpm watch:webview` | Watch webview for changes |

## Code Style

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer `async/await` over raw Promises
- Use meaningful variable names
- Add JSDoc for public APIs

### Testing

- Follow Given-When-Then pattern
- Clear mock setup in `beforeEach`
- One assertion concept per test
- Use descriptive test names

### Git

- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Keep commits atomic
- Write meaningful commit messages

## Troubleshooting

### Extension Not Loading

1. Check Output panel for "Linear Studio" errors
2. Verify `dist/extension.js` exists
3. Run `pnpm build` and try again

### Webview Not Displaying

1. Check webview DevTools for errors
2. Verify `dist/webview/` contains built files
3. Run `pnpm build:webview`

### Linear API Errors

1. Verify API key is valid
2. Check Linear service status
3. Look for rate limit errors in output

### Git Integration Not Working

1. Verify Git is installed
2. Check that a Git repository is open
3. Ensure `vscode.git` extension is enabled

## Release Process

1. **Update version** in `package.json`
2. **Update CHANGELOG.md**
3. **Run full test suite**: `pnpm test`
4. **Build**: `pnpm build`
5. **Package**: `vsce package`
6. **Publish**: `vsce publish`

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Linear SDK Documentation](https://developers.linear.app/docs/sdk)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
