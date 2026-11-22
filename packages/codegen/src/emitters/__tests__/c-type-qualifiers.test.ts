import { describe, expect, it } from 'vitest';
import { emitReadyModel } from '../../__tests__/helpers/emit-ready-model.ts';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import type { Body } from '../render-body.ts';
import { runTemplateEmitter } from '../templates.ts';

interface CEmit {
	readonly nodeMap: Awaited<ReturnType<typeof emitReadyModel>>['nodeMap'];
	readonly bodies: ReadonlyMap<string, Body>;
}

async function cEmit(): Promise<CEmit> {
	const { nodeMap, kindEntries, renderRules, joins } = await emitReadyModel('c');
	return { nodeMap, bodies: runTemplateEmitter({ grammar: 'c', nodeMap, kindEntries, renderRules, joins }).bodies };
}

let c: Promise<CEmit> | undefined;
const cOnce = (): Promise<CEmit> => (c ??= cEmit());

const placed = (body: Body | undefined): readonly string[] =>
	(body ?? []).flatMap((part) => (part.kind === 'slot' ? [part.name] : part.kind === 'text' ? [`'${part.text}'`] : []));

describe("C's type qualifiers on both sides of a type", () => {
	for (const kind of ['type_definition', 'type_descriptor']) {
		it(
			`${kind} holds both qualifier runs in one slot that a rebuild writes before the type, so \`int const\` rebuilds as \`const int\``,
			async () => {
				const { nodeMap, bodies } = await cOnce();
				const slots = nodeMap.nodes.get(kind)!.slots.filter((slot) => slot.values.some((value) => value.parseKind?.name === 'type_qualifier'));
				expect(slots.map((slot) => [slot.storageName, slot.isUnnamed])).toEqual([['type_qualifiers', false]]);
				const order = placed(bodies.get(kind));
				expect(order.filter((name) => name === 'type_qualifiers')).toHaveLength(1);
				expect(order.indexOf('type_qualifiers')).toBeLessThan(order.indexOf('type'));
			},
			FULL_PIPELINE_TIMEOUT
		);
	}

	it(
		'a pointer declarator writes its qualifiers after the star, so `int * const p` keeps its order',
		async () => {
			const { bodies } = await cOnce();
			const order = placed(bodies.get('pointer_declarator'));
			expect(order.indexOf("'*'")).toBeLessThan(order.indexOf('type_qualifier'));
			expect(order.indexOf('type_qualifier')).toBeLessThan(order.indexOf('declarator'));
		},
		FULL_PIPELINE_TIMEOUT
	);
});
