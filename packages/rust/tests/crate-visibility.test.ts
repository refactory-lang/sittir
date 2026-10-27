import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const block = () => rs.build.block();

describe('a bare crate visibility is the crate_visibility_modifier alias', () => {
	it('coerces its text, directly and through an item', () => {
		expect(rs.build.visibilityModifier('crate').$render()).toBe('crate');
		expect(rs.build.visibilityModifier('crate').$render()).toBe('crate');
		expect(rs.build.functionItem({ visibilityModifier: 'crate', name: 'f', parameters: [], body: block() }).$render()).toBe(
			'crate fn f() {}'
		);
	});

	it('coerces its own kind id, directly and through an item', () => {
		expect(rs.build.visibilityModifier(rust.kinds.CrateVisibilityModifier).$render()).toBe('crate');
		expect(rs.build.visibilityModifier(rust.kinds.CrateVisibilityModifier).$render()).toBe('crate');
		expect(
			rs.build.functionItem({ visibilityModifier: rust.kinds.CrateVisibilityModifier, name: 'f', parameters: [], body: block() }).$render()
		).toBe('crate fn f() {}');
	});

	it("takes the crate keyword's id as the keyword inside pub(crate), not as the display", () => {
		expect(rs.build.visibilityModifier(rust.kinds.Crate).$render()).toBe('pub(crate)');
		expect(rs.build.visibilityModifier(rust.kinds.Crate).$render()).toBe('pub(crate)');
	});
});
