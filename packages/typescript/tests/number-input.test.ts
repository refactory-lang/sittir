// A number builder takes a JavaScript number or bigint; the default arm writes
// decimal.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('typescript number input', () => {
	it('writes decimal from a number or a bigint', () => {
		expect(ts.build.number(42).$render()).toBe('42');
		expect(ts.build.number(42n).$render()).toBe('42');
	});
});
