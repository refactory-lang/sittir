import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const render = (node: unknown): string => String(runtime.engine.render(node as never));

describe('the portable build through the strict table', () => {
	it('builds a function whose block sits in the suite that holds it, and a simple statement in the list that holds it', () => {
		const body = { $path: 'statement.block', statements: [{ $path: 'statement.empty' }] };
		expect(render(runtime.build({ $path: 'declaration.function', name: 'f', parameters: [], body }))).toBe('def f():\n    pass\n');
	});

	it("builds an except clause's exception through the mount that seats it at the clause's key, and a list of exceptions through the nested mount", () => {
		const body = [{ $path: 'statement.empty' }];
		expect(render(runtime.build({ $path: 'clause.catch', type: 'E', body }))).toBe('except E: pass\n');
		expect(render(runtime.build({ $path: 'clause.catch', type: 'E', name: 'e', body }))).toBe('except E as e: pass\n');
		expect(render(runtime.build({ $path: 'clause.catch', type: ['E', 'F'], body }))).toBe('except E, F: pass\n');
	});

	it('builds a float $value split into its form\'s parts, and a boolean by its declared value', () => {
		expect(render(runtime.build({ $path: 'literal.number.float', $value: 2 }))).toBe('2.0');
		expect(render(runtime.build({ $path: 'literal.number.float', $value: 1.5 }))).toBe('1.5');
		expect(render(runtime.build({ $path: 'literal.number.float.scientific', $value: 1e21 }))).toBe('1e21');
		expect(render(runtime.build({ $path: 'literal.number.integer.hex', $value: 255 }))).toBe('0xff');
		expect(runtime.build({ $path: 'literal.boolean', $value: false })).toBe(python.kinds.False);
		expect(() => runtime.build({ $path: 'literal.number.float', $value: Number.NaN })).toThrow(/literal\.number\.float: no python literal spells NaN/);
	});

	it('takes text as given at a slot that holds text', () => {
		expect(render(runtime.build({ $path: 'literal.number.float', integer: '1', fraction: '5' }))).toBe('1.5');
	});

	it('takes a route only beside the members that complete the kind it enters', () => {
		expect(() => runtime.build({ $path: 'clause.catch', name: 'e', body: [{ $path: 'statement.empty' }] })).toThrow(/clause\.catch: name builds only beside type/);
		expect(render(runtime.build({ $path: 'clause.resource.item', value: 'a', name: 'b' }))).toBe('a as b');
		expect(render(runtime.build({ $path: 'clause.resource.item', value: 'a' }))).toBe('a');
		expect(() => runtime.build({ $path: 'clause.resource.item', name: 'b' })).toThrow(/clause\.resource\.item: name builds only beside value/);
	});

	it('builds a list given for a slot that holds one value through the container that holds the list', () => {
		expect(render(runtime.build({ $path: 'declaration.function', name: 'f', parameters: [], body: [{ $path: 'statement.empty' }] }))).toBe('def f(): pass\n');
	});
});
