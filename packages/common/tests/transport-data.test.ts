import { describe, expect, it } from 'vitest';
import { markEdited, stripStructuralProvenance, toTransportData, treeHandleOf } from '../src/transport-data.ts';

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
/** A deep-read node: its own span and storage, and no handle of its own. */
const deep = (start: number, end: number, storage: Record<string, unknown>) => ({
	$type: 4,
	$source: 0,
	$named: true,
	$span: { start, end },
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

	it('folds a deep read, whose descendants carry a span and no handle of their own', () => {
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

describe('stripStructuralProvenance', () => {
	it('keeps the coordinate of an unedited node whose slots are projected from its text', () => {
		const node = { $type: 118, $text: "'a'", $span: { start: 3, end: 6 }, $handle: 17, _content: 'a', _b: true };
		expect(stripStructuralProvenance(node)).toEqual({
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
		expect(stripStructuralProvenance({ ...leaf })).toEqual({ ...leaf, $textOnly: true });
		const parent = { $type: 1, $span: { start: 0, end: 2 }, $handle: 2, _child: { ...leaf } };
		expect(stripStructuralProvenance(parent)).toEqual({ $type: 1, _child: { ...leaf, $textOnly: true } });
	});

	it('re-keys a surviving stub coordinate to the tree its span slices', () => {
		const stubLeaf = { $type: 5, $text: 'x', $span: { start: 1, end: 2 }, $parentHandle: 9, $childIndex: 0 };
		expect(stripStructuralProvenance({ ...stubLeaf })).toEqual({
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
		expect(stripStructuralProvenance(parent)).toEqual({ $type: 1, _child: { $type: 3, $span: { start: 0, end: 1 } } });
		const edited = { $type: 118, $text: "'a'", _content: 'b' };
		expect(stripStructuralProvenance(edited)).toEqual({ $type: 118, _content: 'b' });
	});
});
