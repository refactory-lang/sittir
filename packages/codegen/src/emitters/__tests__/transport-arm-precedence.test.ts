import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledEnum, AssembledPattern, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { GeneratedIdTables } from '../../compiler/generated-metadata.ts';
import type { ChoiceRule, SeqRule } from '../../types/rule.ts';
import { emitRenderModule } from '../render-module.ts';
import { emittedTemplates } from './support/emitted-templates.ts';
import { slot } from '../render-body.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';

const kindEntries = [
	{ id: 28, kind: 'u8', symbolName: 'anon_sym_u8', anon: false },
	{ id: 2, kind: 'bool', symbolName: 'anon_sym_bool', anon: false }
];

// param: seq(field('type', $._t)); _t is a supertype over a pattern and an
// enum-of-literals, and the pattern also wears the enum's member ids on the
// wire elsewhere (rust aliases `u8` onto `identifier` in expression position).
function makeNodeMap() {
	const paramRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'type', content: { type: SYMBOL, name: '_t' } }]
	};
	const tRule: ChoiceRule = {
		type: CHOICE,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: '_prim' }
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('param', new AssembledBranch('param', flatten(paramRule), flatten(paramRule)));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set(
		'_prim',
		new AssembledEnum(
			'_prim',
			{ type: CHOICE, members: [{ type: STRING, value: 'u8' }, { type: STRING, value: 'bool' }] },
			{ kindEntries }
		)
	);
	nodes.set('_t', new AssembledSupertype('_t', tRule, [{ name: 'identifier' }, { name: '_prim' }]));
	return { ...makeNodeMapWith(nodes), terminalAliasWireIds: new Map([['identifier', [1, 28]]]) };
}

describe('supertype transport arm precedence', () => {
	it('routes an enum member id to the enum variant even when a pattern subtype also wears it', () => {
		const generatedIdTables: GeneratedIdTables = {
			kindIds: { identifier: 1, u8: 28, bool: 2, _t: 50, param: 60 },
			sourceArtifact: 'test'
		};
		const emitted = emitRenderModule(
			'rust',
			emittedTemplates({ param: slot('type') }),
			makeNodeMap(),
			generatedIdTables
		).transportRs.contents;
		expect(emitted).toContain('28 => Ok(Self::Prim(');
		expect(emitted).not.toContain('28 => Ok(Self::Identifier(');
	});
});
