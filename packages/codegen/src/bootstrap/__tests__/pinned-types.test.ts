import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pinnedTypeEscapes } from '../pinned-types.ts';

const ROOT = '/repo/scratchpad/wt';
const PINNED = '/repo/scratchpad/bootstrap/abc';

const explained = [
	'../bootstrap/abc/packages/typescript/dist/index.d.ts',
	"   Imported via '@sittir/typescript' from file 'packages/codegen/src/emitters/overlays/portable/emit/engine.ts'",
	'../bootstrap/abc/packages/types/src/index.ts',
	"   Imported via '@sittir/types' from file '../bootstrap/abc/packages/common/dist/index.d.ts'",
	'packages/types/src/vocabulary/index.ts',
	"   Imported via '@sittir/types/vocabulary' from file 'packages/codegen/src/emitters/overlays/portable/emit/engine.ts' with packageId '@sittir/types/src/vocabulary/index.ts@0.1.0'",
	'packages/codegen/src/compiler/types.ts',
	"   Imported via '../../../../compiler/types.ts' from file 'packages/codegen/src/emitters/overlays/portable/emit/engine.ts'",
	'node_modules/web-tree-sitter/web-tree-sitter.d.ts',
	"   Imported via 'web-tree-sitter' from file '../bootstrap/abc/packages/common/dist/index.d.ts'",
	'../bootstrap/abcdef/packages/common/dist/index.d.ts',
	"   Imported via '@sittir/common' from file 'packages/codegen/src/emitters/overlays/portable/emit/engine.ts'",
	''
].join('\n');

describe('the pinned build\'s type boundary', () => {
	it('names every @sittir import that resolves outside the pinned build, and nothing else', () => {
		expect(pinnedTypeEscapes(explained, ROOT, PINNED)).toEqual([
			{ specifier: '@sittir/types/vocabulary', importer: join(ROOT, 'packages/codegen/src/emitters/overlays/portable/emit/engine.ts'), resolved: join(ROOT, 'packages/types/src/vocabulary/index.ts') },
			{ specifier: '@sittir/common', importer: join(ROOT, 'packages/codegen/src/emitters/overlays/portable/emit/engine.ts'), resolved: '/repo/scratchpad/bootstrap/abcdef/packages/common/dist/index.d.ts' }
		]);
	});
});
