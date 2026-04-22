import { describe, it, expect } from 'vitest';
import {
	translateToJinja,
	filterForFlanks,
	type JinjaTranslateMeta,
} from '../compiler/node-map.ts';

// Unit coverage for the final `$VAR → {{ var }}` translation stage that
// AssembledBranch.renderTemplate runs after clause inlining. These
// helpers were previously in the deleted `jinja-translator.ts` (commit
// f3f760f) and absorbed into node-map.ts; neither is consumed directly
// outside the emitter, so they have no corpus-covered failure surface.

describe('translateToJinja — simple placeholders', () => {
	it('$NAME → {{ name }}', () => {
		expect(translateToJinja('$NAME', {})).toBe('{{ name }}');
	});

	it('mixes literal text around a placeholder', () => {
		expect(translateToJinja('fn $NAME()', {})).toBe('fn {{ name }}()');
	});

	it('$TEXT → {{ text }}', () => {
		expect(translateToJinja('$TEXT', {})).toBe('{{ text }}');
	});

	it('$NEWLINE → literal newline', () => {
		expect(translateToJinja('a$NEWLINEb', {})).toBe('a\nb');
	});

	it('$INDENT / $DEDENT → empty', () => {
		expect(translateToJinja('[$INDENT$NAME$DEDENT]', {})).toBe('[{{ name }}]');
	});

	it('lowercases the variable name', () => {
		expect(translateToJinja('$RETURN_TYPE', {})).toBe('{{ return_type }}');
	});
});

describe('translateToJinja — $$$ repeat placeholders', () => {
	it('falls back to single-space default sep when no meta', () => {
		expect(translateToJinja('$$$CHILDREN', {})).toBe('{{ children | join(" ") }}');
	});

	it('uses meta.joinBy as the rule-level default sep', () => {
		const meta: JinjaTranslateMeta = { joinBy: ', ' };
		expect(translateToJinja('$$$CHILDREN', meta)).toBe('{{ children | join(", ") }}');
	});

	it('$$$NAME uses meta.joinByField[name] when set', () => {
		const meta: JinjaTranslateMeta = { joinByField: { name: ',' } };
		expect(translateToJinja('$$$NAME', meta)).toBe('{{ name | join(",") }}');
	});

	it('$$$NAME falls back to meta.joinBy when joinByField missing the key', () => {
		const meta: JinjaTranslateMeta = { joinBy: '|' };
		expect(translateToJinja('$$$NAME', meta)).toBe('{{ name | join("|") }}');
	});

	it('$$$CHILDREN picks joinWithTrailing when meta.joinByTrailing', () => {
		const meta: JinjaTranslateMeta = { joinBy: ',', joinByTrailing: true };
		expect(translateToJinja('$$$CHILDREN', meta))
			.toBe('{{ children | joinWithTrailing(",") }}');
	});

	it('$$$CHILDREN picks joinWithLeading when meta.joinByLeading', () => {
		const meta: JinjaTranslateMeta = { joinBy: '|', joinByLeading: true };
		expect(translateToJinja('$$$CHILDREN', meta))
			.toBe('{{ children | joinWithLeading("|") }}');
	});

	it('$$$CHILDREN picks joinWithFlanks when both leading + trailing', () => {
		const meta: JinjaTranslateMeta = { joinBy: ',', joinByLeading: true, joinByTrailing: true };
		expect(translateToJinja('$$$CHILDREN', meta))
			.toBe('{{ children | joinWithFlanks(",") }}');
	});

	it('flank flags on a named $$$FIELD do NOT switch the filter — only children carries flanks', () => {
		const meta: JinjaTranslateMeta = { joinBy: ',', joinByTrailing: true };
		// $$$NAME stays on plain `join` — per-field flanks aren't
		// tracked in meta today; only `$$$CHILDREN` consults them.
		expect(translateToJinja('$$$NAME', meta)).toBe('{{ name | join(",") }}');
	});
});

describe('translateToJinja — brace collision escape', () => {
	it('inserts a space between literal { and following {{ … }}', () => {
		expect(translateToJinja('{$$$CHILDREN}', {}))
			.toBe('{ {{ children | join(" ") }} }');
	});

	it('handles stacked {{ … }} inside braces', () => {
		expect(translateToJinja('{$NAME}', {})).toBe('{ {{ name }} }');
	});

	it('does not insert spaces when no brace collision is present', () => {
		expect(translateToJinja('($NAME)', {})).toBe('({{ name }})');
	});
});

describe('filterForFlanks', () => {
	it('non-children keys always map to "join"', () => {
		expect(filterForFlanks('name', {})).toBe('join');
		expect(filterForFlanks('name', { joinByLeading: true, joinByTrailing: true }))
			.toBe('join');
	});

	it('children + no flank flags → "join"', () => {
		expect(filterForFlanks('children', {})).toBe('join');
	});

	it('children + trailing → "joinWithTrailing"', () => {
		expect(filterForFlanks('children', { joinByTrailing: true })).toBe('joinWithTrailing');
	});

	it('children + leading → "joinWithLeading"', () => {
		expect(filterForFlanks('children', { joinByLeading: true })).toBe('joinWithLeading');
	});

	it('children + both → "joinWithFlanks"', () => {
		expect(filterForFlanks('children', { joinByLeading: true, joinByTrailing: true }))
			.toBe('joinWithFlanks');
	});
});
