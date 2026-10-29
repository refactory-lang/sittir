import { afterEach, describe, expect, it } from 'vitest';
import { useValidationConstruction, useValidationNodeStorage, validationStorage } from '../common.ts';

afterEach(() => {
	useValidationNodeStorage('object');
	useValidationConstruction('object');
});

describe('paired validator storage', () => {
	it('refuses an unchanged object hint after switching reads to arena', () => {
		useValidationNodeStorage('object');
		useValidationConstruction('object');
		useValidationNodeStorage('arena');
		expect(() => useValidationConstruction('object')).toThrow(/nodeConstruction 'object'.*nodeStorage.*'object'/);
	});

	it('accepts only the record assertion for arena storage', () => {
		useValidationNodeStorage('arena');
		expect(() => useValidationConstruction('record')).not.toThrow();
		expect(validationStorage()).toBe('arena');
		expect(() => useValidationConstruction('object')).toThrow(/nodeConstruction 'object'/);
	});

	it('does not turn an object validator into arena storage for a record hint', () => {
		useValidationNodeStorage('object');
		expect(() => useValidationConstruction('record')).toThrow(/nodeConstruction 'record'.*nodeStorage 'arena'/);
		expect(validationStorage()).toBe('object');
	});
});
