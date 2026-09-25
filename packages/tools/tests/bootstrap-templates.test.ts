import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grammarPackageDir } from '@sittir/codegen/grammars';
import { grammarPackageFiles } from '../src/bootstrap/templates.ts';

const python = grammarPackageFiles({
	name: 'python',
	Name: 'Python',
	upstreamDependency: 'tree-sitter-python',
	upstreamRange: '^0.25.0'
});

describe('bootstrap templates reproduce an existing grammar package', () => {
	for (const file of python.filter((f) => f.path.startsWith('tsconfig'))) {
		it(file.path, () => {
			expect(JSON.parse(file.contents)).toEqual(
				JSON.parse(readFileSync(join(grammarPackageDir('python'), file.path), 'utf8'))
			);
		});
	}
});
