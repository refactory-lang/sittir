import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import type { NodeStorageOptions } from '@sittir/types';
import python from '../src/index.ts';

type Read = { readonly $path: string; readonly [member: string]: unknown };

const STORAGES: readonly (readonly [string, NodeStorageOptions])[] = [
	['arena storage', {}],
	['object storage', { nodeStorage: 'object' }]
];
const classOf = (...lines: readonly string[]): string => `class A:\n${lines.map((line) => `    ${line}\n`).join('')}`;
const block = (statement: string): Read => ({ $path: 'statement.block', statements: [statement] });
const cache: Read = { $path: 'attribute.decorator', content: { $path: 'expression.member', object: 'functools', property: 'cache' } };

const runtimes = new Map(await Promise.all(STORAGES.map(async ([name, storage]) => [name, await portableRuntime(await createEngine(python, { api: 'strict', ...storage }))] as const)));

describe.each(STORAGES)('a decorator that states a fact is that fact, in %s', (name) => {
	const runtime = runtimes.get(name)!;
	const memberOf = (source: string): Read => {
		const file = runtime.read(runtime.engine.parse(source)) as Read;
		return (((file.statements as readonly Read[])[0]!.body as Read).statements as readonly Read[])[0]!;
	};
	const inClass = (member: Read): string =>
		String(runtime.engine.render(runtime.build({ $path: 'declaration.class', name: 'A', bases: [], body: { $path: 'statement.block', statements: [member] } } as never) as never));

	it.each([
		[classOf('@property', 'def x(self) -> int:', '    return 1'), 'declaration.property.getter', {}, { getter: { index: 0, spelling: 'property' } }],
		[classOf('@x.setter', 'def x(self, v):', '    pass'), 'declaration.property.setter', {}, { setter: { index: 0 } }],
		[classOf('@staticmethod', 'def f():', '    pass'), 'declaration.method', { $flags: ['static'] }, { static: { index: 0, spelling: 'staticmethod' } }],
		[classOf('@override', 'def f(self):', '    pass'), 'declaration.method', { $flags: ['override'] }, { override: { index: 0, spelling: 'override' } }],
		[classOf('@typing.override', 'def f(self):', '    pass'), 'declaration.method', { $flags: ['override'] }, { override: { index: 0, spelling: 'typing.override' } }]
	])('reads %j with its decorator consumed, where it sat and how it was spelled recorded, and builds it back', (source, path, flags, at) => {
		expect(memberOf(source)).toMatchObject({ $path: path, ...flags, $at: at, decorators: [] });
		expect(String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(source)) as never) as never))).toBe(source);
	});

	it("reads a getter's return annotation as the property's type", () => {
		expect(memberOf(classOf('@property', 'def x(self) -> int:', '    return 1'))).toMatchObject({ type: { $path: 'type', content: 'int' } });
	});

	it("reads a setter's return annotation as its return type, never as the property's type, and builds it back", () => {
		const source = classOf('@x.setter', 'def x(self, v: int) -> None:', '    pass');
		const member = memberOf(source);
		expect(member).toMatchObject({ $path: 'declaration.property.setter', returnType: { $path: 'type' } });
		expect(member.type).toBeUndefined();
		expect(inClass(member)).toBe(source);
	});

	it("reads an accessor's docstring as a method's is read, and builds it back", () => {
		const source = classOf('@property', 'def x(self) -> int:', '    """The x."""', '    return 1');
		const member = memberOf(source);
		const method = memberOf(classOf('def x(self) -> int:', '    """The x."""', '    return 1'));
		expect(member).toMatchObject({ $path: 'declaration.property.getter', body: method.body });
		expect(member.doc).toEqual(method.doc);
		expect(inClass(member)).toBe(source);
	});

	it("reads a generic accessor's type parameters and builds them back", () => {
		const source = classOf('@property', 'def x[T](self) -> T:', '    return self._x');
		const member = memberOf(source);
		expect(member).toMatchObject({ $path: 'declaration.property.getter', typeParameters: [{}] });
		expect(inClass(member)).toBe(source);
	});

	it.each([
		[classOf('@property', '@functools.cache', 'def x(self):', '    return 1'), 0],
		[classOf('@functools.cache', '@property', 'def x(self):', '    return 1'), 1]
	])('keeps the order of %j: the getter records its index, the other decorator stays, and a rebuild puts the getter back where it was', (source, index) => {
		const member = memberOf(source);
		expect(member).toMatchObject({ $path: 'declaration.property.getter', $at: { getter: { index, spelling: 'property' } }, decorators: [cache] });
		expect(inClass(member)).toBe(source);
	});

	it('builds fresh facts outermost, descriptor decorators above @override as PEP 698 orders them', () => {
		const getter = { $path: 'declaration.property.getter', $flags: ['override'], name: 'x', parameters: ['self'], body: block('pass') };
		expect(inClass(getter)).toBe(classOf('@property', '@override', 'def x(self):', '    pass'));
		expect(inClass({ ...getter, decorators: [cache] })).toBe(classOf('@property', '@override', '@functools.cache', 'def x(self):', '    pass'));
		expect(inClass({ $path: 'declaration.method', $flags: ['static'], name: 'f', parameters: [], body: block('pass') })).toBe(classOf('@staticmethod', 'def f():', '    pass'));
		expect(inClass({ $path: 'declaration.property.setter', name: 'x', parameters: ['self', 'v'], body: block('pass') })).toBe(classOf('@x.setter', 'def x(self, v):', '    pass'));
	});

	it('spells a fact as the spelling its $at names, the first spelling when it names none, and refuses a spelling the grammar has none of', () => {
		const method = { $path: 'declaration.method', $flags: ['override'], name: 'f', parameters: ['self'], body: block('pass') };
		expect(inClass({ ...method, $at: { override: { index: 0, spelling: 'typing.override' } } })).toBe(classOf('@typing.override', 'def f(self):', '    pass'));
		expect(inClass({ ...method, $at: { override: { index: 0 } } })).toBe(classOf('@override', 'def f(self):', '    pass'));
		expect(() => inClass({ ...method, $at: { override: { index: 0, spelling: 'typing_extensions.override' } } })).toThrow(
			/declaration\.method's override has no python spelling "typing_extensions\.override"/
		);
		expect(() => inClass({ $path: 'declaration.method', name: 'f', parameters: ['self'], body: block('pass'), $at: { override: { index: 0 } } })).toThrow(
			/declaration\.method: \$at names override, which it does not set/
		);
	});

	it('refuses a getter built on its own, since only its container spells it', () => {
		expect(() => runtime.build({ $path: 'declaration.property.getter', name: 'x', parameters: ['self'], body: block('pass') } as never)).toThrow(
			/declaration\.property\.getter's getter is spelled in its container's decorators, which a structure built on its own has none of/
		);
	});

	it('reads a decorator that only resembles a fact as a decorator', () => {
		expect(memberOf(classOf('@y.setter', 'def x(self, v):', '    pass'))).toMatchObject({ $path: 'declaration.method', decorators: [{ content: { object: 'y', property: 'setter' } }] });
		const split = memberOf(classOf('@typing.foo', '@bar.override', 'def f(self):', '    pass'));
		expect(split).toMatchObject({ $path: 'declaration.method' });
		expect(split.$flags).toBeUndefined();
		expect(split.decorators).toHaveLength(2);
	});
});
