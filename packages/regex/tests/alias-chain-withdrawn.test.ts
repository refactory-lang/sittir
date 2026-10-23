import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { ir as irBuilders } from '../src/ir.ts';

const engine = await regex.createEngine();
const is = engine.is as unknown as Record<string, any>;
const build = engine.build as unknown as Record<string, any>;
const ir = irBuilders as unknown as Record<string, any>;

describe('a chained route through an alias is withdrawn', () => {
	it('has no builder or guard for pattern.term.group', () => {
		expect(ir.pattern?.term?.group).toBeUndefined();
		expect(is.pattern?.term?.group).toBeUndefined();
	});

	it('keeps the plain pattern.term guard on a parsed pattern whose content is a term', () => {
		const pattern = engine.parse('^a');
		expect(is.pattern(pattern)).toBe(true);
		expect(is.pattern.term(pattern)).toBe(true);
	});

	it('builds the alias form of term.group directly, and its guard admits it', () => {
		const built = build.term.group.startAssertion({});
		expect(engine.render(built).toString()).toBe('^');
		expect(is.term.group.startAssertion(built)).toBe(true);
	});
});
