import { describe, expect, it } from 'vitest';
import { markEdited, detachCoordinates, holdReadTree, holdTree, sourceGapOf, STORED_TRIVIA, toTransportData, treeHandleOf, type TriviaView } from '../src/transport-data.ts';
import { readTrivia } from '../src/utils.ts';
import { mintTreeToken, registerTree, treeTokenOf } from '../src/tree-token.ts';

// A coordinate crosses only while it holds its tree, so a copy of each
// hand-written node below is given one, the way a read gives it to what it
// returns, and the token names a live tree, as a parse registers it.
const project = (node: never): ReturnType<typeof toTransportData> => {
	const held = structuredClone(node);
	const token = mintTreeToken(1);
	registerTree(token, { id: 1 });
	holdTree(held, token);
	return toTransportData(held, STORED_TRIVIA);
};

/** The coordinate a read gives the node at `start..end`; its handle is its start, a stand-in for its descendant index. */
const at = ($type: number, start: number, end: number) => ({ $treeHandle: start, $end: end, $span: { start, end }, $type });
const leaf = (text: string, start: number) => ({ $type: 1, $text: text, $_layout: { at: at(1, start, start + text.length) } });
/** A child past the read's depth: its coordinate alone. */
const coordinate = (start: number, end: number) => at(2, start, end);
/** A child a read expanded: its storage and the coordinate it was read at. */
const deep = (start: number, end: number, storage: Record<string, unknown>) => ({ $type: 4, $_layout: { at: at(4, start, end) }, ...storage });
const built = (storage: Record<string, unknown> = {}) => ({ $type: 9, $source: 2, $named: true, ...storage });

describe('toTransportData', () => {
	it('folds an unedited node with only coordinates and leaves below it to its coordinate', () => {
		const node = { $type: 3, $_layout: { at: at(3, 0, 20) }, _name: leaf('main', 3), _body: coordinate(8, 20) };
		expect(project(node as never)).toEqual(at(3, 0, 20));
	});

	it('folds a deep read by its root, whatever its descendants carry', () => {
		const node = { $type: 3, $_layout: { at: at(3, 0, 20) }, _body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] }) };
		expect(project(node as never)).toEqual(at(3, 0, 20));
	});

	it('crosses a node rebuilt around a replaced child as its slots, with no coordinate', () => {
		const rebuilt = built({ _x: { $type: 1, $text: 'y' } });
		const node = markEdited({ $type: 3, $_layout: { at: at(3, 0, 20) }, _name: leaf('main', 3), _body: rebuilt });
		const out = project(node as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$_layout).toBeUndefined();
		expect(out._body).toEqual(rebuilt);
	});

	it('crosses a child past the read\'s depth inside an edited parent as its coordinate', () => {
		const out = project({ $type: 3, _a: coordinate(0, 4), _b: built() } as never) as unknown as Record<string, unknown>;
		expect(out._a).toEqual(coordinate(0, 4));
	});

	it('folds an expanded child of an edited parent by its own coordinate', () => {
		const parent = { $type: 3, _name: built({ $text: 'g' }), _body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] }) };
		const out = project(parent as never) as unknown as Record<string, unknown>;
		expect(out._body).toEqual(at(4, 8, 20));
	});

	it('folds a node whose own trivia sits outside its span, carrying that trivia, and folds over a child that carries some', () => {
		const withOwnTrivia = { $type: 3, $_layout: { at: at(3, 5, 9), trivia: { leading: [leaf('// c', 0)] } }, _a: coordinate(5, 9) };
		const own = project(withOwnTrivia as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(own)).toBe(5);
		expect(own._a).toBeUndefined();
		expect((own.$_layout as { trivia?: { leading?: unknown[] } } | undefined)?.trivia?.leading).toHaveLength(1);

		// A child's comments lie inside the parent's span: the parent's bytes
		// carry them, so a deep read of a commented file still folds like a
		// shallow one.
		const child = deep(5, 8, {});
		const withChildTrivia = { $type: 3, $_layout: { at: at(3, 0, 8) }, _a: { ...child, $_layout: { ...child.$_layout, trivia: { leading: [leaf('// c', 0)] } } } };
		expect(project(withChildTrivia as never)).toEqual(at(3, 0, 8));
	});

	it('never lets a rebuilt structural node cross with $text or a stale coordinate', () => {
		const node = markEdited({ $type: 3, $text: 'stale', $_layout: { at: at(3, 0, 5) }, _a: built() });
		const out = project(node as never) as unknown as Record<string, unknown>;
		expect(out.$text).toBeUndefined();
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$_layout).toBeUndefined();
	});

	it('folds a leaf that kept its trivia to its coordinate, carrying the trivia', () => {
		const two = leaf('2', 12);
		const withTrivia = { ...two, $_layout: { ...two.$_layout, trivia: { trailing: [leaf('# two', 14)] } } };
		const out = project(withTrivia as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(out)).toBe(12);
		expect(out.$text).toBeUndefined();
		expect((out.$_layout as { trivia?: { trailing?: unknown[] } } | undefined)?.trivia?.trailing).toHaveLength(1);
	});

	it('leaves a kind id or a boolean in a slot inert', () => {
		const node = { $type: 3, $_layout: { at: at(3, 0, 6) }, _marker: true, _keyword: 42 };
		expect(project(node as never)).toEqual(at(3, 0, 6));
	});
});

