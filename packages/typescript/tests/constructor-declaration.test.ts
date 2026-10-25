import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

const memberOf = (source: string) => {
	const declaration = ts.parse(source).statements()[0] as unknown as { body(): { members(): { methodDefinition(): { $type: number; $render(): { toString(): string } } }[] } };
	return declaration.body().members()[0]!.methodDefinition();
};

describe('a constructor declaration', () => {
	it('builds from its parameters and body, the constructor name stamped and spaced as a method name, and reads back as itself', () => {
		const built = ts.build.constructorDeclaration({ parameters: ts.build.formalParameters({}), body: ts.build.statementBlock({}) });
		const text = built.$render().toString();
		expect(text).toBe('constructor() {}');
		const member = memberOf(`class A { ${text} }`);
		expect(member.$type).toBe(ts.kinds.ConstructorDeclaration);
		expect(member.$render().toString()).toBe(text);
		const scoped = ts.build.constructorDeclaration({ accessibilityModifier: 'private', parameters: ts.build.formalParameters({}), body: ts.build.statementBlock({}) });
		expect(scoped.$render().toString()).toBe('private constructor() {}');
	});

	it('reads a method that only shares the name as a method', () => {
		expect(memberOf('class A { constructor() {} }').$type).toBe(ts.kinds.ConstructorDeclaration);
		expect(memberOf('class A { static constructor() {} }').$type).toBe(ts.kinds.MethodDefinitionPlain);
		expect(memberOf('class A { constructor<T>(): void {} }').$type).toBe(ts.kinds.MethodDefinitionPlain);
		expect(memberOf('class A { constructor?() {} }').$type).toBe(ts.kinds.MethodDefinitionPlain);
	});
});
