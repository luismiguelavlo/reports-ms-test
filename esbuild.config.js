import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outfile: './dist/index.js',
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['typescript'],
  packages: 'external',
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'node'],
  sourcemap: true,
  minify: false,
  treeShaking: true,
  metafile: true,
  banner: {
    js: '// @ts-nocheck\n',
  },
}); 