describe('treeHandleOf', () => {
	it('reads the tree handle of a coordinate, or of the coordinate a read node carries', () => {
		expect(treeHandleOf(at(3, 5, 6))).toBe(5);
		expect(treeHandleOf({ $type: 3, $_layout: { at: at(3, 4, 6) } })).toBe(4);
		expect(treeHandleOf({ $type: 3, $_layout: { trivia: {} } })).toBeUndefined();
	});
});

describe('markEdited', () => {
	it('detaches the coordinate and nothing else', () => {
		expect(markEdited({ $type: 3, $_layout: { at: at(3, 0, 1) }, $text: 'x', _a: 1 })).toEqual({ $type: 3, $text: 'x', _a: 1 });
		const trivia = { leading: [8] };
		expect(markEdited({ $type: 3, $_layout: { at: at(3, 0, 1), trivia }, _a: 1 })).toEqual({ $type: 3, $_layout: { trivia }, _a: 1 });
	});
});

describe('detachCoordinates', () => {
	it('keeps the coordinate of a text leaf, which addresses its own bytes only', () => {
		const node = leaf('x', 1);
		expect(detachCoordinates(structuredClone(node))).toEqual(node);
	});

	it('strips the coordinate of a node that holds slots, and keeps its children\'s', () => {
		const parent = { $type: 1, $_layout: { at: at(1, 0, 2) }, _child: leaf('x', 1), _rest: coordinate(1, 2) };
		expect(detachCoordinates(structuredClone(parent))).toEqual({ $type: 1, _child: leaf('x', 1), _rest: coordinate(1, 2) });
	});
});

