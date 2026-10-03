import { describe, expect, it } from 'vitest';
import { markEdited, detachCoordinates, holdReadTree, holdTree, sourceGapOf, STORED_TRIVIA, toTransportData, treeHandleOf, type TriviaView } from '../src/transport-data.ts';
import { readTrivia } from '../src/utils.ts';
import { mintTreeToken, treeTokenOf } from '../src/tree-token.ts';

// A coordinate crosses only while it holds its tree, so a copy of each
// hand-written node below is given one, the way a read gives it to what it
// returns.
const project = (node: never): ReturnType<typeof toTransportData> => {
	const held = structuredClone(node);
	holdTree(held, mintTreeToken(1));
	return toTransportData(held, STORED_TRIVIA);
};

const leaf = (text: string, start: number) => ({
	$type: 1,
	$source: 0,
	$named: true,
	$text: text,
	$span: { start, end: start + text.length }
});
const stub = (start: number, end: number, childIndex: number) => ({
	$type: 2,
	$source: 0,
	$named: true,
	$span: { start, end },
	$parentHandle: 0,
	$childIndex: childIndex
});
/** A child a read expanded: its own span and storage, and the tag of its tree. */
const deep = (start: number, end: number, storage: Record<string, unknown>) => ({
	$type: 4,
	$source: 0,
	$named: true,
	$span: { start, end },
	$treeHandle: 0,
	...storage
});

describe('toTransportData', () => {
	it('folds an unedited node with only stubs and leaves below it to its coordinate', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$handle: 0,
			_name: leaf('main', 3),
			_body: stub(8, 20, 2)
		};
		expect(project(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$treeHandle: 0
		});
	});

	it('folds a deep read by its root, whatever handles its descendants carry', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$handle: 0,
			_body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] })
		};
		expect(project(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$treeHandle: 0
		});
	});

	it('keeps a node whose child was replaced, and strips its coordinate', () => {
		const rebuilt = { $type: 9, $source: 2, $named: true, _x: leaf('y', 0) };
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$handle: 0,
			_name: leaf('main', 3),
			_body: rebuilt
		};
		const out = project(node as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$span).toBeUndefined();
		expect(out._body).toEqual(rebuilt);
	});

	it('folds an untouched child inside an edited parent', () => {
		const parent = {
			$type: 3,
			$source: 0,
			$named: true,
			_a: stub(0, 4, 0),
			_b: { $type: 9, $source: 2, $named: true }
		};
		const out = project(parent as never) as unknown as Record<string, unknown>;
		expect(out._a).toEqual({ $type: 2, $source: 0, $named: true, $span: { start: 0, end: 4 }, $treeHandle: 0 });
	});

	it('folds an expanded child of an edited parent by its own span', () => {
		const parent = {
			$type: 3,
			$source: 0,
			$named: true,
			_name: { $type: 9, $source: 2, $named: true, $text: 'g' },
			_body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] })
		};
		const out = project(parent as never) as unknown as Record<string, unknown>;
		expect(out._body).toEqual({ $type: 4, $source: 0, $named: true, $span: { start: 8, end: 20 }, $treeHandle: 0 });
	});

	it('does not fold a node whose own trivia sits outside its span, but folds over a child that carries some', () => {
		const withOwnTrivia = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 4 },
			$handle: 0,
			$_trivia: { leading: [leaf('// c', 0)] },
			_a: stub(0, 4, 0)
		};
		const own = project(withOwnTrivia as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(own)).toBeUndefined();
		expect(own.$_trivia).toBeDefined();

		// A child's comments lie inside the parent's span: the parent's bytes
		// carry them, so a deep read of a commented file still folds like a
		// shallow one.
		const withChildTrivia = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 8 },
			$handle: 0,
			_a: { ...deep(5, 8, {}), $_trivia: { leading: [leaf('// c', 0)] } }
		};
		expect(project(withChildTrivia as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 8 },
			$treeHandle: 0
		});
	});

	it('never lets a structural node cross with $text or a stale coordinate', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$text: 'stale',
			$span: { start: 0, end: 5 },
			$handle: 0,
			_a: { $type: 9, $source: 2, $named: true }
		};
		const out = project(node as never) as unknown as Record<string, unknown>;
		expect(out.$text).toBeUndefined();
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$span).toBeUndefined();
	});

	it('sends a leaf that kept its trivia as itself, never as a coordinate', () => {
		const withTrivia = { ...leaf('2', 12), $parentHandle: 12, $childIndex: 1, $_trivia: { trailing: [leaf('# two', 14)] } };
		const out = project(withTrivia as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$childIndex).toBeUndefined();
		expect(out.$text).toBe('2');
		expect(out.$_trivia).toBeDefined();
	});

	it('leaves a kind id or a boolean in a slot inert', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 6 },
			$handle: 0,
			_marker: true,
			_keyword: 42
		};
		expect(project(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 6 },
			$treeHandle: 0
		});
	});
});

