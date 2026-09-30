import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'build', '.git', '**/*.d.ts', '**/*.config.*', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.stories.tsx',
        'src/**/*.stories.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'api/**',
        'server/**',
        'mcp-server/**',
        'scripts/**',
        '*.js',
        '!src/**/*.js',
      ],
      thresholds: {
        lines: 2,
        functions: 2,
        branches: 2,
        statements: 2,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
})