describe('the tree token a parsed object holds', () => {
	const token = mintTreeToken(4);
	registerTree(token, { id: 4 });
	const held = <T extends object>(node: T): T => {
		holdTree(node, token);
		return node;
	};

	it('is no data key: the keys and the JSON of a node that holds one do not show it', () => {
		const node = held({ $type: 5, $text: 'x' });
		expect(treeTokenOf(node)).toBe(token);
		expect(Object.keys(node)).toEqual(['$type', '$text']);
		expect(JSON.parse(JSON.stringify(node))).toEqual({ $type: 5, $text: 'x' });
	});

	it('is carried by a spread copy and by nothing that copies by string keys', () => {
		const node = held({ $type: 5, $text: 'x' });
		expect(treeTokenOf({ ...node })).toBe(token);
		expect(treeTokenOf(structuredClone(node))).toBeUndefined();
		expect(treeTokenOf(JSON.parse(JSON.stringify(node)) as object)).toBeUndefined();
		expect(treeTokenOf(Object.fromEntries(Object.entries(node)))).toBeUndefined();
	});

	it('does not cross: a folded coordinate, a rebuilt node and a kept leaf all drop it', () => {
		const folded = toTransportData(held({ $type: 5, $_layout: { at: at(5, 1, 2) } }) as never, STORED_TRIVIA);
		expect(folded).toEqual(at(5, 1, 2));
		expect(treeTokenOf(folded)).toBeUndefined();
		const rebuilt = toTransportData(held({ $type: 1, _child: { $type: 5, $text: 'x' } }) as never, STORED_TRIVIA) as never as { _child: object };
		expect(rebuilt).toEqual({ $type: 1, _child: { $type: 5, $text: 'x' } });
		expect(treeTokenOf(rebuilt)).toBeUndefined();
		expect(treeTokenOf(rebuilt._child)).toBeUndefined();
	});

	it('is detached with the coordinate by an edit, although the edit copies the node by spread', () => {
		const edited = markEdited(held({ $type: 1, $_layout: { at: at(1, 0, 1) }, _a: 1 }));
		expect(edited).toEqual({ $type: 1, _a: 1 });
		expect(treeTokenOf(edited)).toBeUndefined();
	});

	it('is removed from transport data detached in place', () => {
		const detached = detachCoordinates(held(leaf('x', 1)));
		expect(detached).toEqual(leaf('x', 1));
		expect(treeTokenOf(detached)).toBeUndefined();
	});

	it('is removed from the trivia a detached node owns, at every side and depth', () => {
		const comment = () => ({ $type: 7, $_layout: { at: at(7, 0, 1) }, _content: [{ $type: 8 }] });
		const node = detachCoordinates(
			held({ $type: 1, _a: 1, $_layout: { trivia: { leading: [comment()], trailing: [comment()], inner: { gap: [comment()] } } } })
		);
		const trivia = node.$_layout.trivia;
		const entries = [...trivia.leading, ...trivia.trailing, ...trivia.inner.gap];
		expect(entries).toHaveLength(3);
		for (const entry of entries) {
			expect(treeTokenOf(entry)).toBeUndefined();
			expect(treeTokenOf(entry._content[0]!)).toBeUndefined();
		}
	});

	it('is required of a bare coordinate: one that holds no tree is refused, as a child and as a trivia entry', () => {
		const refusal = /does not hold that tree.*parse the source here/;
		expect(() => toTransportData({ $type: 1, _child: at(5, 1, 2) } as never, STORED_TRIVIA)).toThrow(refusal);
		expect(() => toTransportData({ $type: 1, _a: 1, $_layout: { trivia: { inner: { gap: [at(7, 0, 1)] } } } } as never, STORED_TRIVIA)).toThrow(refusal);
	});

	it('never folds a read node that lost its tree: it crosses as its own data, never naming a tree', () => {
		const read = { $type: 5, $text: 'x', $_layout: { at: at(5, 1, 2) } };
		expect(toTransportData(structuredClone(held({ ...read })) as never, STORED_TRIVIA)).toEqual({ $type: 5, $text: 'x' });
	});

	it('is not required of built data, which names no tree', () => {
		const built = { $type: 1, _child: { $type: 5, $text: 'x' } };
		expect(toTransportData(built as never, STORED_TRIVIA)).toEqual(built);
	});

	it('passes with a spread copy made on this thread', () => {
		const read = held({ $type: 5, $_layout: { at: at(5, 1, 2) } });
		expect(toTransportData({ ...read } as never, STORED_TRIVIA)).toEqual(at(5, 1, 2));
	});
});

describe('line-gap whitespace at the render root', () => {
	const comment = { $type: 3, $source: 0, $named: true, $text: '// c' };

	it('leaves out the whitespace at the root edges and keeps what sits between its comment and the root', () => {
		const node = { $type: 5, $source: 0, $named: true, $text: 'b', $_layout: { trivia: { leading: [9, comment, 8], trailing: [8] } } };
		expect(toTransportData(node as never, STORED_TRIVIA)).toEqual({ $type: 5, $source: 0, $named: true, $text: 'b', $_layout: { trivia: { leading: [comment, 8] } } });
	});

	it('keeps every entry below the root', () => {
		const child = { $type: 5, $source: 0, $named: true, $text: 'b', $_layout: { trivia: { leading: [9], trailing: [8] } } };
		const root = { $type: 6, $source: 0, $named: true, _body: child, $_layout: { trivia: { leading: [9] } } };
		expect(toTransportData(root as never, STORED_TRIVIA)).toEqual({
			$type: 6,
			$source: 0,
			$named: true,
			_body: { $type: 5, $source: 0, $named: true, $text: 'b', $_layout: { trivia: { leading: [9], trailing: [8] } } }
		});
	});
});

