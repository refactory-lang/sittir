import { describe, expect, it } from 'vitest';
import { createEngine, snapshotOf } from '@sittir/common';
import language from '../src/index.ts';

const engine = await createEngine(language);
const WHOLE = { deep: true, depth: Infinity };
const namesATree = (value: unknown): boolean => /"\$(treeHandle|end)"|"at":/.test(JSON.stringify(value));

describe('$snapshot()', () => {
	it('names no tree and renders as the source', () => {
		const source = '\n\nuse a;\n\nuse b;\n';
		const snap = engine.parse(source, WHOLE).$snapshot();
		expect(namesATree(snap)).toBe(false);
		expect(engine.render(snap).toString()).toBe(source);
	});
	it('keeps an edit, and the edited node its geometry', () => {
		const root = engine.parse('fn f() {\n    let x = 1; // keep\n}\n', WHOLE);
		const fn = root.statements()[0]!;
		if (!engine.is.functionItem(fn)) throw new Error('expected a function');
		const stmt = fn.body().statements()[0];
		if (stmt === undefined || !engine.is.letDeclaration(stmt)) throw new Error('expected a let declaration');
		stmt.$trivia.leading('// new');
		const snapped = JSON.stringify(root.$snapshot());
		expect(namesATree(JSON.parse(snapped))).toBe(false);
		expect(snapped).toContain('"leading":[{"$type":337,"$source":2,"$named":true,"_content":{"$type":156,"$source":2,"$named":true,"$text":" new"}}]');
		expect(snapped).toContain('"$text":"// keep"');
		expect(snapped).toContain('"span":{"start":{"row":1,"column":4},"end":{"row":1,"column":14}}');
	});
	it('a clean node under a built parent is measured from its own start', () => {
		const root = engine.parse('\n\nfn f() {}\n', WHOLE);
		const built = engine.build.sourceFile({ statements: [root.statements()[0]!] });
		const data = JSON.parse(JSON.stringify(snapshotOf(built)));
		expect(data._statements[0].$_layout.span).toEqual({ start: { row: 0, column: 0 }, end: { row: 0, column: 9 } });
	});
	it('is a new graph of plain data, not the node', () => {
		const root = engine.parse('fn f() {}\n', WHOLE);
		const snap = root.$snapshot();
		expect(snap).not.toBe(root);
		expect('statements' in snap).toBe(false);
	});
});
