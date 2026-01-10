import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/**/*.d.ts', 'src/extension.ts', 'src/container.ts', 'src/commands/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },
    setupFiles: ['test/unit/setup.ts'],
    mockReset: true
  }
});