describe('readTrivia', () => {
	const gaps = () => ({ leading: [{ kind: 9, start: 0 }], trailing: [], previous: null, next: null });

	it('derives the line gaps of a node a read returned', () => {
		const read = { $type: 5, $_layout: { at: at(5, 2, 3) } };
		holdReadTree(read, mintTreeToken(1));
		expect(readTrivia(read, gaps)?.leading).toEqual([9]);
	});

	it('gives a copy of a read node exactly the trivia it was given', () => {
		const read = { $type: 5, $_layout: { at: at(5, 2, 3) } };
		holdReadTree(read, mintTreeToken(1));
		const copy = { ...read, $_layout: { ...read.$_layout, trivia: { trailing: [8] } } };
		expect(readTrivia(copy, gaps)).toEqual({ trailing: [8] });
	});
});

describe('sourceGapOf', () => {
	const ATTRIBUTED = 20;
	const ALIAS_ENVELOPE = 21;
	const OTHER = 30;
	const token = mintTreeToken(1);
	const a = deep(1, 2, {});
	const b = deep(3, 4, {});
	const owner = deep(0, 5, {});
	holdTree(a, token);
	holdTree(b, token);
	holdTree(owner, token);
	const view: TriviaView = {
		trivia: () => undefined,
		derived: (node) => (node === b ? { previous: { start: 1, end: 2 }, next: null, leading: false, trailing: false } : undefined),
		isWrapper: (kindId) => kindId === ATTRIBUTED || kindId === ALIAS_ENVELOPE,
		isList: () => false
	};
	const gap = { $treeHandle: 3, $span: { start: 2, end: 3 } };

	it('judges a rebuilt group around one node by the node it holds', () => {
		const wrapper = { $type: ATTRIBUTED, $source: 2, _attribute_item: [], _content: b };
		expect(sourceGapOf(owner, [a, wrapper], 1, view, undefined)).toEqual(gap);
	});

	it('judges a rebuilt alias envelope by the node it holds, whatever its slot is called', () => {
		const wrapper = { $type: ALIAS_ENVELOPE, $source: 2, _name: b };
		expect(sourceGapOf(owner, [a, wrapper], 1, view, undefined)).toEqual(gap);
	});

	it('does not look through a kind a rebuild does not mint around one node', () => {
		const other = { $type: OTHER, $source: 2, _content: b };
		expect(sourceGapOf(owner, [a, other], 1, view, undefined)).toBeUndefined();
	});

	it('withholds the gap of a list whose owner carries no source', () => {
		const built = { $type: 4, $source: 2 };
		expect(sourceGapOf(built, [a, b], 1, view, undefined)).toBeUndefined();
		expect(sourceGapOf(owner, [a, b], 1, view, undefined)).toEqual(gap);
	});

	it('strips the changed side from the content a rebuilt wrapper holds, not from the wrapper', () => {
		const other = deep(7, 8, {});
		holdTree(other, token);
		const blank = 172;
		const run: TriviaView = {
			...view,
			trivia: (node) => (node === b ? { leading: [blank] } : undefined),
			derived: (node) => (node === b ? { previous: { start: 1, end: 2 }, next: null, leading: true, trailing: false } : undefined)
		};
		const list = (first: Record<string, unknown>) => ({ ...owner, _item: [first, { $type: ATTRIBUTED, $source: 2, _content: b }] });
		const contentTrivia = (first: Record<string, unknown>) => {
			const crossed = toTransportData(list(first) as never, run) as unknown as { _item: { _content: { $_layout?: { trivia?: unknown } } }[] };
			return crossed._item[1]!._content.$_layout?.trivia;
		};
		expect(contentTrivia(a)).toEqual({ leading: [blank] });
		expect(contentTrivia(other)).toBeUndefined();
	});

	it('does not look through a wrapper holding more than one node', () => {
		const wrapper = { $type: ATTRIBUTED, $source: 2, _attribute_item: [a], _content: b };
		expect(sourceGapOf(owner, [a, wrapper], 1, view, undefined)).toBeUndefined();
	});
});
