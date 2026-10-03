import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule, SimplifiedRule } from '../../types/rule.ts';
import { evaluateSittirGrammar } from './_sittir-grammar.ts';
import { blockedRecords, collectGrammarDiagnosticsForGrammar, undeclaredSeparatorDiagnostics } from '../diagnostics/grammar-diagnostics.ts';
import { AssembledList, AssembledPattern, type AssembledNode, type SeparatedListElementRule } from '../model/node-map.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';

const require = createRequire(import.meta.url);
const LIST_CODES = ['separator-pattern', 'separator-default-undeclared', 'field-optional-delimiter'];

describe('list separator and flank shapes are blocking records', () => {
	it('tree-sitter-go: newline-or-semicolon separators with no declared default are recorded, a headless repeat is not a list with a flank, and floors clear the records at the gate', async () => {
		const raw = await evaluateSittirGrammar(require.resolve('tree-sitter-go/grammar.js'), 'go');
		const { diagnostics, nodeMap } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
		const records = diagnostics.filter((d) => LIST_CODES.includes(d.code));
		const owners = (code: string): string[] => records.filter((d) => d.code === code).map((d) => d.ownerKind!).sort();
		expect(owners('separator-pattern')).toEqual([]);
		expect(owners('separator-default-undeclared')).toEqual([
			'const_declaration_arm',
			'field_declarations',
			'import_specs',
			'interface_elems',
			'statements',
			'type_declaration_elements',
			'var_spec_list'
		]);
		expect(
			owners('field-optional-delimiter'),
			"special_argument_list's repeat has no uniform head (a _type precedes the repeated _expression) and is a plain repeat: it is not a separated list, so its optional(',') is no list flank"
		).toEqual([]);
		expect(records.every((d) => d.severity === 'error' && d.canProceed === false)).toBe(true);
		const statements = nodeMap.nodes.get('statements');
		const separatorArms = statements instanceof AssembledList && statements.separatorRule?.type === CHOICE ? statements.separatorRule.members : [];
		expect(separatorArms.map((arm) => (arm.type === SYMBOL ? arm.name : arm.type === STRING ? arm.value : arm.type))).toEqual(['source_file_text', ';', '\0']);
		expect(blockedRecords(records, {}), 'the seven undeclared separators; the headless repeat raises no flank record').toHaveLength(7);
		const floors = Object.fromEntries(LIST_CODES.map((code) => [code, owners(code)]));
		expect(blockedRecords(records, floors)).toEqual([]);
	}, 120_000);

	it('a per-instance separator with no declared default is a blocking record naming its arms', () => {
		const separator: RenderRule = { type: CHOICE, members: [{ type: STRING, value: ',' }, { type: STRING, value: ';' }] };
		const rule: SeparatedListElementRule = {
			type: SYMBOL,
			name: 'member',
			multiplicity: 'nonEmptyArray',
			separator: { value: separator, trailing: 'optional' }
		};
		const simplified: SimplifiedRule = { type: SYMBOL, name: 'member' };
		const nodes = new Map<string, AssembledNode>();
		nodes.set('member_list', new AssembledList('member_list', rule, undefined, { separatorRule: separator, simplifiedRule: simplified, renderRule: simplified }));
		nodes.set('member', new AssembledPattern('member', { type: PATTERN, value: '[a-z]+' }));
		const kindEntries = [
			{ kind: 'member_list', id: 1 },
			{ kind: 'member', id: 2 },
			{ kind: 'comma', id: 3, symbolName: ',', literalText: ',', anon: true },
			{ kind: 'semi', id: 4, symbolName: ';', literalText: ';', anon: true }
		];
		const records = undeclaredSeparatorDiagnostics('test', { nodeMap: makeNodeMapWith(nodes), kindEntries });
		expect(records).toEqual([
			expect.objectContaining({ code: 'separator-default-undeclared', severity: 'error', canProceed: false, ownerKind: 'member_list', slotName: 'member', details: { arms: ['comma', 'semi'] } })
		]);
	});
});
