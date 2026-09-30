import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

const catchOf = (source: string) => {
	const statement = ts.parse(source).statements()[0]!;
	if (!ts.is.tryStatement(statement)) throw new Error('not a try');
	const handler = statement.handler();
	if (handler === undefined) throw new Error('no handler');
	return handler;
};

describe('a group seat flattens its group fields onto the parent', () => {
	it('reads the catch parameter through the flattened accessor', () => {
		expect(String(ts.render(catchOf('try { a } catch (e) { b }\n').parameter()!))).toBe('e');
	});

	it('takes the flattened key through $with', () => {
		const handler = catchOf('try { a } catch (e) { b }\n');
		expect(handler.$with.parameter(ts.build.identifier('z')).$render()).toBe('catch (z) { b }');
	});
});
