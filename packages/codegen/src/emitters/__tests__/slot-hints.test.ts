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
	it('a sole-list owner stamps the elements its factory takes, its factory options and its list slot', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters').replace(/\s+/g, ' ');
		expect(ps).toContain(
			"ListOwnerHint< | T.AttributedParameter | T.Parameter | T.SelfParameter | T.VariadicParameter | TSKindId.Underscore | T.Type | T.TypeIdentifier.Types, { delimiter?: Delimiter.None | Delimiter.Trailing }, 'parametersElements', T.AttributedParameter.Config >"
		);
	});
	it('a sole-list owner declares its list accessor as the items the factory takes', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters').replace(/\s+/g, ' ');
		expect(ps).toMatch(/parametersElements\(\): \| NonEmptyArray< \| T\.AttributedParameter[^;]*> \| undefined;/);
		expect(ps).not.toContain('parametersElements(): ParametersElements');
	});
	it('a kind that is not a list owner stamps no $listOwner', () => {
		expect(interfaceBlock(rustTypes(), 'FunctionItem')).not.toContain('$listOwner');
	});
});
