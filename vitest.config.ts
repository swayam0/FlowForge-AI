import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup/db.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/server/**/*.ts',
        'src/validators/**/*.ts',
        'src/app/api/**/*.ts',
        'src/repositories/**/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        '**/node_modules/**'
      ]
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
