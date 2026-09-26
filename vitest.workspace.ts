import { defineWorkspace } from 'vitest/config';
import { allGrammars } from './packages/codegen/src/grammars.ts';

export default defineWorkspace([
	'packages/codegen',
	'packages/tools',
	...allGrammars().map((g) => `packages/${g}`)
]);
