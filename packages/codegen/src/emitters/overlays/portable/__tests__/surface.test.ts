import { describe, expect, it } from 'vitest';
import { type GrammarInput, readBindings, resolveRoutes, slotModelOf } from '../../../../bindings/index.ts';
import { emitPortableSurface } from '../surface.ts';

const input = async (scm: string): Promise<GrammarInput> => ({
	grammar: 'g',
	bindings: await readBindings(scm),
	model: slotModelOf({
		nodes: [
			{
				kind: 'binary',
				slots: [
					{ name: 'operator', required: true, values: [{ kind: 'terminal', value: '+' }] }
				]
			},
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
		nodeType: 'TestNode',
		routes: resolveRoutes(await input(scm)),
		readTest: (entry) =>
			entry.pins.length === 0
				? []
				: [{ up: 0, via: [], plan: { op: 'eq', text: '+', slots: { 1: 0 } } }],
		kindIdOf: (kind) => `TSKindId.${kind[0]!.toUpperCase()}${kind.slice(1)}`,
		fixedText: [['TSKindId.Plus', '+']],
		flags: [],
		flagTypes: [],
		slotFlags: [],
		slotFlagTypes: []
	});

const SCM = [
	'(binary operator: "+") @expression.binary.add',
	'(binary) @expression.binary',
	'(assign) @expression.assignment.add',
	'(call) @expression.call',
	'(block (call) @expression.call.nested)'
].join('\n');

describe('emitPortableSurface', () => {
	it('types crossing candidates and uses the same facts for the exact-kind shortcut', async () => {
		const text = await emit('(call) @literal.string.raw\n(assign) @literal.string.interpolated.raw');
		expect(text).toContain('\t"literal.string.raw": TSKindId.Assign | TSKindId.Call;');
		expect(text).toContain('\t\t"literal.string.raw": { ids: [TSKindId.Assign, TSKindId.Call], exact: true },');
	});

	it('keeps a crossing guard conditional when the kind also reads without its fact', async () => {
		const text = await emit(
			'(binary operator: "+") @literal.string.interpolated.raw\n(binary) @literal.string\n(assign) @literal.string.raw'
		);
		expect(text).toContain('\t\t"literal.string.raw": { ids: [TSKindId.Assign, TSKindId.Binary], exact: false },');
	});

	it('ignores a fallback after an unconditional crossing claim for the exact-kind shortcut', async () => {
		const text = await emit(
			'(call) @literal.string.interpolated.raw\n(call) @literal.string\n(assign) @literal.string.raw'
		);
		expect(text).toContain('\t\t"literal.string.raw": { ids: [TSKindId.Assign, TSKindId.Call], exact: true },');
	});

	it('keeps a crossing guard conditional when its fact depends on placement', async () => {
		const text = await emit('(block (call) @literal.string.interpolated.raw)\n(assign) @literal.string.raw');
		expect(text).toContain('\t\t"literal.string.raw": { ids: [TSKindId.Assign, TSKindId.Call], exact: false },');
	});

	it('writes one entry and one id for kinds the parser shows by one name', async () => {
		const routes = resolveRoutes({
			grammar: 'g',
			bindings: await readBindings('(call) @expression.call'),
			model: slotModelOf({
				nodes: [
					{ kind: 'call', slots: [] },
					{ kind: '_call', slots: [] },
					{
						kind: 'holder',
						slots: [
							{ name: 'item', values: [{ kind: 'node-ref', name: '_call', parseKind: 'call' }] }
						]
					}
				]
			}),
			textTokens: new Set(),
			layoutSlots: []
		});
		const text = emitPortableSurface({ nodeType: 'TestNode', routes, readTest: () => [], kindIdOf: () => 'TSKindId.Call', fixedText: [], flags: [], flagTypes: [], slotFlags: [], slotFlagTypes: [] });
		expect(text).toContain('\t"expression.call": TSKindId.Call;');
		expect(text).toContain('\t\t"expression.call": { ids: [TSKindId.Call], exact: true },');
		expect(text.match(/\[TSKindId\.Call\]: \[/g)).toHaveLength(1);
		expect(text).toContain('\t\t[TSKindId.Call]: [{ path: "expression.call", within: [], test: [] }],');
	});

	it('types each path by the kind ids read at or under it', async () => {
		const text = await emit(SCM);
		expect(text).toContain('\t"expression": TSKindId.Assign | TSKindId.Binary | TSKindId.Call;');
		expect(text).toContain('\t"expression.binary.add": TSKindId.Binary;');
	});

	it('types a kinds node and a guard per path, each holding only its child segments', async () => {
		const text = await emit(SCM);
		expect(text).toContain(
			'\t"expression": { readonly $path: "expression"; readonly "assignment": PortableKindsAt["expression.assignment"]; readonly "binary": PortableKindsAt["expression.binary"]; readonly "call": PortableKindsAt["expression.call"] };'
		);
		expect(text).toContain(
			'\t"expression.call": PortableGuard<PortableIds["expression.call"], TestNode> & { readonly "nested": PortableIsAt["expression.call.nested"] };'
		);
		expect(text).toContain('export interface PortableIs { readonly "expression": PortableIsAt["expression"] }');
		expect(text).toContain("import type { TestNode } from './types.js';");
	});

	it('writes the table: paths, entries in read order with placements nearest first, and fixed texts', async () => {
		const text = await emit(SCM);
		expect(text).toContain('\t\t"expression.binary": { ids: [TSKindId.Binary], exact: true },');
		expect(text).toContain('\t\t"expression.binary.add": { ids: [TSKindId.Binary], exact: false },');
		expect(text).toContain('\t\t"expression.call": { ids: [TSKindId.Call], exact: true },');
		expect(text).toContain('\t\t"expression.call.nested": { ids: [TSKindId.Call], exact: false },');
		expect(text).not.toContain('aliases');
		expect(text).toContain(
			'\t\t[TSKindId.Binary]: [{ path: "expression.binary.add", within: [], test: [{"up":0,"via":[],"plan":{"op":"eq","text":"+","slots":{"1":0}}}] }, { path: "expression.binary", within: [], test: [] }],'
		);
		expect(text).toContain(
			'\t\t[TSKindId.Call]: [{ path: "expression.call.nested", within: [TSKindId.Block], test: [] }, { path: "expression.call", within: [], test: [] }],'
		);
		expect(text).toContain('\tfixedText: { [TSKindId.Plus]: "+" },');
		expect(text).toContain('export const rows: PortableRows = Object.freeze({ table, querySlots });');
		expect(text).not.toContain('portableSurface');
	});

	it('decides a path by kind id when every entry a guard can reach is under it, though an entry after an unconditional one is not', async () => {
		const text = await emit(['(assign) @expression.assignment.add', '(assign) @expression.assignment'].join('\n'));
		expect(text).toContain('\t\t[TSKindId.Assign]: [{ path: "expression.assignment.add", within: [], test: [] }, { path: "expression.assignment", within: [], test: [] }],');
		expect(text).toContain('\t\t"expression.assignment.add": { ids: [TSKindId.Assign], exact: true },');
	});

	it('declares each kind\'s flags on its node interface, so a where condition\'s is takes only them', async () => {
		const text = emitPortableSurface({
			nodeType: 'TestNode',
			routes: resolveRoutes(await input(SCM)),
			readTest: () => [],
			kindIdOf: () => 'TSKindId.Call',
			fixedText: [],
			flags: [],
			flagTypes: [['Call', ['async', 'static']]],
			slotFlags: [],
			slotFlagTypes: []
		});
		expect(text).toContain(["declare module './types.js' {", '\tinterface Call {', '\t\treadonly __flags__?: "async" | "static";', '\t}', '}'].join('\n'));
		const none = emitPortableSurface({ nodeType: 'TestNode', routes: resolveRoutes(await input(SCM)), readTest: () => [], kindIdOf: () => 'TSKindId.Call', fixedText: [], flags: [], flagTypes: [], slotFlags: [], slotFlagTypes: [] });
		expect(none).not.toContain('declare module');
	});
});
