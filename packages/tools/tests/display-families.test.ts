import { expect, it } from 'vitest';
import { physicalDisplayKind, sharedDisplayStorageKinds } from '../src/validate/display-families.ts';

const families = {
	lambda_expression: [
		{ storage: 'lambda', literal: false },
		{ storage: 'lambda_within_for_in_clause', literal: false }
	],
	property_identifier: [{ storage: 'identifier', literal: false }]
};

it('selects only the physical member named by the parser id', () => {
	expect(physicalDisplayKind('lambda_expression', 'lambda', families)).toBe('lambda');
	expect(physicalDisplayKind('lambda_expression', 'lambda_within_for_in_clause', families)).toBe(
		'lambda_within_for_in_clause'
	);
	expect(physicalDisplayKind('lambda_expression', 'other', families)).toBe('lambda_expression');
	expect(physicalDisplayKind('lambda_expression', undefined, families)).toBe('lambda_expression');
});

it('preserves ordinary single-source alias identity', () => {
	expect(physicalDisplayKind('property_identifier', 'identifier', families)).toBe('property_identifier');
	expect(sharedDisplayStorageKinds('property_identifier', families)).toEqual(['property_identifier']);
	expect(sharedDisplayStorageKinds('lambda_expression', families)).toEqual(['lambda', 'lambda_within_for_in_clause']);
});
