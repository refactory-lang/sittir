import { describe, expect, it } from 'vitest';
import { isLeafModelType } from '../../src/validate/common.ts';

describe('isLeafModelType', () => {
	it.each(['pattern', 'enum', 'keyword', 'punctuation'])('holds a %s kind as a leaf', (modelType) => {
		expect(isLeafModelType(modelType)).toBe(true);
	});

	it.each(['branch', 'envelope', undefined])('does not hold a %s kind as a leaf', (modelType) => {
		expect(isLeafModelType(modelType)).toBe(false);
	});
});
