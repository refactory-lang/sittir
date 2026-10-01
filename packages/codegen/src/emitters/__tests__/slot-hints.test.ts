import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const rustTypes = () => readFileSync('packages/rust/src/types.ts', 'utf8');

function interfaceBlock(src: string, name: string): string {
	const start = src.indexOf(`export interface ${name} {`);
	return src.slice(start, src.indexOf('\n}\n', start));
}

describe('__slotHints__', () => {
	it('a config kind stamps each slot with the input its $with setter takes', () => {
		const fn = interfaceBlock(rustTypes(), 'FunctionItem');
		expect(fn).toContain('readonly __slotHints__?: {');
		expect(fn).toContain('readonly parameters: SlotHint<T.Parameters>;');
		expect(fn).toContain('readonly visibilityModifier: SlotHint<T.VisibilityModifier, true>;');
	});
	it('a slot set with rest arguments stamps its rest type and says so', () => {
		expect(interfaceBlock(rustTypes(), 'Lifetimes')).toMatch(
			/readonly lifetimes: SlotHint<\s*NonEmptyArray<[^;]*>,\s*false,\s*true\s*>;/
		);
	});
	it('an elements seat stamps the config object of its group beside its rest type', () => {
		expect(interfaceBlock(rustTypes(), 'ParametersElements')).toMatch(
			/readonly elements: SlotHint<\s*NonEmptyArray<[^;]*>,\s*false,\s*true,\s*T\.AttributedParameter\.Config\s*>;/
		);
	});
	it('a multiple slot whose storage is not verbatim is set with one array value', () => {
		expect(interfaceBlock(rustTypes(), 'Block')).toContain(
			"readonly statements: SlotHint<NonNullable<T.Block.Config>['statements'], true>;"
		);
	});
	it('a list owner stamps the items its list factory takes and the options it takes', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters').replace(/\s+/g, ' ');
		expect(ps).toContain(
			'$listView: ListViewHint< | T.AttributedParameter | T.Parameter | T.SelfParameter | T.VariadicParameter | TSKindId.Underscore | T.Type | T.TypeIdentifier.Types, { delimiter?: Delimiter.None | Delimiter.Trailing } >'
		);
	});
	it('a list node stamps the same view as its owner', () => {
		const list = interfaceBlock(rustTypes(), 'ParametersElements').replace(/\s+/g, ' ');
		expect(list).toContain('$listView: ListViewHint< | T.AttributedParameter');
	});
	it('a list slot reads as the stored list node', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters').replace(/\s+/g, ' ');
		expect(ps).toContain('parametersElements(): ParametersElements | undefined;');
	});
	it('a slot that holds a list stamps the builder arguments its setter takes', () => {
		const fn = interfaceBlock(rustTypes(), 'FunctionItem').replace(/\s+/g, ' ');
		expect(fn).toContain('readonly parameters: ListSlotHint< | T.AttributedParameter | T.Parameter');
		expect(fn).toContain('readonly whereClause: ListSlotHint<T.WherePredicate, { delimiter?: Delimiter.None | Delimiter.Trailing }>;');
	});
	it('a kind that is not a list stamps no $listView', () => {
		expect(interfaceBlock(rustTypes(), 'FunctionItem')).not.toContain('$listView');
	});
});
