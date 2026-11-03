import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import typescript from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(typescript, { api: 'strict' }));
const render = (node: unknown): string => String(runtime.engine.render(node as never));

describe('the portable build through the strict table', () => {
	it("builds an arrow function's single parameter through the mount that seats it at the function's key", () => {
		expect(render(runtime.build({ $path: 'expression.lambda', parameters: 'a', body: 'x' }))).toBe('a => x');
	});

	it('builds the bare construct refinement without parentheses, and the construct call with parentheses whether its arguments are empty or left out', () => {
		expect(render(runtime.build({ $path: 'expression.call.construct.bare', function: 'X' }))).toBe('new X');
		expect(render(runtime.build({ $path: 'expression.call.construct', function: 'X', arguments: [] }))).toBe('new X()');
		expect(render(runtime.build({ $path: 'expression.call.construct', function: 'X' }))).toBe('new X()');
	});

	it("routes an in expression's operands through the form its operator preset mounts, not the holder's own operand slots", () => {
		expect(render(runtime.build({ $path: 'expression.binary.membership.in', left: 'a', right: 'b' }))).toBe('a in b');
	});

	it('takes the export form whose slot seats the clause given: a namespace export through the namespace form', () => {
		const source = { $path: 'literal.string', elements: ['m'] };
		expect(render(runtime.build({ $path: 'statement.export', exportClause: { $path: 'clause.export.namespace', moduleExportName: 'ns' }, source }))).toBe('export * as ns from "m";');
	});

	it('builds an export from a module through the form that takes the clause and the source together, in either order, and refuses the source alone', () => {
		const source = { $path: 'literal.string', elements: ['m'] };
		const exportClause = { $path: 'clause.export', exportSpecifiers: [{ $path: 'clause.export.specifier', name: 'a' }] };
		for (const structure of [{ $path: 'statement.export', source, exportClause }, { $path: 'statement.export', exportClause, source }]) {
			const built = runtime.build(structure);
			expect(render(built)).toBe('export { a } from "m";');
			expect(runtime.read(built as never)).toEqual({ $path: 'statement.export', exportClause, source });
		}
		expect(() => runtime.build({ $path: 'statement.export', source })).toThrow('statement.export builds this structure (members source); it needs exportClause');
	});

	it('builds an exported declaration in the plain form at statement.export and through the default keyword at statement.export.default, each reading back as its path', () => {
		const declaration = { $path: 'declaration.class', name: 'C', body: [], decorators: [] };
		for (const [path, text] of [['statement.export', 'export class C {}'], ['statement.export.default', 'export default class C {}']] as const) {
			const built = runtime.build({ $path: path, declaration });
			expect(render(built)).toBe(text);
			expect(runtime.read(built as never)).toMatchObject({ $path: path, declaration });
		}
	});

	it("writes a member access's dot when the optional chain flag is unset, and gives a flag's preset builder the member's text", () => {
		const member = { $path: 'expression.member', object: 'a', property: 'b' };
		expect(render(runtime.build(member))).toBe('a.b');
		expect(render(runtime.build({ ...member, $flags: ['optionalChain'] }))).toBe('a?.b');
		expect(render(runtime.build({ ...member, $flags: ['privateName'] }))).toBe('a.#b');
	});

	it('builds a number $value by its type at literal.number, a hex integer through its numeric slot, and a boolean by its declared value', () => {
		expect((runtime.build({ $path: 'literal.number', $value: 1.5 }) as { $type: number }).$type).toBe(typescript.kinds.NumberFloatPoint);
		expect(render(runtime.build({ $path: 'literal.number', $value: 1.5 }))).toBe('1.5');
		expect(render(runtime.build({ $path: 'literal.number.integer.hex', $value: 255 }))).toBe('0xff');
		expect(runtime.build({ $path: 'literal.boolean', $value: true })).toBe(typescript.kinds.True);
	});

	it('builds a default export of a value through the nested mount, and of a declaration through the default form', () => {
		expect(render(runtime.build({ $path: 'statement.export.default', value: 'x' }))).toBe('export default x;');
		const declaration = { $path: 'declaration.function', name: 'f', parameters: [], body: { $path: 'statement.block', statements: [] } };
		expect(render(runtime.build({ $path: 'statement.export.default', declaration }))).toBe('export default function f() {}');
	});

	it("builds a catch parameter at the key its clause takes flattened, and an exported declaration without a default", () => {
		const block = { $path: 'statement.block', statements: [] };
		expect(render(runtime.build({ $path: 'clause.catch', name: 'e', body: block }))).toBe('catch (e) {}');
		const declaration = { $path: 'declaration.function', name: 'f', parameters: [], body: block };
		expect(render(runtime.build({ $path: 'statement.export', declaration }))).toBe('export function f() {}');
	});
});
