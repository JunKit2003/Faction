import { build } from 'esbuild';

await build({
  entryPoints: { main: 'src/main.ts', 'cli/admin': 'src/cli/admin.ts', 'cli/migrate': 'src/cli/migrate.ts', 'cli/seed': 'src/cli/seed.ts' },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  packages: 'external',
  // @faction/shared is TypeScript source in this repo, so it must be bundled.
  plugins: [{
    name: 'bundle-shared',
    setup(b) {
      b.onResolve({ filter: /^@faction\/shared$/ }, () => ({ path: new URL('../shared/src/index.ts', import.meta.url).pathname }));
    },
  }],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
console.log('server built to dist/');
