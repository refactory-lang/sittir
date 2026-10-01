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

describe('a flattened key on an absent group', () => {
	it('clears the seat when given no value, leaving the group absent', () => {
		const handler = catchOf('try { a } catch { b }\n');
		const cleared = handler.$with.type();
		expect(cleared.$render()).toBe('catch { b }');
		expect(cleared.catchClauseGroup()).toBeUndefined();
	});

	it('refuses to build the group without its required parameter', () => {
		const handler = catchOf('try { a } catch { b }\n');
		const typed = catchOf('try { a } catch (e: E) { b }\n').type();
		if (typed === undefined) throw new Error('no type');
		expect(() => handler.$with.type(typed)).toThrow(/cannot build the absent 'catchClauseGroup' group without its required parameter/);
	});

	it('builds the group from its one required field', () => {
		expect(catchOf('try { a } catch { b }\n').$with.parameter(ts.build.identifier('z')).$render()).toBe('catch (z) { b }');
	});
});
