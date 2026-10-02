import { describe, expect, it } from 'vitest';
import { markEdited, detachCoordinates, toTransportData, treeHandleOf } from '../src/transport-data.ts';
import { mintTreeToken } from '../src/tree-token.ts';

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
		expect(toTransportData(node as never)).toEqual({
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
		expect(toTransportData(node as never)).toEqual({
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
		const out = toTransportData(node as never) as unknown as Record<string, unknown>;
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
		const out = toTransportData(parent as never) as unknown as Record<string, unknown>;
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
		const out = toTransportData(parent as never) as unknown as Record<string, unknown>;
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
		const own = toTransportData(withOwnTrivia as never) as unknown as Record<string, unknown>;
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
		expect(toTransportData(withChildTrivia as never)).toEqual({
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
		const out = toTransportData(node as never) as unknown as Record<string, unknown>;
		expect(out.$text).toBeUndefined();
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$span).toBeUndefined();
	});

	it('sends a leaf that kept its trivia as itself, never as a coordinate', () => {
		const withTrivia = { ...leaf('2', 12), $parentHandle: 12, $childIndex: 1, $_trivia: { trailing: [leaf('# two', 14)] } };
		const out = toTransportData(withTrivia as never) as unknown as Record<string, unknown>;
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
		expect(toTransportData(node as never)).toEqual({
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

	it('does not cross: a folded coordinate, a rebuilt node and a kept leaf all drop it', () => {
		const folded = { $type: 5, $span: { start: 1, end: 2 }, $handle: 9, $tree: token };
		expect(toTransportData(folded as never)).toEqual({ $type: 5, $span: { start: 1, end: 2 }, $treeHandle: 9 });
		const rebuilt = { $type: 1, $tree: token, _child: { $type: 5, $text: 'x', $tree: token } };
		expect(toTransportData(rebuilt as never)).toEqual({ $type: 1, _child: { $type: 5, $text: 'x' } });
	});

	it('is detached with the coordinate by an edit', () => {
		expect(markEdited({ $type: 1, $handle: 2, $span: { start: 0, end: 1 }, $tree: token, _a: 1 })).toEqual({
			$type: 1,
			_a: 1
		});
	});

	it('is removed from transport data detached in place', () => {
		const leaf = { $type: 5, $text: 'x', $span: { start: 1, end: 2 }, $treeHandle: 9, $tree: token };
		expect(detachCoordinates({ ...leaf })).toEqual({
			$type: 5,
			$text: 'x',
			$span: { start: 1, end: 2 },
			$treeHandle: 9,
			$textOnly: true
		});
	});

	it('is removed from the trivia a detached node owns, at every side and depth', () => {
		const comment = () => ({ $type: 7, $span: { start: 0, end: 1 }, $tree: token, $other: [{ $type: 8, $tree: token }] });
		const node = {
			$type: 1,
			_a: 1,
			$tree: token,
			$_trivia: { leading: [comment()], trailing: [comment()], inner: { gap: [comment()] } }
		};
		const bare = { $type: 7, $span: { start: 0, end: 1 }, $other: [{ $type: 8 }] };
		expect(detachCoordinates(node)).toEqual({
			$type: 1,
			_a: 1,
			$_trivia: { leading: [bare], trailing: [bare], inner: { gap: [bare] } }
		});
	});

	it('is refused at the projection when another table minted it, on a coordinate and on a trivia entry', () => {
		const foreign = { ...token, table: 'the table of another thread or process' };
		const refusal = /another tree table.*parse the source on this thread/;
		const coordinate = { $type: 5, $span: { start: 1, end: 2 }, $handle: 9, $tree: foreign };
		expect(() => toTransportData(coordinate as never)).toThrow(refusal);
		expect(() => toTransportData({ $type: 1, _child: coordinate } as never)).toThrow(refusal);
		const comment = { $type: 7, $span: { start: 0, end: 1 }, $treeHandle: 9, $tree: foreign };
		expect(() => toTransportData({ $type: 1, _a: 1, $_trivia: { inner: { gap: [comment] } } } as never)).toThrow(refusal);
	});

	it('is not required, and a copy made on this thread passes', () => {
		const coordinate = { $type: 5, $span: { start: 1, end: 2 }, $handle: 9 };
		const crossed = { $type: 5, $span: { start: 1, end: 2 }, $treeHandle: 9 };
		expect(toTransportData(coordinate as never)).toEqual(crossed);
		expect(toTransportData(structuredClone({ ...coordinate, $tree: token }) as never)).toEqual(crossed);
	});
});
