import { withGeneratedIdTablesNode } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { CHOICE, STRING } from '../../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledEnum } from '../node-map.ts';

const member = (value: string, immediate?: boolean) => ({ type: STRING, value, ...(immediate === undefined ? {} : { immediate }) }) as const;

describe('AssembledEnum — immediacy comes from its members', () => {
	it('an enum of immediate tokens is immediate', () => {
		expect(withGeneratedIdTablesNode((kindEntries) => new AssembledEnum('predicate_type', { type: CHOICE, members: [member('?', true), member('!', true)] }, { kindEntries })).immediate).toBe(true);
	});

	it('one member that is not immediate makes the enum not immediate', () => {
		expect(withGeneratedIdTablesNode((kindEntries) => new AssembledEnum('predicate_type', { type: CHOICE, members: [member('?', true), member('!')] }, { kindEntries })).immediate).toBe(false);
		expect(withGeneratedIdTablesNode((kindEntries) => new AssembledEnum('predicate_type', { type: CHOICE, members: [member('?'), member('!')] }, { kindEntries })).immediate).toBe(false);
	});
});
