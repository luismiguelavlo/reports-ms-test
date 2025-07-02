import * as esbuild from 'esbuild';

console.log('🔨 Starting build process...');

try {
  const result = await esbuild.build({
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
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Output file: dist/index.js');
  
  if (result.metafile) {
    console.log('📊 Build metadata generated');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 