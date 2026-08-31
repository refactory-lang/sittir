/**
 * factories.ts — the single-field factory's direct-value parameter.
 *
 * A single non-stamp, non-hidden, singular slot gets a direct-value signature
 * `fn(value: T)` instead of a config-object wrapper. The parameter is
 * positional, so its identifier is invisible to callers and is spelled
 * `value` rather than derived from the slot.
 *
 * The bug this guards: the parameter once used the slot's name verbatim, and
 * a slot named for a reserved word — python's `argument_list`, whose sole
 * slot is `arguments` — made the emitted module unloadable, because a bare
 * `arguments` parameter is illegal in an ECMAScript module. A fixed `value`
 * cannot collide with any slot name, so the failure is unreachable rather
 * than escaped.
 */

import { FIELD, SEQ, SYMBOL, PATTERN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';

function makeReservedWordSingleFieldNodeMap() {
	// A single-field branch whose sole field is named `arguments` — a JS
	// reserved word — mirroring python's `argument_list` shape once its
	// predicate list is hoisted into a single-slot visible group.
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: FIELD, name: 'arguments', content: { type: SYMBOL, name: 'expr' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	const parentRender = flatten(parentRule);
	nodes.set('call', new AssembledBranch('call', parentRender, parentRender));
	nodes.set('expr', new AssembledPattern('expr', { type: PATTERN, value: '[a-z]+' }));
	const nodeMap = makeNodeMapWith(nodes);
	return nodeMap;
}

describe('factories emitter — single-field factory direct-value parameter', () => {
	it('spells the parameter `value`, never the slot name', () => {
		const nodeMap = makeReservedWordSingleFieldNodeMap();
		const emitted = emitFactories({ grammar: 'test', nodeMap });

		// `call` forwards its sole slot's single kind, so the direct parameter
		// lives on the private implementation behind the forwarding wrapper.
		expect(emitted).toContain('function _buildCall(value');
		// A bare `arguments` parameter would make the module unloadable; the
		// escaped spelling would merely be noise. Neither should appear.
		expect(emitted).not.toMatch(/function _?buildCall\(arguments_?[?:]/);
	});
});
