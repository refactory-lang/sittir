import { describe, expect, it } from 'vitest';
import { FIELD, OPTIONAL, PATTERN, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { fromHelperSlotRead } from '../../compiler/diagnostics/grammar-diagnostics.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { emitRenderModule } from '../render-module.ts';
import { gate, slot } from '../render-body.ts';
import { emittedTemplates } from './support/emitted-templates.ts';

/** A parent whose template names `value` optionally, a field only its hidden helper `_holder` holds. */
function helperSlotNodeMap() {
	const parent: SeqRule<'link'> = { type: SEQ, members: [{ type: OPTIONAL, content: { type: SYMBOL, name: '_holder' } }] };
	const helper: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'identifier' } }]
	};
	return withGeneratedIdTables(() =>
		makeNodeMapWith(
			new Map<string, AssembledNode>([
				['holder_parent', new AssembledBranch('holder_parent', flatten(parent), flatten(parent))],
				['_holder', new AssembledBranch('_holder', flatten(helper), flatten(helper))],
				['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })]
			])
		)
	);
}

describe("a slot read through a hidden helper's field", () => {
	it('is recorded with its kind, slot and helper, and the body binds the slot absent', () => {
		const { nodeMap, generatedIdTables } = helperSlotNodeMap();
		const emitted = emitRenderModule('rust', emittedTemplates({ holder_parent: gate('value', slot('value')) }), nodeMap, generatedIdTables);
		expect(emitted.helperSlotReads).toEqual([{ kind: 'holder_parent', slot: 'value', helper: 'holder' }]);
		const from = emitted.nodeRs.contents.indexOf('fn render_holder_parent<');
		const body = emitted.nodeRs.contents.slice(from, emitted.nodeRs.contents.indexOf('\n}\n', from));
		expect(body).toContain('let value = View::new(None::<&str>, "{}");');
	});

	it('blocks the gate as slot-through-hidden-helper', () => {
		const diagnostic = fromHelperSlotRead('rust', { kind: 'holder_parent', slot: 'value', helper: 'holder' });
		expect(diagnostic).toMatchObject({
			code: 'slot-through-hidden-helper',
			severity: 'error',
			ownerKind: 'holder_parent',
			slotName: 'value',
			canProceed: false
		});
		expect(diagnostic.message).toContain("'value'");
		expect(diagnostic.message).toContain("'holder'");
	});
});
