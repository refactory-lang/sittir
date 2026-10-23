import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const b = rs.build;

const source = 'fn f() {\n    match x {\n        a if a > 0 => 1,\n        _ => 0,\n    }\n}\n';
const firstArm = () => {
	const parsed = rs.parse(source);
	const arm = parsed.$query().$descendants.find((node) => typeof node === 'object' && rs.is.matchArmWithComma(node));
	if (arm === undefined || typeof arm !== 'object' || !rs.is.matchArmWithComma(arm)) throw new Error('no guarded arm');
	return { parsed, arm };
};

describe('a match arm whose pattern has a guard', () => {
	it('reads the guarded pattern whole as its match, the pattern and condition inside it', () => {
		const { arm } = firstArm();
		expect(rs.is.matchPattern(arm.match())).toBe(true);
		expect(String(arm.match().pattern())).toBe('a');
		expect(String(arm.match().condition())).toBe('a > 0');
	});

	it('builds and renders the guard from the arm’s flat config', () => {
		const { arm } = firstArm();
		const built = b.matchArmWithComma({
			pattern: arm.match().pattern(),
			condition: arm.match().condition(),
			value: arm.value()
		});
		expect(rs.is.matchPattern(built.match())).toBe(true);
		expect(built.$render()).toBe('a if a > 0 => 1,');
	});

	it('builds and renders the guard from the whole match', () => {
		const { arm } = firstArm();
		expect(b.matchArmWithComma({ match: arm.match(), value: arm.value() }).$render()).toBe('a if a > 0 => 1,');
	});

	it('round-trips the guard through JSON', () => {
		const { parsed } = firstArm();
		const revived = JSON.parse(JSON.stringify(parsed), rs.reviver) as typeof parsed;
		expect(JSON.stringify(revived)).toBe(JSON.stringify(parsed));
		expect(revived.$render()).toContain('a if a > 0 => 1,');
	});
});
