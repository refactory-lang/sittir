import { describe, expect, it } from 'vitest';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { outputSpellingSites } from '../../src/emit/output-spellings.ts';
import { loadNodeModel } from '../../src/validate/common.ts';

const model = {
	modelTypes: { interpolation: 'branch', format_expression: 'branch' } as Record<string, string>,
	slotAccessors: { interpolation: { _expression: 'expression', _debug: 'debug' } } as Record<string, Record<string, string>>,
	displayUnions: { format_expression: [{ storage: 'interpolation', literal: false }] }
};

describe('outputSpellingSites', () => {
	it('keys a site by its storage kind, and a display of that storage reaches it through the display table', () => {
		const sites = outputSpellingSites('python', model);
		expect(sites('interpolation')).toEqual({ kind: 'interpolation', slot: 'debug', storageKey: '_debug' });
		expect(sites('format_expression')).toEqual(sites('interpolation'));
		expect(sites('string')).toBeUndefined();
	});

	it('fails naming the entry when the node model renames its slot', () => {
		const renamed = { ...model, slotAccessors: { interpolation: { _expression: 'expression', _is_debug: 'isDebug' } } };
		expect(() => outputSpellingSites('python', renamed)).toThrow(
			"emit-factory-source: the output-spelling table names python interpolation.debug, and python's interpolation has no slot 'debug'"
		);
	});

	it('fails naming the entry when the node model has no such kind', () => {
		const renamed = { ...model, modelTypes: { interpolated: 'branch', format_expression: 'branch' } };
		expect(() => outputSpellingSites('python', renamed)).toThrow(
			"emit-factory-source: the output-spelling table names python interpolation.debug, and python's node model has no kind 'interpolation'"
		);
	});

	it("resolves against python's node model", async () => {
		expect(outputSpellingSites('python', await loadNodeModel('python'))('format_expression')).toEqual({
			kind: 'interpolation',
			slot: 'debug',
			storageKey: '_debug'
		});
	});
});

describe('a debug interpolation prints only when its builders spell it as written', () => {
	it.each(['{x=}', '{a=:.2f}'])('f"%s" prints', async (field) => {
		await expect(emitFactorySourceText('python', `s = f"${field}"\n`, 'rebuild')).resolves.toContain('interpolation');
	});

	it.each([
		['{x =}', '{x=}'],
		['{x = }', '{x=}'],
		['{ x=}', '{x=}'],
		['{a+b=}', '{a + b=}']
	])('f"%s" refuses by name', async (field, spelled) => {
		await expect(emitFactorySourceText('python', `s = f"${field}"\n`, 'rebuild')).rejects.toThrow(
			`emit-factory-source: the python interpolation \`${field}\` prints its debug spelling as written, and its builders spell it \`${spelled}\``
		);
	});

	it('a debug field in a format specifier refuses by its display name', async () => {
		await expect(emitFactorySourceText('python', 's = f"{x:{y = }}"\n', 'rebuild')).rejects.toThrow(
			'emit-factory-source: the python format_expression `{y = }` prints its debug spelling as written, and its builders spell it `{y=}`'
		);
	});
});
