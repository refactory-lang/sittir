import { describe, expect, it } from 'vitest';
import { markEdited, toTransportData } from '../src/transport-data.ts';

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
	$nodeHandle: 0,
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
			$nodeHandle: 0,
			_name: leaf('main', 3),
			_body: stub(8, 20, 2)
		};
		expect(toTransportData(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0
		});
	});

	it('folds a deep read, whose descendants carry a span and no handle of their own', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0,
			_body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] })
		};
		expect(toTransportData(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0
		});
	});

	it('keeps a node whose child was replaced, and strips its coordinate', () => {
		const rebuilt = { $type: 9, $source: 2, $named: true, _x: leaf('y', 0) };
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 20 },
			$nodeHandle: 0,
			_name: leaf('main', 3),
			_body: rebuilt
		};
		const out = toTransportData(node as never) as Record<string, unknown>;
		expect(out.$nodeHandle).toBeUndefined();
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
		const out = toTransportData(parent as never) as Record<string, unknown>;
		expect(out._a).toEqual(stub(0, 4, 0));
	});

	it('does not fold a node that carries trivia, at any depth', () => {
		const withOwnTrivia = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 4 },
			$nodeHandle: 0,
			$_trivia: { leading: [leaf('// c', 0)] },
			_a: stub(0, 4, 0)
		};
		const own = toTransportData(withOwnTrivia as never) as Record<string, unknown>;
		expect(own.$nodeHandle).toBeUndefined();
		expect(own.$_trivia).toBeDefined();

		const withChildTrivia = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 8 },
			$nodeHandle: 0,
			_a: { ...deep(0, 8, {}), $_trivia: { leading: [leaf('// c', 0)] } }
		};
		expect((toTransportData(withChildTrivia as never) as Record<string, unknown>).$nodeHandle).toBeUndefined();
	});

	it('never lets a structural node cross with $text or a stale coordinate', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$text: 'stale',
			$span: { start: 0, end: 5 },
			$nodeHandle: 0,
			_a: { $type: 9, $source: 2, $named: true }
		};
		const out = toTransportData(node as never) as Record<string, unknown>;
		expect(out.$text).toBeUndefined();
		expect(out.$nodeHandle).toBeUndefined();
		expect(out.$span).toBeUndefined();
	});

	it('leaves a kind id or a boolean in a slot inert', () => {
		const node = {
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 6 },
			$nodeHandle: 0,
			_marker: true,
			_keyword: 42
		};
		expect(toTransportData(node as never)).toEqual({
			$type: 3,
			$source: 0,
			$named: true,
			$span: { start: 0, end: 6 },
			$nodeHandle: 0
		});
	});
});

describe('markEdited', () => {
	it('detaches the coordinate and nothing else', () => {
		const out = markEdited({
			$type: 3,
			$span: { start: 0, end: 1 },
			$nodeHandle: 4,
			$childIndex: 1,
			$text: 'x',
			_a: 1
		});
		expect(out).toEqual({ $type: 3, $text: 'x', _a: 1 });
	});
});
