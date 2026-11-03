import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import rust from '@sittir/rust';
import { createEngine } from '../src/create-engine.ts';
import { portable } from '../src/portable/index.ts';
import { portableRuntimeTree } from '../src/portable/runtime.ts';
import { vocabularyFlags } from '../src/portable/vocabulary-paths.ts';

type Node = { readonly $type: number };
type Guard = (value: unknown) => boolean;
type View = Iterable<Node | number> & { ofType(kind: unknown): View };

const rs = await createEngine(rust);
const py = await createEngine(python);
const rustTree = portableRuntimeTree(rust) as unknown as Record<string, unknown>;
const pythonTree = portableRuntimeTree(python) as unknown as Record<string, unknown>;

const at = (tree: Record<string, unknown>, path: string): unknown =>
	path.split('.').reduce<unknown>((node, segment) => (node as Record<string, unknown> | undefined)?.[segment], tree);
const guard = (tree: Record<string, unknown>, path: string): Guard => at(tree, path) as Guard;
const first = (engine: { parse(source: string): unknown }, source: string, kind: number): Node =>
	[...(engine.parse(source) as { $query(): { readonly $descendants: View } }).$query().$descendants.ofType(kind)][0] as Node;
const rustFunction = (source: string): Node => first(rs, source, rust.kinds.FunctionItem);

describe('the portable runtime tree', () => {
	it('tests a flag through the kind its path reads', () => {
		const isAsync = guard(rustTree, 'declaration.function.async');
		expect(isAsync(rustFunction('async fn f() {}'))).toBe(true);
		expect(isAsync(rustFunction('fn f() {}'))).toBe(false);
	});

	it('tests a flag under a refinement, with the refinement', () => {
		const publicAsync = guard(rustTree, 'declaration.function.public.async');
		expect(publicAsync(rustFunction('pub async fn f() {}'))).toBe(true);
		expect(publicAsync(rustFunction('async fn f() {}'))).toBe(false);
		expect(publicAsync(rustFunction('pub fn f() {}'))).toBe(false);
	});

	it('answers false, without throwing, where the kind has no plan for the flag', () => {
		const pythonFunction = first(py, 'def f():\n\tpass\n', python.kinds.FunctionDefinition);
		expect(guard(pythonTree, 'declaration.function.const')(pythonFunction)).toBe(false);
		expect(guard(rustTree, 'declaration.function.async')(pythonFunction)).toBe(false);
	});

	it('has a guard for every flag the vocabulary declares on a path, and keeps the public tree flag-free', () => {
		for (const [path, segment] of vocabularyFlags) expect(typeof at(rustTree, `${path}.${segment}`), `${path}.${segment}`).toBe('function');
		expect(Object.keys(portable.is.declaration.function)).not.toContain('async');
	});
});

describe('a flag a presence keyword sets', () => {
	const firstOf = (source: string, kind: number): Node => first(rs, source, kind);
	it.each([
		['type.reference.exclusive', 'fn f(r: &mut u8) {}', 'fn f(r: &u8) {}', rust.kinds.ReferenceType],
		['declaration.parameter.mutable', 'fn f(mut x: u8) {}', 'fn f(x: u8) {}', rust.kinds.Parameter],
		['declaration.parameter.receiver.mutable', 'impl S { fn f(&mut self) {} }', 'impl S { fn f(&self) {} }', rust.kinds.SelfParameter]
	])('%s tells the keyword from its absence', (path, set, unset, kind) => {
		expect(guard(rustTree, path)(firstOf(set, kind))).toBe(true);
		expect(guard(rustTree, path)(firstOf(unset, kind))).toBe(false);
	});
});
