// @ts-check
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
    files: 'test/integration/**/*.test.ts',
    version: 'stable',
    workspaceFolder: 'test/fixtures/test-workspace',
    mocha: {
        ui: 'bdd',
        timeout: 60000,
    },
    launchArgs: [
        '--disable-extensions',
    ],
});
