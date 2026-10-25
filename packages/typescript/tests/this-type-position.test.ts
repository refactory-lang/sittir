import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);

describe('this in a type position', () => {
	it('refuses a this expression', () => {
		expect(() => ts.build.typeAnnotation(ts.build.this as never)).toThrow();
	});

	it('reaches the this_type leaf from the text', () => {
		const annotation = ts.build.typeAnnotation('this');
		expect(annotation.type()).toBe(ts.kinds.ThisType);
		expect(annotation.$render()).toBe(': this');
	});

	it('reads a parsed this type as this_type', () => {
		const alias = ts.parse('type T = this;\n').statements()[0]!;
		if (!ts.is.typeAliasDeclaration(alias)) throw new Error('not a type alias');
		expect(alias.value()).toBe(ts.kinds.ThisType);
	});
});
