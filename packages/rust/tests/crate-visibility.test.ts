import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const block = () => rs.build.block();

describe('a bare crate visibility is the crate_visibility_modifier alias', () => {
	it('coerces its text, directly and through an item', () => {
		expect(rs.build.visibilityModifier('crate').$render()).toBe('crate');
		expect(rs.build.visibilityModifier.coerce('crate').$render()).toBe('crate');
		expect(rs.build.functionItem({ visibilityModifier: 'crate', name: 'f', parameters: [], body: block() }).$render()).toBe(
			'crate fn f() {}'
		);
	});

	it('coerces its kind id, directly and through an item', () => {
		expect(rs.build.visibilityModifier(rust.kinds.Crate).$render()).toBe('crate');
		expect(rs.build.visibilityModifier.coerce(rust.kinds.Crate).$render()).toBe('crate');
		expect(
			rs.build.functionItem({ visibilityModifier: rust.kinds.Crate, name: 'f', parameters: [], body: block() }).$render()
		).toBe('crate fn f() {}');
	});
});
