import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';

const ts = await sharedEngine(() => createEngine(typescript));

type Read = { readonly $type: number; expression(): Read; left(): Read; right(): Read };

const first = (source: string): Read => ts.parse(source).statements()[0] as unknown as Read;

describe('binary_expression is a supertype of its default kind and the in kind', () => {
	it('reads `a + b` as binary_expression_default and `#x in y` as binary_expression_in, with no wrapper', () => {
		expect(first('a + b;').expression().$type).toBe(ts.kinds.BinaryExpressionDefault);
		const membership = first('class A { m() { #x in y; } }\n');
		expect(membership).toBeDefined();
		const direct = ts.parse('#x in y;\n').statements()[0] as unknown as Read;
		expect(direct.expression().$type).toBe(ts.kinds.BinaryExpressionIn);
	});

	it('holds is.binaryExpression for both kinds and tells them apart with the variant guard', () => {
		const sum = first('a + b;').expression();
		const membership = (ts.parse('#x in y;\n').statements()[0] as unknown as Read).expression();
		expect(ts.is.binaryExpression(sum)).toBe(true);
		expect(ts.is.binaryExpression(membership)).toBe(true);
		expect(ts.is.binaryExpression.in(sum)).toBe(false);
		expect(ts.is.binaryExpression.in(membership)).toBe(true);
		expect(ts.is.binaryExpressionDefault(sum)).toBe(true);
	});

	it('builds the default kind through the parent and the in kind through its own route', () => {
		const sum = ts.build.binaryExpression({ left: ts.build.identifier('a'), operator: '+', right: ts.build.identifier('b') });
		const membership = ts.build.binaryExpression.in({ left: ts.build.identifier('a'), right: ts.build.identifier('b') });
		expect(sum.$type).toBe(ts.kinds.BinaryExpressionDefault);
		expect(membership.$type).toBe(ts.kinds.BinaryExpressionIn);
		expect(String(ts.render(() => sum))).toBe('a + b');
		expect(String(ts.render(() => membership))).toBe('a in b');
	});

	it('seats both through a yield delegate', () => {
		const delegate = ts.build.yieldExpression.delegate;
		const sum = delegate.binary({ left: ts.build.identifier('a'), operator: '&&', right: ts.build.identifier('b') });
		const membership = delegate.binary.in({ left: ts.build.identifier('a'), right: ts.build.identifier('b') });
		expect((sum as unknown as Read).expression().expression().$type).toBe(ts.kinds.BinaryExpressionDefault);
		expect((membership as unknown as Read).expression().expression().$type).toBe(ts.kinds.BinaryExpressionIn);
	});
});
