import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const edited = (source: string, text: string) => {
	const { root, tree } = rs.diagnostics.parseAndRead(source);
	const end = (tree.read!(0, 1) as { $_layout: { at: { $end: number } } }).$_layout.at.$end;
	const index = Array.from({ length: end }, (_, at) => at).find((at) => {
		const read = tree.read!(at, 1) as { $_layout?: { at?: { $span: { start: number; end: number } } } };
		const span = typeof read === 'object' ? read.$_layout?.at?.$span : undefined;
		return span !== undefined && source.slice(span.start, span.end) === text;
	});
	if (index === undefined) throw new Error(`no node spells ${JSON.stringify(text)}`);
	tree.writeTriviaSide!(index, 'inner', [...tree.triviaSide!(index, 'inner')]);
	return { root, node: tree.read!(index, 1) };
};

describe('an untouched node in an edited one meets its neighbours as its template renders it', () => {
	it.each([
		['a!(\'lifetime)\n', "('lifetime)"],
		['a!(* a *);\na!(\'lifetime)\ndefault!(a);\n', "('lifetime)"]
	])('keeps a lifetime quote tight to its name in %j', (source, text) => {
		const { root, node } = edited(source, text);
		expect(rs.render(node as never).toString()).toBe(text);
		expect(rs.render(root as never).toString()).toBe(source);
	});
});
