import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readVocabulary } from '@sittir/codegen/bindings';

function vocabularyIn(dir: string): void {
	writeFileSync(
		join(dir, 'expression.ts'),
		[
			'export interface Expression<G, K = "expression"> {',
			"\treadonly $path: K;",
			'}',
			'export namespace Expression {',
			'\texport interface Complex<G, K = "expression.complex"> extends SubKindOf<V.Expression<G>> {',
			"\t\treadonly $path: K;",
			'\t\treadonly sign?: boolean;',
			'\t\treadonly writable?: Flag;',
			'\t}',
			'\texport interface Reference<G, K = "expression.reference"> extends SubKindOf<V.Expression<G>> {',
			"\t\treadonly $path: K;",
			'\t\treadonly exclusive?: Flag;',
			'\t\treadonly writable?: Flag;',
			'\t}',
			'}',
			''
		].join('\n')
	);
}

describe('the vocabulary flags', () => {
	it('are the members declared with the marker type Flag, and a boolean member is data', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
		vocabularyIn(dir);
		const vocabulary = await readVocabulary(dir);
		rmSync(dir, { recursive: true, force: true });
		expect([...vocabulary.flags].sort()).toEqual(['exclusive', 'writable']);
		expect(vocabulary.members('expression.complex').get('sign')).toEqual({ optional: true, flag: false });
		expect(vocabulary.members('expression.complex').get('writable')).toEqual({ optional: true, flag: true });
	});
});
