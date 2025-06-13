import pkg from './package.json';

const dependencies = 'dependencies' in pkg ? Object.keys(pkg.dependencies ?? {}) : [];
const devDependencies = 'devDependencies' in pkg ? Object.keys(pkg.devDependencies ?? {}) : [];
const peerDependencies = 'peerDependencies' in pkg ? Object.keys(pkg.peerDependencies ?? {}) : [];

await Bun.$`rm -rf dist`;
console.log('🗑️  Deleted dist folder if it existed. ✅');

await Bun.$`tsc --project tsconfig.dts.json`;
await Bun.$`tsc-alias -p tsconfig.dts.json`;
console.log('🔍 Type analysis and generation completed. ✅');

await Bun.build({
    target: 'bun',
    external: [...dependencies, ...devDependencies, ...peerDependencies],
    root: './source',
    entrypoints: [
        // # ————————— Error ————————— #
        './source/error/index.ts',
        './source/error/types/index.ts',

        // # ————————— Strategies ————————— #
        './source/strategies/index.ts',

        // # ————————— Types ————————— #
        './source/types/index.ts',

        // # ————————— Root ————————— #
        './source/index.ts'
    ],
    outdir: './dist',
    splitting: true,
    format: 'esm',
    minify: true,
    sourcemap: 'none'
});

console.log('Build completed 🎉!');

process.exit(0);