describe('treeHandleOf', () => {
	it('reads the tree from whichever handle a node carries', () => {
		expect(treeHandleOf({ $handle: 3 })).toBe(3);
		expect(treeHandleOf({ $parentHandle: 4, $childIndex: 0 })).toBe(4);
		expect(treeHandleOf({ $treeHandle: 5 })).toBe(5);
		expect(treeHandleOf({ $childIndex: 0 })).toBeUndefined();
	});
});

describe('markEdited', () => {
	it('detaches the coordinate and nothing else', () => {
		const out = markEdited({
			$type: 3,
			$span: { start: 0, end: 1 },
			$parentHandle: 4,
			$childIndex: 1,
			$textOnly: true,
			$text: 'x',
			_a: 1
		});
		expect(out).toEqual({ $type: 3, $text: 'x', _a: 1 });
	});
});

describe('detachCoordinates', () => {
	it('keeps the coordinate of an unedited node whose slots are projected from its text', () => {
		const node = { $type: 118, $text: "'a'", $span: { start: 3, end: 6 }, $handle: 17, _content: 'a', _b: true };
		expect(detachCoordinates(node)).toEqual({
			$type: 118,
			$text: "'a'",
			$span: { start: 3, end: 6 },
			$treeHandle: 17,
			$textOnly: true,
			_content: 'a',
			_b: true
		});
	});

	it('stamps a surviving coordinate text-only, and a stripped node carries none to stamp', () => {
		const leaf = { $type: 5, $text: 'x', $span: { start: 1, end: 2 }, $treeHandle: 9 };
		expect(detachCoordinates({ ...leaf })).toEqual({ ...leaf, $textOnly: true });
		const parent = { $type: 1, $span: { start: 0, end: 2 }, $handle: 2, _child: { ...leaf } };
		expect(detachCoordinates(parent)).toEqual({ $type: 1, _child: { ...leaf, $textOnly: true } });
	});

	it('re-keys a surviving stub coordinate to the tree its span slices', () => {
		const stubLeaf = { $type: 5, $text: 'x', $span: { start: 1, end: 2 }, $parentHandle: 9, $childIndex: 0 };
		expect(detachCoordinates({ ...stubLeaf })).toEqual({
			$type: 5,
			$text: 'x',
			$span: { start: 1, end: 2 },
			$childIndex: 0,
			$treeHandle: 9,
			$textOnly: true
		});
	});

	it('strips a node that holds child nodes, and a node an edit detached from its span', () => {
		const parent = { $type: 1, $text: 'x', $span: { start: 0, end: 1 }, $handle: 2, _child: { $type: 3, $span: { start: 0, end: 1 } } };
		expect(detachCoordinates(parent)).toEqual({ $type: 1, _child: { $type: 3, $span: { start: 0, end: 1 } } });
		const edited = { $type: 118, $text: "'a'", _content: 'b' };
		expect(detachCoordinates(edited)).toEqual({ $type: 118, _content: 'b' });
	});
});

