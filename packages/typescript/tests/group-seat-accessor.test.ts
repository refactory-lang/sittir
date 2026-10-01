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

const presentCatchOf = (source: string) => {
	const handler = catchOf(source);
	if (handler.parameter === undefined) throw new Error('no catch group');
	return handler;
};

const absentCatchOf = (source: string) => {
	const handler = catchOf(source);
	if (handler._catch_clause_group !== undefined) throw new Error('a catch group');
	return handler;
};

describe('a group seat flattens its group fields onto the parent', () => {
	it('reads the catch parameter through the flattened accessor', () => {
		expect(String(ts.render(presentCatchOf('try { a } catch (e) { b }\n').parameter()))).toBe('e');
	});

	it('takes the flattened key through $with', () => {
		const handler = catchOf('try { a } catch (e) { b }\n');
		expect(handler.$with.parameter(ts.build.identifier('z')).$render()).toBe('catch (z) { b }');
	});

	it('clears the whole group through the seat setter', () => {
		const cleared = presentCatchOf('try { a } catch (e) { b }\n').$with.catchClauseGroup();
		expect(cleared.$render()).toBe('catch { b }');
		expect(cleared._catch_clause_group).toBeUndefined();
	});
});

describe('an untyped call of a flattened key on an absent group', () => {
	it('clears the seat when given no value, leaving the group absent', () => {
		// @ts-expect-error an absent group has no setter for its optional field
		const cleared = absentCatchOf('try { a } catch { b }\n').$with.type();
		expect(cleared.$render()).toBe('catch { b }');
		expect(cleared.catchClauseGroup()).toBeUndefined();
	});

	it('refuses to build the group without its required parameter', () => {
		const handler = absentCatchOf('try { a } catch { b }\n');
		const typed = presentCatchOf('try { a } catch (e: E) { b }\n').type();
		if (typed === undefined) throw new Error('no type');
		// @ts-expect-error an absent group has no setter for its optional field
		expect(() => handler.$with.type(typed)).toThrow(/cannot build the absent 'catchClauseGroup' group without its required parameter/);
	});

	it('builds the group from its one required field', () => {
		const present = absentCatchOf('try { a } catch { b }\n').$with.parameter(ts.build.identifier('z'));
		expect(present.$render()).toBe('catch (z) { b }');
		expect(String(ts.render(present.parameter()))).toBe('z');
	});
});
