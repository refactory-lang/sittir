import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const verifying = await createEngine(rust, { verifyStructure: 'runtime' });

const functionItem = (engine: typeof rs, source: string) => {
	const node = engine.parse(source).statements()[0]!;
	if (!engine.is.functionItem(node)) throw new Error('expected a function item');
	return node;
};

const parsedName = () => functionItem(rs, 'fn f() {}').name();

describe('every leaf renders itself (C1.1–C1.3)', () => {
	it('C1.1: a parsed leaf renders its text, toString returns the same, and a template string interpolates it', () => {
		const leaf = parsedName() as unknown as { $render(): string; toString(): string };
		expect(leaf.$render()).toBe('f');
		expect(leaf.toString()).toBe(leaf.$render());
		expect(`${leaf as unknown as object}`).toBe('f');
	});

	it('C1.2: a built leaf renders its text, toString returns the same, and a template string interpolates it', () => {
		const leaf = rs.build.identifier('x') as unknown as { $render(): string; toString(): string };
		expect(leaf.$render()).toBe('x');
		expect(leaf.toString()).toBe('x');
		expect(`${leaf as unknown as object}`).toBe('x');
	});

	it('C1.3: a parsed leaf keeps its kind, its tree token and its trivia, and is still admitted by a strict slot', () => {
		const leaf = parsedName();
		expect(leaf.$type).toBe(rs.kinds.Identifier);
		expect((leaf as unknown as { $trivia: unknown }).$trivia).toBeDefined();
		const fn = functionItem(verifying, 'fn g() {}');
		expect(fn.$with.name(leaf).$render()).toContain('f');
	});
});

describe('structural nodes (C1.5)', () => {
	it("C1.5: a structural node's toString equals its $render", () => {
		const fn = rs.parse('fn f() {}').statements()[0]! as unknown as { $render(): string; toString(): string };
		expect(fn.toString()).toBe(fn.$render());
	});
});