describe('the tree token a parsed object holds', () => {
	const token = mintTreeToken(4);
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
		const folded = toTransportData(held({ $type: 5, $span: { start: 1, end: 2 }, $handle: 9 }) as never, STORED_TRIVIA);
		expect(folded).toEqual({ $type: 5, $span: { start: 1, end: 2 }, $treeHandle: 9 });
		expect(treeTokenOf(folded)).toBeUndefined();
		const rebuilt = toTransportData(held({ $type: 1, _child: { $type: 5, $text: 'x' } }) as never, STORED_TRIVIA) as never as { _child: object };
		expect(rebuilt).toEqual({ $type: 1, _child: { $type: 5, $text: 'x' } });
		expect(treeTokenOf(rebuilt)).toBeUndefined();
		expect(treeTokenOf(rebuilt._child)).toBeUndefined();
	});

	it('is detached with the coordinate by an edit, although the edit copies the node by spread', () => {
		const edited = markEdited(held({ $type: 1, $handle: 2, $span: { start: 0, end: 1 }, _a: 1 }));
		expect(edited).toEqual({ $type: 1, _a: 1 });
		expect(treeTokenOf(edited)).toBeUndefined();
	});

	it('is removed from transport data detached in place', () => {
		const leaf = detachCoordinates(held({ $type: 5, $text: 'x', $span: { start: 1, end: 2 }, $treeHandle: 9 }));
		expect(leaf).toEqual({ $type: 5, $text: 'x', $span: { start: 1, end: 2 }, $treeHandle: 9, $textOnly: true });
		expect(treeTokenOf(leaf)).toBeUndefined();
	});

	it('is removed from the trivia a detached node owns, at every side and depth', () => {
		const comment = () => ({ $type: 7, $span: { start: 0, end: 1 }, $other: [{ $type: 8 }] });
		const node = detachCoordinates(
			held({ $type: 1, _a: 1, $_trivia: { leading: [comment()], trailing: [comment()], inner: { gap: [comment()] } } })
		);
		const entries = [...node.$_trivia.leading, ...node.$_trivia.trailing, ...node.$_trivia.inner.gap];
		expect(entries).toHaveLength(3);
		for (const entry of entries) {
			expect(treeTokenOf(entry)).toBeUndefined();
			expect(treeTokenOf(entry.$other[0]!)).toBeUndefined();
		}
	});

	it('is required of a coordinate: one that holds no tree is refused, as a node, as a child and as a trivia entry', () => {
		const refusal = /does not hold that tree.*parse the source here/;
		const coordinate = { $type: 5, $span: { start: 1, end: 2 }, $handle: 9 };
		expect(() => toTransportData(coordinate as never, STORED_TRIVIA)).toThrow(refusal);
		expect(() => toTransportData({ $type: 1, _child: coordinate } as never, STORED_TRIVIA)).toThrow(refusal);
		const comment = { $type: 7, $span: { start: 0, end: 1 }, $treeHandle: 9 };
		expect(() => toTransportData({ $type: 1, _a: 1, $_trivia: { inner: { gap: [comment] } } } as never, STORED_TRIVIA)).toThrow(refusal);
		expect(() => toTransportData(structuredClone(held({ ...coordinate })) as never, STORED_TRIVIA)).toThrow(refusal);
	});

	it('is not required of built data, which names no tree', () => {
		const built = { $type: 1, _child: { $type: 5, $text: 'x' } };
		expect(toTransportData(built as never, STORED_TRIVIA)).toEqual(built);
	});

	it('passes with a spread copy made on this thread', () => {
		const coordinate = held({ $type: 5, $span: { start: 1, end: 2 }, $handle: 9 });
		expect(toTransportData({ ...coordinate } as never, STORED_TRIVIA)).toEqual({ $type: 5, $span: { start: 1, end: 2 }, $treeHandle: 9 });
	});
});

describe('line-gap whitespace at the render root', () => {
	const comment = { $type: 3, $source: 0, $named: true, $text: '// c' };

	it('leaves out the whitespace at the root edges and keeps what sits between its comment and the root', () => {
		const node = { $type: 5, $source: 0, $named: true, $text: 'b', $_trivia: { leading: [9, comment, 8], trailing: [8] } };
		expect(toTransportData(node as never, STORED_TRIVIA)).toEqual({ $type: 5, $source: 0, $named: true, $text: 'b', $_trivia: { leading: [comment, 8] } });
	});

	it('keeps every entry below the root', () => {
		const child = { $type: 5, $source: 0, $named: true, $text: 'b', $_trivia: { leading: [9], trailing: [8] } };
		const root = { $type: 6, $source: 0, $named: true, _body: child, $_trivia: { leading: [9] } };
		expect(toTransportData(root as never, STORED_TRIVIA)).toEqual({ $type: 6, $source: 0, $named: true, _body: child });
	});
});

describe('readTrivia', () => {
	const gaps = () => ({ leading: [{ kind: 9, start: 0 }], trailing: [], previous: null, next: null });

	it('derives the line gaps of a node a read returned', () => {
		const read = { $type: 5, $handle: 7, $span: { start: 2, end: 3 } };
		holdReadTree(read, mintTreeToken(1));
		expect(readTrivia(read, gaps)?.leading).toEqual([9]);
	});

	it('gives a copy of a read node exactly the trivia it was given', () => {
		const read = { $type: 5, $handle: 7, $span: { start: 2, end: 3 } };
		holdReadTree(read, mintTreeToken(1));
		const copy = { ...read, $_trivia: { trailing: [8] } };
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
		isWrapper: (kindId) => kindId === ATTRIBUTED || kindId === ALIAS_ENVELOPE
	};
	const gap = { $treeHandle: 0, $span: { start: 2, end: 3 } };

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

	it('does not look through a wrapper holding more than one node', () => {
		const wrapper = { $type: ATTRIBUTED, $source: 2, _attribute_item: [a], _content: b };
		expect(sourceGapOf(owner, [a, wrapper], 1, view, undefined)).toBeUndefined();
	});
});
