import { describe, expect, it } from 'vitest';
import { isGroupConfig } from '../src/utils.ts';

describe('isGroupConfig', () => {
	const keys = ['operators', 'primaryExpression'];

	it('takes a plain object naming only the group keys', () => {
		expect(isGroupConfig({ operators: '>', primaryExpression: {} }, keys)).toBe(true);
		expect(isGroupConfig({ operators: '>' }, keys)).toBe(true);
	});

	it('refuses an empty object, which names no field of the group', () => {
		expect(isGroupConfig({}, keys)).toBe(false);
	});

	it('refuses a node, an unknown key and non-objects', () => {
		expect(isGroupConfig({ $type: 1, operators: '>' }, keys)).toBe(false);
		expect(isGroupConfig({ operator: '>' }, keys)).toBe(false);
		expect(isGroupConfig(undefined, keys)).toBe(false);
		expect(isGroupConfig(null, keys)).toBe(false);
		expect(isGroupConfig('>', keys)).toBe(false);
	});
});
