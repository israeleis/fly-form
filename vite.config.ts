import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/fly-form/',
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**/*.test.ts', 'node_modules'],
  },
})
