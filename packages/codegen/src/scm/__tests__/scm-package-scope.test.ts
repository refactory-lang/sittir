import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractGrammarRoles } from '../extract-roles.ts';
import { grammarPackage } from '../../grammars.ts';

let root: string;

function installGrammar(name: string, files: Record<string, string>): void {
	const dir = join(root, 'node_modules', `tree-sitter-${name}`);
	mkdirSync(join(dir, 'queries'), { recursive: true });
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: `tree-sitter-${name}`, version: '0.0.0' }));
	for (const [path, contents] of Object.entries(files)) writeFileSync(join(dir, path), contents);
}

describe('query roles resolve every inherited grammar from the package being compiled', () => {
	beforeAll(() => {
		root = mkdtempSync(join(tmpdir(), 'sittir-scm-scope-'));
		writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'outside', version: '0.0.0' }));
		installGrammar('outside', {
			'queries/highlights.scm': '; inherits: outsideinherited\n(own_literal) @string\n',
			'tree-sitter.json': JSON.stringify({
				grammars: [{ highlights: ['node_modules/tree-sitter-outsideparent/queries/highlights.scm'] }]
			})
		});
		installGrammar('outsideinherited', { 'queries/highlights.scm': '(inherited_literal) @string\n' });
		installGrammar('outsideparent', { 'queries/highlights.scm': '(parent_literal) @string\n' });
	});
	afterAll(() => rmSync(root, { recursive: true, force: true }));

	it('reads the inherits directive and tree-sitter.json parents from the package node_modules', () => {
		const roles = extractGrammarRoles(grammarPackage('outside', root));
		expect(roles.get('string')).toEqual(expect.arrayContaining(['own_literal', 'inherited_literal', 'parent_literal']));
	});
});
