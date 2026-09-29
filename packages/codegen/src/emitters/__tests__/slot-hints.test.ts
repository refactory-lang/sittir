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
		expect(interfaceBlock(rustTypes(), 'ParametersElements')).toMatch(/readonly elements: SlotHint<\s*NonEmptyArray<[^;]*>,\s*false,\s*true\s*>;/);
	});
	it('a multiple slot whose storage is not verbatim is set with one array value', () => {
		expect(interfaceBlock(rustTypes(), 'Block')).toContain(
			"readonly statements: SlotHint<NonNullable<T.Block.Config>['statements'], true>;"
		);
	});
	it('a sole-list owner stamps its stored element and its factory options', () => {
		const ps = interfaceBlock(rustTypes(), 'Parameters');
		expect(ps).toContain(
			'readonly $listOwner: ListOwnerHint<T.AttributedParameter, { delimiter?: Delimiter.None | Delimiter.Trailing }>;'
		);
	});
	it('a kind that is not a list owner stamps no $listOwner', () => {
		expect(interfaceBlock(rustTypes(), 'FunctionItem')).not.toContain('$listOwner');
	});
});
