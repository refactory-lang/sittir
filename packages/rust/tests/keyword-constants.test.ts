import { describe, expect, expectTypeOf, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

describe('a keyword leaf with a build entry is its kind id', () => {
	it('is the kinds member itself, not a function', () => {
		expect(rs.build.self).toBe(rs.kinds.Self);
		expect(typeof rs.build.self).toBe('number');
	});

	it('has the kinds member as its type', () => {
		expectTypeOf(rs.build.self).toEqualTypeOf<typeof rs.kinds.Self>();
	});

	it('renders as the engine renders any kind id', () => {
		expect(rs.render(rs.build.self).toString()).toBe('self');
	});

	it('leaves a pattern leaf a callable builder', () => {
		expect(typeof rs.build.identifier).toBe('function');
	});
});
