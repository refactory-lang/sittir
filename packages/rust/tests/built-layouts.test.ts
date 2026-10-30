import { setFlagsFromString } from 'node:v8';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { writeUnitSides } from '@sittir/common/utils';
import rust from '../src/index.ts';

setFlagsFromString('--allow-natives-syntax');
const haveSameMap = new Function('a', 'b', 'return %HaveSameMap(a, b);') as (a: object, b: object) => boolean;

const rs = await createEngine(rust, { nodeStorage: 'object' });

describe('a built object node keeps the layout of its kind', () => {
	it('when trivia is written on it', () => {
		const statement = () => rs.build.expressionStatement.withSemi(rs.build.identifier('x'));
		const commented = statement();
		commented.$trivia.leading(rs.build.lineComment(' c'));
		expect(haveSameMap(statement(), commented)).toBe(true);
		const leaf = rs.build.identifier('y');
		leaf.$trivia.trailing(rs.build.lineComment(' d'));
		expect(haveSameMap(rs.build.identifier('z'), leaf)).toBe(true);
	});

	it('when unit sides are written on it', () => {
		const sided = rs.build.awaitExpression(rs.build.identifier('x'));
		writeUnitSides(sided, []);
		expect(haveSameMap(rs.build.awaitExpression(rs.build.identifier('y')), sided)).toBe(true);
	});
});

describe('a built arena leaf keeps the layout of its kind', async () => {
	const ra = await createEngine(rust, { nodeStorage: 'arena' });

	it('when it is placed', () => {
		const placed = ra.build.identifier('x');
		ra.build.expressionStatement.withSemi(placed);
		expect(haveSameMap(ra.build.identifier('y'), placed)).toBe(true);
	});

	it('when trivia is written on it', () => {
		const commented = ra.build.identifier('z');
		commented.$trivia.leading(ra.build.lineComment(' c'));
		expect(haveSameMap(ra.build.identifier('w'), commented)).toBe(true);
	});
});
