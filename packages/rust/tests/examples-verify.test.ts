// Runtime verification of the COMPILE-CHECKED use-case examples
// (01/02/07/09 — the `type-check:examples` include set): every export of
// those modules executes against the native engine and produces the
// output the guide promises. Typecheck pins the surface; this suite pins
// the behavior. The pending-surface examples (03–06, 08, 10–16) join as
// their APIs land.
import { describe, expect, it } from 'vitest';
import {
	explicitMainFunction,
	nestedGreetFunction,
	fromGreetFunction,
	minimalMainFunction,
	immutableFunctionUpdates,
	structSideBySide
} from '../../../examples/01-construct-nodes.ts';
import { renderMainFunction, roundTrip } from '../../../examples/02-render-round-trip.ts';
import { readSource, readFirstFunction, wrappedLazyAccess } from '../../../examples/07-read-source.ts';
import { summarizeTopLevelItems } from '../../../examples/09-type-guards.ts';

describe('examples/01 construct nodes', () => {
	it('explicit strict construction renders a pub main', () => {
		const r = explicitMainFunction();
		expect(r.name).toBe('main');
		expect(r.source).toContain('pub fn main');
	});
	it('nested strict construction renders greet with its parameter', () => {
		const text = nestedGreetFunction().$render();
		expect(text).toContain('pub fn greet');
		expect(text).toContain('name');
		expect(text).toContain('String');
	});
	it('from() accepts keyword strings and bare parameters', () => {
		expect(fromGreetFunction().$render()).toContain('pub fn greet');
	});
	it('minimal from() builds an empty-bodied main', () => {
		expect(minimalMainFunction().$render()).toContain('fn main');
	});
	it('$with updates immutably and keeps the surface', () => {
		expect(immutableFunctionUpdates().$render()).toContain('greet');
	});
	it('strict and from() spellings render identically', () => {
		const { strictFn, fromFn } = structSideBySide();
		expect(strictFn.$render()).toBe(fromFn.$render());
	});
});

describe('examples/02 render round trip', () => {
	it('renders a pub main function', () => {
		expect(renderMainFunction()).toContain('pub fn main');
	});
	it('re-parses a rendered parsed root to the same tree', () => {
		const { rendered, reparsesEqual } = roundTrip(renderMainFunction());
		expect(rendered).toContain('pub fn main');
		expect(reparsesEqual).toBe(true);
	});
	it('re-parses a multi-item source file to the same tree', () => {
		const source = 'struct A { a: u8, b: String }\nfn f(a: &A) -> u8 { a.a + 1 }\n';
		expect(roundTrip(source).reparsesEqual).toBe(true);
	});
});

describe('examples/07 read source', () => {
	const source = 'pub fn main() { }\n';
	it('reads a root node', () => {
		expect(readSource(source)).toBeDefined();
	});
	it('finds the first function and reads its name', () => {
		expect(readFirstFunction(source)?.name).toBe('main');
	});
	it('lazily accesses body statements through the wrap surface', () => {
		expect(wrappedLazyAccess(source)?.statements).toBeDefined();
	});
});

describe('examples/09 type guards', () => {
	it('summarizes functions and structs from parsed source', () => {
		expect(summarizeTopLevelItems('pub fn main() { }\npub struct Config;\n')).toEqual([
			'Function: main',
			'Struct: Config'
		]);
	});
});
