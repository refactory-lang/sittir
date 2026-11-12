import type { TreeHandle } from '../../src/read.ts';

/** An engine as an edit test drives it: it parses with its read tree, and renders a root. */
export interface EditableEngine {
	readonly diagnostics: { parseAndRead(source: string): unknown };
	render(root: never): { toString(): string };
}

/**
 * Renders `source` after one edit: the first node, in tree order, whose span
 * spells `text` has its inner trivia side written back unchanged. That node and
 * its ancestors then render from their templates, and the rest from source.
 */
export function editedRender(engine: EditableEngine, source: string, text: string): string {
	const { root, tree } = engine.diagnostics.parseAndRead(source) as { root: never; tree: TreeHandle };
	const end = (tree.read!(0, 1) as { $_layout: { at: { $end: number } } }).$_layout.at.$end;
	const index = Array.from({ length: end }, (_, at) => at).find((at) => {
		const read = tree.read!(at, 1) as { $_layout?: { at?: { $span: { start: number; end: number } } } };
		const span = typeof read === 'object' ? read.$_layout?.at?.$span : undefined;
		return span !== undefined && source.slice(span.start, span.end) === text;
	});
	if (index === undefined) throw new Error(`no node spells ${JSON.stringify(text)}`);
	tree.writeTriviaSide!(index, 'inner', [...(tree.triviaSide!(index, 'inner') ?? [])]);
	return engine.render(root).toString();
}
