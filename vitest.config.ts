/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/main.tsx',
                'src/App.tsx',
                'src/test/**',
                'src/**/*.d.ts',
                'src/**/index.ts',
            ],
            thresholds: {
                statements: 70,
                branches: 70,
                functions: 70,
                lines: 70,
            },
        },
    },
});
