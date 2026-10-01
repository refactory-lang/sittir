import { describe, expect, it } from 'vitest';
import { initializeTreeSitter, parse, registerDynamicLanguage } from '@ast-grep/wasm';
import { applyEdits } from '@sittir/common';
import { toEditAt } from '@sittir/common/utils';
import { grammarRequire } from '@sittir/codegen/grammars';

// 17 UTF-16 units, 21 UTF-8 bytes: each Greek letter is two bytes.
const greek = '\nψ1 = β_γ + Ψ_5\n\n';

async function firstStatementRange() {
	await initializeTreeSitter();
	await registerDynamicLanguage({
		python: { libraryPath: grammarRequire('python').resolve('tree-sitter-python/tree-sitter-python.wasm') }
	});
	const statement = parse('python', greek).root().child(0);
	if (statement === undefined) throw new Error('expected a statement');
	const range = statement.range();
	return { start: { index: range.start.index }, end: { index: range.end.index } };
}

describe('an Edit built from an ast-grep range', () => {
	it('gets a range whose index is a string index, not a byte offset', async () => {
		expect(await firstStatementRange()).toEqual({ start: { index: 1 }, end: { index: 15 } });
	});

	// An Edit counts bytes and the range counts string indices, so the edit
	// stops four bytes short of the statement. Expected to fail until edits are
	// no longer built from a range's index.
	it.fails('replaces the node the range covers when non-ASCII text precedes its end', async () => {
		const edit = toEditAt('x', await firstStatementRange());
		expect(applyEdits(greek, [edit]).source).toBe('\nx\n\n');
	});
});
