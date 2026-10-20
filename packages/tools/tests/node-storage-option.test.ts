import { describe, expect, it } from 'vitest';
import { parseNodeStorage, useValidationNodeStorage, validationStorage } from '../src/validate/common.ts';

describe('the node storage a validation run reads trees as', () => {
	it('names each storage the engine reads, and refuses any other', () => {
		expect(parseNodeStorage('object')).toBe('object');
		expect(parseNodeStorage('arena')).toBe('arena');
		expect(() => parseNodeStorage('records')).toThrow(/node storage 'records' is none of object, arena/);
	});

	it('is object storage until a run chooses another', () => {
		expect(validationStorage()).toBe('object');
		useValidationNodeStorage('object');
		expect(validationStorage()).toBe('object');
	});
});
