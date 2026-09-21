import { describe, it, expect } from 'vitest';
import { CHOICE, FIELD, OPTIONAL, PATTERN, SEQ, STRING, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import { structureTokenInterior } from '../token-interior.ts';

type LinkRule = Rule<'link'>;

const str = (value: string): LinkRule => ({ type: STRING, value }) as LinkRule;
const pat = (value: string): LinkRule => ({ type: PATTERN, value }) as LinkRule;
const seq = (...members: LinkRule[]): LinkRule => ({ type: SEQ, members }) as LinkRule;
const choice = (...members: LinkRule[]): LinkRule => ({ type: CHOICE, members }) as LinkRule;
const token = (content: LinkRule): LinkRule => ({ type: TOKEN, content, immediate: false }) as LinkRule;

function structured(rule: LinkRule): LinkRule {
	const rules: Record<string, LinkRule> = { kind: rule };
	structureTokenInterior(rules);
	return rules.kind!;
}

const membersOf = (rule: LinkRule): LinkRule[] => ((rule as { content: { members: LinkRule[] } }).content.members);

describe('structureTokenInterior — token(seq(…))', () => {
	it('names a pattern member content and keeps strings as template text', () => {
		const members = membersOf(structured(token(seq(str('#'), pat('.*')))));
		expect(members[0]).toMatchObject({ type: STRING, value: '#' });
		expect(members[1]).toMatchObject({ type: FIELD, name: 'content', content: { type: PATTERN } });
	});

	it('finds a pattern under an authored field and keeps that field name as the slot name', () => {
		const members = membersOf(
			structured(token(seq(str('#'), { type: FIELD, name: 'name', content: pat('[a-z]+') } as LinkRule)))
		);
		expect(members[0]).toMatchObject({ type: STRING, value: '#' });
		expect(members[1]).toMatchObject({ type: FIELD, name: 'name', content: { type: PATTERN } });
	});

	it('keeps an authored field beside a plain pattern run as its own slot', () => {
		const members = membersOf(
			structured(token(seq(str('#'), pat('[0-9]'), { type: FIELD, name: 'tail', content: pat('[a-z]') } as LinkRule)))
		);
		expect(members.map((m) => (m as { name?: string }).name)).toEqual([undefined, 'content', 'tail']);
	});

	it('makes an optional string a presence flag named by its text', () => {
		const members = membersOf(
			structured(token(seq({ type: OPTIONAL, content: str('b') } as LinkRule, str("'"), pat('[a-z]'), str("'"))))
		);
		expect(members[0]).toMatchObject({ type: FIELD, name: 'b', content: { type: OPTIONAL } });
	});

	it('makes a choice of strings an enum slot', () => {
		const members = membersOf(structured(token(seq(pat('[0-9]+'), choice(str('u8'), str('i8'))))));
		expect(members[1]).toMatchObject({ type: FIELD, name: 'suffix' });
	});

	it('merges adjacent slot members into one composed pattern', () => {
		const members = membersOf(structured(token(seq(str('/'), pat('[a-z]'), pat('[0-9]')))));
		expect(members[1]).toMatchObject({ type: FIELD, name: 'content', content: { value: '(?:[a-z])(?:[0-9])' } });
	});

	it('leaves a token with no pattern slot whole', () => {
		const rule = token(seq(str('\\'), choice(seq(str('\r'), str('\n')), str('\0'))));
		expect(structured(rule)).toBe(rule);
	});

	it('leaves a token with no literal member whole', () => {
		const rule = token(seq(pat('[a-z]'), pat('[0-9]')));
		expect(structured(rule)).toBe(rule);
	});
});

describe('structureTokenInterior — bare patterns', () => {
	it('draws slots from named groups and keeps the text around them as literals', () => {
		const rule = structured(pat('\\$(?<name>[a-zA-Z_]\\w*)'));
		expect(rule).toMatchObject({ type: SEQ, lexed: true });
		const members = (rule as { members: LinkRule[] }).members;
		expect(members[0]).toMatchObject({ type: STRING, value: '$' });
		expect(members[1]).toMatchObject({ type: FIELD, name: 'name', content: { value: '[a-zA-Z_]\\w*' } });
	});

	it('reads control escapes outside a group as their characters', () => {
		const members = (structured(pat('#!(?<content>[^\\n]*)\\n')) as { members: LinkRule[] }).members;
		expect(members[2]).toMatchObject({ type: STRING, value: '\n' });
	});

	it('keeps a pattern without a named group whole', () => {
		const rule = pat('[a-z]+');
		expect(structured(rule)).toBe(rule);
	});

	it('rejects a named group beside non-literal top-level regex', () => {
		expect(() => structured(pat('(?<name>[a-z]+)\\d+'))).toThrow(/not literal text/);
		expect(() => structured(pat('x*(?<name>[a-z]+)'))).toThrow(/not literal text/);
	});
});

const named = (name: string, content: LinkRule): LinkRule => ({ type: FIELD, name, content }) as LinkRule;
const optional = (content: LinkRule): LinkRule => ({ type: CHOICE, members: [content, { type: SEQ, members: [] } as LinkRule] }) as LinkRule;

describe('structureTokenInterior — named parts inside nested structure', () => {
	const exponent = seq(named('marker', choice(str('e'), str('E'))), seq(named('sign', optional(choice(str('-'), str('+')))), named('exponent', pat('\\d+'))));

	it('flattens a nested sequence when the token names a part, so its members become slots', () => {
		const members = membersOf(structured(token(seq(named('integer', pat('\\d+')), exponent))));
		expect(members.map((m) => (m as { name?: string }).name)).toEqual(['integer', 'marker', 'sign', 'exponent']);
	});

	it('makes a named choice of strings an enum slot under its own name', () => {
		const members = membersOf(structured(token(seq(named('integer', pat('\\d+')), exponent))));
		expect(members[1]).toMatchObject({ type: FIELD, name: 'marker', content: { type: CHOICE } });
	});

	it('keeps an optional group that holds named parts as a group and structures its members', () => {
		const members = membersOf(structured(token(seq(named('integer', pat('\\d+')), str('.'), optional(exponent)))));
		const group = members[2] as { type: string; members: { members?: LinkRule[] }[] };
		expect(group.type).toBe(CHOICE);
		const inner = group.members.find((m) => m.members !== undefined && m.members.length > 0)!.members!;
		expect(inner.map((m) => (m as { name?: string }).name)).toEqual(['marker', 'sign', 'exponent']);
	});

	it('makes a named optional pattern an optional slot', () => {
		const members = membersOf(structured(token(seq(named('integer', pat('\\d+')), str('.'), named('fraction', optional(pat('\\d+')))))));
		expect(members[2]).toMatchObject({ type: FIELD, name: 'fraction', content: { type: OPTIONAL, content: { type: PATTERN } } });
	});

	it('leaves a token with no named part on the composed path, so its output does not change', () => {
		const members = membersOf(structured(token(seq(pat('\\d+'), str('.'), seq(pat('\\d+'), choice(str('e'), str('E')))))));
		expect(members.map((m) => (m as { name?: string }).name)).toEqual(['content', undefined, 'content2']);
	});
});
