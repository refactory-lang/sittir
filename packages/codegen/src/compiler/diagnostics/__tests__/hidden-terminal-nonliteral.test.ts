import { describe, expect, it } from 'vitest';
import { hiddenTerminalNonliteralSites } from '../grammar-diagnostics.ts';
import type { RawGrammar } from '../../types.ts';
import { evaluatePackage } from '../../evaluate-package.ts';
import { diagnoseEvaluationStages } from '../../stage.ts';
import { allGrammars, grammarPackage } from '../../../grammars.ts';
import type { Rule } from '../../../types/rule.ts';

type R = Rule<'evaluate'>;
const pattern = (value: string) => ({ type: 'PATTERN', value }) as unknown as R;
const str = (value: string) => ({ type: 'STRING', value }) as unknown as R;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as unknown as R;
const external = (name: string) => ({ type: 'SYMBOL', name }) as RawGrammar['externals'][number];
const seq = (...members: R[]) => ({ type: 'SEQ', members }) as unknown as R;
const alias = (content: R, value: string) => ({ type: 'ALIAS', named: true, value, content }) as unknown as R;

function grammar(rules: Record<string, R>, extra: Partial<RawGrammar> = {}): Pick<RawGrammar, 'rules' | 'externals' | 'externalRoles'> {
	return { rules, externals: [external('_content')], ...extra };
}

describe('hiddenTerminalNonliteralSites', () => {
	it('records a bare reference to a hidden external', () => {
		expect(hiddenTerminalNonliteralSites(grammar({ comment: seq(str('/*'), sym('_content'), str('*/')) }))).toEqual([{ ownerKind: 'comment', target: '_content' }]);
	});

	it('records a bare reference to a hidden rule that is one non-literal token', () => {
		expect(hiddenTerminalNonliteralSites(grammar({ capture: seq(str('@'), sym('_name')), _name: pattern('[a-z]+') }))).toEqual([{ ownerKind: 'capture', target: '_name' }]);
	});

	it('leaves an aliased reference, a literal body and an owner that is the reference alone', () => {
		const rules = {
			doc: seq(str('/**'), alias(sym('_content'), 'doc_text'), str('*/')),
			statement: seq(sym('word'), sym('_unsafe')),
			_unsafe: str('unsafe'),
			comment_text: sym('_content'),
			word: pattern('[a-z]+')
		};
		expect(hiddenTerminalNonliteralSites(grammar(rules))).toEqual([]);
	});

	it('leaves an external whose declared role is indent or dedent', () => {
		const rules = { block: seq(sym('_indent'), sym('word'), sym('_dedent')), word: pattern('[a-z]+') };
		const layout = grammar(rules, {
			externals: [external('_indent'), external('_dedent')],
			externalRoles: new Map([
				['_indent', { role: 'indent' as const }],
				['_dedent', { role: 'dedent' as const }]
			])
		});
		expect(hiddenTerminalNonliteralSites(layout)).toEqual([]);
	});
});

describe('hidden-terminal-nonliteral across the stages', () => {
	const enrichedSites = async (grammar: string): Promise<string[]> => {
		const raw = await evaluatePackage(grammarPackage(grammar));
		return diagnoseEvaluationStages(raw.stages!)
			.enriched.diagnostics.filter((d) => d.code === 'hidden-terminal-nonliteral')
			.map((d) => `${d.ownerKind} -> ${(d.details as { target: string }).target}`)
			.sort();
	};

	it('records the enriched-stage sites wire gives a kind of their own', async () => {
		expect(await enrichedSites('rust')).toEqual([
			'block_comment -> _block_comment_content',
			'raw_string_literal -> _raw_string_literal_end',
			'raw_string_literal -> _raw_string_literal_start'
		]);
		expect(await enrichedSites('python')).toEqual([
			'_suite -> _indent',
			'block -> _dedent',
			'match_block -> _dedent',
			'match_block -> _indent',
			'string_content -> _string_content'
		]);
	}, 300_000);

	it('leaves no site in any final grammar', async () => {
		for (const grammar of allGrammars()) {
			expect(hiddenTerminalNonliteralSites(await evaluatePackage(grammarPackage(grammar))), grammar).toEqual([]);
		}
	}, 300_000);
});
