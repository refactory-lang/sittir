// A number builder takes a JavaScript number or bigint; the default arm writes
// decimal.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';

describe('typescript number input', () => {
	it('writes decimal from a number or a bigint', () => {
		expect(ir.number(42).$render()).toBe('42');
		expect(ir.number(42n).$render()).toBe('42');
	});
});
