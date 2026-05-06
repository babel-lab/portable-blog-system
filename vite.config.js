import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = __dirname;
const PAGES_ROOT = path.join(PROJECT_ROOT, '.cache', 'pages');

export default defineConfig(async ({ command }) => {
  const base = command === 'serve' ? '/' : './';

  const htmlAbs = await fg('**/*.html', { cwd: PAGES_ROOT, absolute: true });
  const input = Object.fromEntries(
    htmlAbs.map((file) => {
      const rel = path.relative(PAGES_ROOT, file).replace(/\\/g, '/');
      const key = rel === 'index.html'
        ? 'index'
        : rel.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\//g, '_');
      return [key, file];
    }),
  );
  if (Object.keys(input).length === 0) {
    input.index = path.join(PAGES_ROOT, 'index.html');
  }

  return {
    root: PAGES_ROOT,
    base,
    appType: 'mpa',
    publicDir: path.join(PROJECT_ROOT, 'public'),
    resolve: {
      alias: {
        '@': path.join(PROJECT_ROOT, 'src'),
      },
    },
    server: {
      open: true,
      fs: {
        allow: [PROJECT_ROOT],
      },
    },
    build: {
      outDir: path.join(PROJECT_ROOT, 'dist'),
      emptyOutDir: true,
      rollupOptions: {
        input,
      },
    },
  };
});
