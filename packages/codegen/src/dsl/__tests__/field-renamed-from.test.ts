import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { field } from '../primitives/field.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const sym = (name: string): Rule => ({ type: 'SYMBOL', name }) as Rule;

beforeAll(() => {
	installFakeDsl();
});
afterAll(() => {
	restoreFakeDsl();
});

describe('field() renamedFrom', () => {
	it('stamps the upstream field name on the FIELD rule', () => {
		const result = field('item', sym('expression'), { renamedFrom: 'argument' });
		expect(result).toMatchObject({ type: 'FIELD', name: 'item', annotations: { renamedFrom: 'argument' } });
	});

	it('leaves a field that is not a rename unannotated', () => {
		const result = field('item', sym('expression')) as { annotations?: unknown };
		expect(result.annotations).toBeUndefined();
	});
});
