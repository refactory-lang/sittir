import { describe, expect, it } from 'vitest';
import { type GrammarInput, readBindings, resolveRoutes, slotModelOf } from '../../../../bindings/index.ts';
import { emitPortableSurface } from '../surface.ts';

const input = async (scm: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(scm),
	model: slotModelOf({
		nodes: [
			{ kind: 'binary', slots: [{ name: 'operator', propertyName: 'operator', required: true, values: [{ kind: 'terminal', value: '+' }] }] },
			{ kind: 'call', slots: [] },
			{ kind: 'block', slots: [] },
			{ kind: 'assign', slots: [] }
		]
	}),
	textTokens: new Set(),
	layoutSlots: []
});

const emit = async (scm: string) =>
	emitPortableSurface({
		routes: resolveRoutes(await input(scm)),
		readTest: (entry) => (entry.pins.length === 0 ? [] : [{ up: 0, via: [], plan: { op: 'eq', text: '+', fields: ['operator'], kinds: [] } }]),
		kindIdOf: (kind) => `TSKindId.${kind[0]!.toUpperCase()}${kind.slice(1)}`,
		fixedText: [['TSKindId.Plus', '+']]
	});

const SCM = [
	'(binary operator: "+") @expression.binary.add',
	'(binary) @expression.binary',
	'(assign) @expression.assignment.add',
	'(call) @expression.call',
	'(block (call) @expression.call.nested)'
].join('\n');

describe('emitPortableSurface', () => {
	it('types each path by the kind ids read at or under it', async () => {
		const text = await emit(SCM);
		expect(text).toContain('\t"expression": TSKindId.Assign | TSKindId.Binary | TSKindId.Call;');
		expect(text).toContain('\t"expression.binary.add": TSKindId.Binary;');
	});

	it('types a kinds node and a guard per path, each holding its child segments and the aliases under it', async () => {
		const text = await emit(SCM);
		expect(text).toContain(
			'\t"expression": { readonly $ids: readonly PortableIds["expression"][]; readonly "assignment": PortableKindsAt["expression.assignment"]; readonly "binary": PortableKindsAt["expression.binary"]; readonly "call": PortableKindsAt["expression.call"]; readonly "nested": PortableKindsAt["expression.call.nested"] };'
		);
		expect(text).toContain('\t"expression.call": PortableGuard<PortableIds["expression.call"]> & { readonly "nested": PortableIsAt["expression.call.nested"] };');
		expect(text).toContain('export interface PortableIs { readonly "expression": PortableIsAt["expression"];');
	});

	it('writes the table: paths, aliases, entries in read order with placements nearest first, and fixed texts', async () => {
		const text = await emit(SCM);
		expect(text).toContain('\t\t"expression.binary": { ids: [TSKindId.Binary], exact: true },');
		expect(text).toContain('\t\t"expression.binary.add": { ids: [TSKindId.Binary], exact: false },');
		expect(text).toContain('\t\t"expression.call": { ids: [TSKindId.Call], exact: true },');
		expect(text).toContain('\t\t"expression.call.nested": { ids: [TSKindId.Call], exact: false },');
		expect(text).toContain('["expression", "nested", "expression.call.nested"]');
		expect(text).not.toContain('"add", "expression.');
		expect(text).toContain(
			'\t\t[TSKindId.Binary]: [{ path: "expression.binary.add", within: [], test: [{"up":0,"via":[],"plan":{"op":"eq","text":"+","fields":["operator"],"kinds":[]}}] }, { path: "expression.binary", within: [], test: [] }],'
		);
		expect(text).toContain('\t\t[TSKindId.Call]: [{ path: "expression.call.nested", within: [TSKindId.Block], test: [] }, { path: "expression.call", within: [], test: [] }],');
		expect(text).toContain('\tfixedText: { [TSKindId.Plus]: "+" },');
		expect(text).toContain('export const portable = portableSurface<PortableKinds, PortableIs>(table, querySlots);');
	});
});
