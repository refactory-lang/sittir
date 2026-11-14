import { it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../../python/src/index.ts';
import typescript from '../../typescript/src/index.ts';

const show = (value: unknown): string => JSON.stringify(value, (_k, x) => (typeof x === 'bigint' ? `${x}n` : x));
const members = (node: Record<string, unknown>): string => Object.keys(node).filter((key) => !key.startsWith('$') || key === '$path').join(',');

const find = (value: unknown, test: (node: Record<string, unknown>) => boolean, out: Record<string, unknown>[] = []): Record<string, unknown>[] => {
	if (Array.isArray(value)) for (const item of value) find(item, test, out);
	else if (value !== null && typeof value === 'object') {
		const node = value as Record<string, unknown>;
		if (test(node)) out.push(node);
		for (const [key, child] of Object.entries(node)) if (key !== '$parent') find(child, test, out);
	}
	return out;
};

const declaration = (node: Record<string, unknown>): boolean => typeof node.$path === 'string' && /^declaration\.(property|method|function)/.test(node.$path);

it('getter probe', async () => {
	const cases = [
		[python, 'python', ['class C:\n    @property\n    def x(self) -> int:\n        return 1\n', 'class C:\n    @property\n    def x(self):\n        return 1\n', 'class C:\n    @property\n    def x(this) -> int:\n        return 1\n', 'class C:\n    @property\n    def y(self, extra) -> int:\n        return 1\n', 'class C:\n    @x.setter\n    def x(self, value) -> None:\n        pass\n']],
		[typescript, 'typescript', ['class C { get x(): number { return 1; } set x(v: number) {} }', 'interface I { get x(): number; set x(v: number); }', 'abstract class A { abstract get x(): number; abstract set x(v: number); }', 'abstract class B { abstract accessor x: number; }']]
	] as const;
	for (const [language, name, sources] of cases) {
		const runtime = await portableRuntime(await createEngine(language as never, { api: 'strict' }));
		for (const source of sources) {
			const tree = runtime.engine.parse(source);
			const projected = runtime.read(tree);
			for (const node of find(projected, declaration)) console.log(`PROJECT ${name} ${show(source)} ${node.$path} {${members(node)}} parameters=${show(node.parameters)}`);
			try {
				console.log(`BUILD ${name} ${show(source)} -> ${show(String(runtime.engine.render(runtime.build(projected as never) as never)))}`);
			} catch (error) {
				console.log(`BUILD ${name} ${show(source)} refuses ${(error as Error).message.slice(0, 200)}`);
			}
		}
	}
	const runtime = await portableRuntime(await createEngine(python as never, { api: 'strict' }));
	for (const [label, input] of [
		['getter', { $path: 'declaration.property.getter', name: 'x', type: 'int', body: { $path: 'statement.block', statements: [{ $path: 'statement.pass' }] } }],
		['getter no type', { $path: 'declaration.property.getter', name: 'x', body: { $path: 'statement.block', statements: [{ $path: 'statement.pass' }] } }]
	] as const) {
		try {
			console.log(`FRESH python ${label} -> ${show(String(runtime.engine.render(runtime.build(input as never) as never)))}`);
		} catch (error) {
			console.log(`FRESH python ${label} refuses ${(error as Error).message.slice(0, 200)}`);
		}
	}
}, 120_000);
