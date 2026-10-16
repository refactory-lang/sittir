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
			/readonly items: SlotHint<\s*NonEmptyArray<[^;]*>,\s*false,\s*true\s*>;/
		);
	});
	it('an elements seat stamps the config object of its group beside its rest type', () => {
		expect(interfaceBlock(rustTypes(), 'ParametersElements')).toMatch(
			/readonly items: SlotHint<\s*NonEmptyArray<[^;]*>,\s*false,\s*true,\s*T\.AttributedParameter\.Config\s*>;/
		);
	});
	it('a multiple slot whose storage is not verbatim is set with rest arguments too, typed off its config field', () => {
		expect(interfaceBlock(rustTypes(), 'Block').replace(/\s+/g, ' ')).toContain(
			"readonly statements: SlotHint<NonNullable<NonNullable<T.Block.Config>['statements']>[number][], true, true>;"
		);
	});
	it('a parameter branch stamps its plain-or-receiver choice and has no list view', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters').replace(/\s+/g, ' ');
		expect(ps).toContain('readonly elements: SlotHint<T.ParametersElements | T.ParametersElementsReceiver, true>;');
		expect(ps).not.toContain('$listView');
	});
	it('the ordinary list stamps its admitted items and delimiter options', () => {
		const list = interfaceBlock(rustTypes(), 'ParametersElements').replace(/\s+/g, ' ');
		expect(list).toContain('$listView: ListViewHint< T.AttributedParameter | T.Parameter | T.VariadicParameter | TSKindId.Underscore | T.Type | T.TypeIdentifier.Types, { delimiter?: Delimiter.None | Delimiter.Trailing } >');
	});
	it('a list slot reads as the stored list node', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters').replace(/\s+/g, ' ');
		expect(ps).toContain('elements(): ParametersElements | ParametersElementsReceiver | undefined;');
	});
	it('a list slot stamps builder arguments while a parameter branch slot takes its node', () => {
		const fn = interfaceBlock(rustTypes(), 'FunctionItem').replace(/\s+/g, ' ');
		expect(fn).toContain('readonly parameters: SlotHint<T.Parameters>;');
		expect(fn).not.toContain('readonly parameters: ListSlotHint<');
		expect(fn).toContain('readonly whereClause: ListSlotHint<T.WherePredicate, { delimiter?: Delimiter.None | Delimiter.Trailing }>;');
	});
	it('a kind that is not a list stamps no $listView', () => {
		expect(interfaceBlock(rustTypes(), 'FunctionItem')).not.toContain('$listView');
	});
});
