import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Names this build (the commit it was made from). The app carries it and the
 * server publishes it as /version.json, so an open or installed app can tell
 * when a newer release has been deployed and offer to switch to it.
 */
function buildId(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  }
}
const APP_BUILD = buildId();

const versionFile = (): Plugin => ({
  name: 'optimas-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: APP_BUILD }) });
  },
});

export default defineConfig({
  plugins: [react(), versionFile()],
  define: {
    __APP_BUILD__: JSON.stringify(APP_BUILD),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4100',
        changeOrigin: true,
      },
    },
  },
});