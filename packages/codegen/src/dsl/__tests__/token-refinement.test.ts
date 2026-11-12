import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

type Rule = { readonly type: string; readonly name?: string; readonly members?: readonly Rule[]; readonly content?: Rule; readonly value?: string };

const upstream = {
	extras: '/\\s/',
	rules: "integer: () => token(choice(seq(choice('0o', '0O'), /[0-7]+/, optional(/[Ll]/)), seq(/[0-9]+/, optional(/[Ll]/))))"
};

const witnesses = "[{ text: '0377', form: ['0377'], kind: 'integer', meaning: 'Octal 255.' }]";

const refined = `rules: { integer: reauthored('semantic-gap', ${witnesses}, ($, original) => token(choice(original.content.members[0], seq(/0+[1-7][0-7]*/, optional(/[Ll]/)), original.content.members[1]))) }`;

const edits =
	"edits: { integer: { 0: variant('octal'), '0/0': variant('long'), '0/1': variant('plain', { default: true }), 1: variant('legacy_octal'), '1/0': variant('long'), '1/1': variant('plain', { default: true }), 2: variant('decimal', { default: true }), '2/0': variant('long'), '2/1': variant('plain', { default: true }) } }";

const namesOf = (rule: Rule | undefined): readonly (string | undefined)[] => (rule?.members ?? []).map((member) => member.name);

describe('a rules: entry that reauthors a token rule', () => {
	it('refines the upstream token before enrich, so enrich splits the refined arms and the edits name them', async () => {
		const raw = await evaluateTempGrammar(upstream, `${refined}, ${edits}`);
		const rules = raw.rules as unknown as Record<string, Rule>;
		expect(namesOf(rules.integer)).toEqual(['integer_octal', 'integer_legacy_octal', 'integer_decimal']);
		expect(namesOf(rules.integer_legacy_octal)).toEqual(['integer_legacy_octal_long', 'integer_legacy_octal_plain']);
		expect(rules.integer_legacy_octal_long!.type).toBe('TOKEN');
		expect(rules.integer_legacy_octal_plain!.content).toMatchObject({ type: 'PATTERN', value: '0+[1-7][0-7]*' });
	}, 120_000);

	it('keeps its declared cause, and leaves the layer a fixpoint of enrich', async () => {
		const raw = await evaluateTempGrammar(upstream, `${refined}, ${edits}`);
		expect(raw.ruleCauses?.integer).toEqual({
			kind: 'reauthored',
			causes: [{ cause: 'semantic-gap', witnesses: [{ text: '0377', form: ['0377'], kind: 'integer', meaning: 'Octal 255.' }] }]
		});
		expect((raw.layerDiagnostics ?? []).map((diagnostic) => diagnostic.code)).not.toContain('layer-not-enrich-fixpoint');
	}, 120_000);
});
