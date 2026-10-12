import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLAG_BITS, FLAGS_PATH, REGENERATE_BINDINGS_COMMAND, flagMembers } from '@sittir/codegen/bindings';
import { printFlagsModule } from '../../src/inventory/flags.ts';
import { VOCABULARY_DIR, flagsCurrent } from '../../src/inventory/index.ts';
import { readVocabulary } from '../../src/inventory/vocabulary.ts';

const HEADER = `// Generated from the vocabulary's Flag declarations by \`${REGENERATE_BINDINGS_COMMAND}\`. Do not edit.`;

function vocabularyIn(dir: string): void {
	writeFileSync(
		join(dir, 'expression.ts'),
		[
			'export interface Expression<G> {',
			"\treadonly $kind: 'expression';",
			'}',
			'export namespace Expression {',
			'\texport interface Complex<G> extends SubKindOf<V.Expression<G>> {',
			"\t\treadonly $kind: 'expression.complex';",
			'\t\treadonly sign?: boolean;',
			'\t\treadonly writable?: Flag;',
			'\t}',
			'\texport interface Reference<G> extends SubKindOf<V.Expression<G>> {',
			"\t\treadonly $kind: 'expression.reference';",
			'\t\treadonly exclusive?: Flag;',
			'\t\treadonly writable?: Flag;',
			'\t}',
			'}',
			''
		].join('\n')
	);
}

describe('printFlagsModule', () => {
	it('gives each flag name one bit, in name order, under its TypeScript name', async () => {
		expect(await printFlagsModule(['static', 'byReference', 'async', 'static'])).toBe(
			[HEADER, 'export enum Flags {', '\tAsync = 1 << 0,', '\tByReference = 1 << 1,', '\tStatic = 1 << 2', '}', ''].join('\n')
		);
	});

	it('refuses more flags than one word holds, naming the flags past it', async () => {
		const names = Array.from({ length: FLAG_BITS + 1 }, (_, i) => `flag${String(i).padStart(2, '0')}`);
		expect(() => flagMembers(names.slice(1))).not.toThrow();
		expect(() => flagMembers(names)).toThrow(`the vocabulary declares ${FLAG_BITS + 1} flags`);
		expect(() => flagMembers(names)).toThrow(`no bit for flag${FLAG_BITS}`);
		await expect(printFlagsModule(names)).rejects.toThrow(`no bit for flag${FLAG_BITS}`);
	});
});

describe('the vocabulary flags', () => {
	it('are the members declared with the marker type Flag, and a boolean member is data', () => {
		const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
		vocabularyIn(dir);
		const vocabulary = readVocabulary(dir);
		rmSync(dir, { recursive: true, force: true });
		expect([...vocabulary.flags].sort()).toEqual(['exclusive', 'writable']);
		expect(vocabulary.members('expression.complex').get('sign')).toEqual({ optional: true, flag: false });
		expect(vocabulary.members('expression.complex').get('writable')).toEqual({ optional: true, flag: true });
	});

	it('are written to the module their declarations imply', async () => {
		expect(readFileSync(FLAGS_PATH, 'utf8')).toBe(await printFlagsModule(readVocabulary(VOCABULARY_DIR).flags));
	});

	it('are stale while their module is missing or names other flags', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'vocabulary-'));
		vocabularyIn(dir);
		const vocabulary = readVocabulary(dir);
		const path = join(dir, 'flags.ts');
		const missing = await flagsCurrent(vocabulary, path);
		writeFileSync(path, await printFlagsModule(vocabulary.flags));
		const written = await flagsCurrent(vocabulary, path);
		writeFileSync(path, await printFlagsModule([...vocabulary.flags, 'raw']));
		const other = await flagsCurrent(vocabulary, path);
		rmSync(dir, { recursive: true, force: true });
		expect({ missing, written, other }).toEqual({ missing: false, written: true, other: false });
	});
});
