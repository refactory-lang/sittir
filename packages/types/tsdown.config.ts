import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	tsconfig: 'tsconfig.build.json',
	dts: { sourcemap: false },
	fixedExtension: false,
	deps: { onlyBundle: ['type-fest'], onlyImport: [] }
});
