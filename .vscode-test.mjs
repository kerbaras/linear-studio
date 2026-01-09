import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/integration/**/*.test.js',
  version: 'stable',
  workspaceFolder: './test/fixtures/test-workspace',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
    color: true,
  },
  launchArgs: [
    '--disable-extensions',
    '--disable-workspace-trust',
  ],
});
