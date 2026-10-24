import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../grammars.ts';
import { compileGrammar } from '../compile.ts';
import { linkAliasStorages } from '../alias-envelopes.ts';
import type { AssembledNode } from '../model/node-map.ts';
import type { LinkedRefineForm } from '../types.ts';

const { nodeMap } = await compileGrammar({ package: grammarPackage('typescript') });
const display = nodeMap.nodes.get('interface_body')!;
const storage = nodeMap.nodes.get('object_type')!;
const forms = nodeMap.refineForms!;

const copyOf = <T extends object>(node: T, patch: Partial<T> = {}): T =>
	Object.defineProperties(
		Object.assign(Object.create(Object.getPrototypeOf(node)) as T, node),
		Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, { value }]))
	);
const pair = (shown: AssembledNode): ReadonlyMap<string, AssembledNode> =>
	new Map([
		[shown.kind, shown],
		[storage.kind, copyOf(storage)]
	]);
const formsWith = (own: readonly LinkedRefineForm[] | undefined): ReadonlyMap<string, readonly LinkedRefineForm[]> => {
	const table = new Map(forms);
	if (own === undefined) table.delete(display.kind);
	else table.set(display.kind, own);
	return table;
};

describe("a flat alias display is checked against its storage after the copy", () => {
	it("links a display whose slots and forms are its storage's", () => {
		expect(forms.get(display.kind)?.map((form) => form.name)).toEqual(['curly', 'flow']);
		expect(() => linkAliasStorages(pair(copyOf(display)), forms)).not.toThrow();
	});

	it('refuses a display whose slots differ from its storage', () => {
		expect(() => linkAliasStorages(pair(copyOf(display, { slots: display.slots.slice(1) })), forms)).toThrow(
			"alias envelope 'interface_body': its slots"
		);
	});

	it('refuses a display whose form selects other text than its storage', () => {
		const broken = forms.get(display.kind)!.map((form) => (form.name === 'curly' ? { ...form, selections: { ...form.selections, 'opening:': '{|' } } : form));
		expect(() => linkAliasStorages(pair(copyOf(display)), formsWith(broken))).toThrow("alias envelope 'interface_body': its forms");
	});

	it("refuses a display without its storage's forms", () => {
		expect(() => linkAliasStorages(pair(copyOf(display)), formsWith(undefined))).toThrow("alias envelope 'interface_body': its forms");
	});
});
