/**
 * factories.ts — single-field-factory reserved-word parameter naming.
 *
 * `emitFieldCarryingFactory`'s Gap-5 optimization (single non-stamp,
 * non-hidden, singular slot) emits a direct-value signature
 * `fn(paramName: T)` instead of a config-object wrapper. Regression test for
 * a bug where the emitted parameter used the raw `soleField.propertyName`
 * (the grammar's field name verbatim) instead of `soleField.paramName` (the
 * `safeParamName()`-sanitized spelling, e.g. `arguments` → `arguments_`) —
 * a bare `arguments` parameter is invalid in an ECMAScript module and broke
 * loading the emitted factories.ts entirely (surfaced by python's
 * `argument_list`'s newly-promoted single-field `_argument_list_group1`
 * body, whose sole slot is named `arguments`).
 */

import { FIELD, SEQ, SYMBOL, PATTERN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFactories } from '../factories.ts';
import { computeSlotClasses } from '../shared.ts';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

function makeReservedWordSingleFieldNodeMap() {
	// A single-field branch whose sole field is named `arguments` — a JS
	// reserved word — mirroring python's `argument_list` shape once its
	// predicate list is hoisted into a single-slot visible group.
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'arguments', content: { type: SYMBOL, name: 'expr' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('call', new AssembledBranch('call', parentRule, deleteWrapper(parentRule), deleteWrapper(parentRule)));
	nodes.set('expr', new AssembledPattern('expr', { type: PATTERN, value: '[a-z]+' }));
	const nodeMap = makeNodeMapWith(nodes);
	// Gap 5's single-field-factory path reads the pre-computed `slotClass`
	// (set post-assembly by `computeSlotClasses`, not inline) — run it here
	// to mirror the real pipeline's `generate.ts` call.
	computeSlotClasses(nodeMap);
	return nodeMap;
}

describe('factories emitter — single-field factory reserved-word parameter naming', () => {
	it('emits the safeParamName-sanitized parameter (arguments_), not the raw reserved-word field name', () => {
		const nodeMap = makeReservedWordSingleFieldNodeMap();
		const emitted = emitFactories({ grammar: 'test', nodeMap });

		expect(emitted).toContain('export function call(arguments_');
		expect(emitted).not.toMatch(/export function call\(arguments[?:]/);
	});
});
