import { describe, expect, it } from 'vitest';
import { emittedTemplates } from './support/emitted-templates.ts';
import { slot, type Body } from '../render-body.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';
import { PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { DelimiterMode, RenderRule } from '../../types/rule.ts';
import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';
import { layoutNodes, makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitRenderModule } from '../render-module.ts';
import { findEntryForLiteralText, type GeneratedKindEntry } from '../../dsl/symbol-table.ts';

interface Member {
	readonly kind: string;
	readonly fieldName?: string;
	readonly multiplicity?: 'array' | 'nonEmptyArray';
	readonly separator?: { readonly text: string; readonly leading?: DelimiterMode; readonly trailing?: DelimiterMode };
}

function compound(members: readonly Member[], body: Body): string {
	const ruleOf = (kindEntries: readonly GeneratedKindEntry[]): RenderRule => ({
		type: SEQ,
		members: members.map((member, i) => ({
			type: SYMBOL,
			name: member.kind,
			id: `rule:holder:members.${i}`,
			...(member.fieldName === undefined ? {} : { fieldName: member.fieldName }),
			...(member.multiplicity === undefined ? {} : { multiplicity: member.multiplicity }),
			...(member.separator === undefined
				? {}
				: {
						separator: {
							value: { type: STRING, value: member.separator.text, resolvedKindId: findEntryForLiteralText(kindEntries, member.separator.text)?.id },
							...(member.separator.leading === undefined ? {} : { leading: member.separator.leading }),
							...(member.separator.trailing === undefined ? {} : { trailing: member.separator.trailing })
						}
					})
		}))
	}) as unknown as RenderRule;
	const { nodeMap, generatedIdTables } = withGeneratedIdTables(
		(kindEntries) => {
			const rule = ruleOf(kindEntries);
			const nodes = new Map<string, AssembledNode>();
			nodes.set('holder', new AssembledBranch('holder', rule as never, rule, { kindEntries }));
			for (const kind of new Set(members.map((member) => member.kind))) nodes.set(kind, new AssembledPattern(kind, { type: PATTERN, value: '[a-z]+' }, { kindEntries }));
			for (const [kind, node] of layoutNodes(kindEntries)) nodes.set(kind, node);
			return makeNodeMapWith(nodes);
		},
		{ comma: ',', colon: ':' }
	);
	return emitRenderModule('rust', emittedTemplates({ holder: body }), nodeMap, generatedIdTables, { joins: NO_JOINS }).nodeRs.contents;
}

function listViewOf(emitted: string, ident: string): string {
	const start = emitted.indexOf(`let ${ident} = ListView {`);
	expect(start, `a list view for ${ident}`).toBeGreaterThanOrEqual(0);
	return emitted.slice(start, emitted.indexOf('    };', start));
}

describe("a compound kind's list slot renders its own separator and delimiters", () => {
	it('writes the separator before the first item when the slot carries a mandatory leading delimiter', () => {
		const emitted = compound(
			[
				{ kind: 'head', fieldName: 'type' },
				{ kind: 'member', multiplicity: 'array', separator: { text: ',', leading: 'mandatory' } }
			],
			[...slot('type'), ...slot('member')]
		);
		const view = listViewOf(emitted, 'member');
		expect(view).toContain('token: ",",');
		expect(view).toContain('leading: true,');
		expect(view).toContain('trailing: false,');
	});

	it('writes the separator after the last item when the slot carries a mandatory trailing delimiter', () => {
		const emitted = compound(
			[
				{ kind: 'label', multiplicity: 'nonEmptyArray', separator: { text: ':', trailing: 'mandatory' } },
				{ kind: 'head', fieldName: 'type' }
			],
			[...slot('label'), ...slot('type')]
		);
		const view = listViewOf(emitted, 'label');
		expect(view).toContain('token: ":",');
		expect(view).toContain('leading: false,');
		expect(view).toContain('trailing: true,');
	});

	it("does not give a list slot without a separator another slot's separator", () => {
		const emitted = compound(
			[
				{ kind: 'label', multiplicity: 'nonEmptyArray', separator: { text: ':', trailing: 'mandatory' } },
				{ kind: 'statement', fieldName: 'statements', multiplicity: 'array' }
			],
			[...slot('label'), ...slot('statements')]
		);
		expect(listViewOf(emitted, 'label')).toContain('token: ":",');
		const statements = listViewOf(emitted, 'statements');
		expect(statements).toContain('token: "",');
		expect(statements).toContain('leading: false,');
		expect(statements).toContain('trailing: false,');
	});

	it('refuses an optional delimiter on a compound kind, which has no field to record it per node', () => {
		const emit = (): string =>
			compound(
				[
					{ kind: 'head', fieldName: 'type' },
					{ kind: 'member', multiplicity: 'array', separator: { text: ',', trailing: 'optional' } }
				],
				[...slot('type'), ...slot('member')]
			);
		expect(emit).toThrow(EmitHaltedError);
		try {
			emit();
		} catch (error) {
			expect(((error as EmitHaltedError).blocking as readonly GrammarDiagnostic[]).map((diagnostic) => [diagnostic.code, diagnostic.ownerKind, diagnostic.slotName])).toEqual([
				['optional-delimiter-on-compound-slot', 'holder', 'member']
			]);
		}
	});
});
