// An alias envelope and its content name one parser node, so the line gap
// before that node is the envelope's alone: an envelope rebuilt around its
// unchanged content and rendered on its own writes no line break before
// itself, and the content keeps its source bytes.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('an alias envelope rebuilt around its read content, rendered alone', () => {
	it('an interface body on its own line renders its bytes', () => {
		const declaration = ts.parse('interface I\n{ x(): number }\n').statements()[0];
		if (declaration === undefined || !ts.is.interfaceDeclaration(declaration)) throw new Error('expected an interface');
		const body = declaration.body();
		expect(ts.render(body.$with.content(body.content())).toString()).toBe('{ x(): number }');
		expect(ts.render(declaration.$with.body(body.$with.content(body.content()))).toString()).toBe('interface I\n{ x(): number }');
	});

	it('a type argument that opens a line after the one before it renders its bytes', () => {
		const declaration = ts.parse('type T = A<\n  X,\n  Y,\n>;\n').statements()[0];
		if (declaration === undefined || !ts.is.typeAliasDeclaration(declaration)) throw new Error('expected a type alias');
		const value = declaration.value();
		if (!ts.is.genericType(value)) throw new Error('expected a generic type');
		const second = value.typeArguments().types().items()[1];
		if (second === undefined || !ts.is.typeIdentifier(second)) throw new Error('expected a type identifier');
		expect(ts.render(second.$with.content(second.content())).toString()).toBe('Y');
	});

	it('a leading comment the envelope owns still renders', () => {
		const declaration = ts.parse('type T = A<\n  X,\n  // c\n  Y,\n>;\n').statements()[0];
		if (declaration === undefined || !ts.is.typeAliasDeclaration(declaration)) throw new Error('expected a type alias');
		const value = declaration.value();
		if (!ts.is.genericType(value)) throw new Error('expected a generic type');
		const second = value.typeArguments().types().items()[1];
		if (second === undefined || !ts.is.typeIdentifier(second)) throw new Error('expected a type identifier');
		expect(ts.render(second.$with.content(second.content())).toString()).toBe('// c\nY');
	});
});
