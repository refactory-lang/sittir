import { describe, expect, it } from 'vitest';
import { grammarPackage, sittirDirOf } from '../../../grammars.ts';
import { readJoinSeams, type TightSeamRecord } from '../join-seams/file.ts';
import { SPACE_IS_PARSE_ERROR } from '../join-seams/oracle.ts';

function tightAt(grammar: string, seam: string): readonly TightSeamRecord[] {
	const file = readJoinSeams(sittirDirOf(grammarPackage(grammar)));
	if (file === undefined) throw new Error(`${grammar} has no committed join seams; regenerate ${grammar}`);
	return file.tight.filter((record) => record.seam === seam);
}

describe('the seams the derivation proves tight', () => {
	it('csharp: the quote the scanner writes after `$` is tight for the whole seam, found by the node type the parser gives the renamed token', () => {
		const [record, ...rest] = tightAt('csharp', 'interpolated_string_expression:members.0/members.1');
		expect(rest).toEqual([]);
		expect(record).toMatchObject({ previous: '$', next: '"', reason: SPACE_IS_PARSE_ERROR });
		expect(record!.after).toBeUndefined();
	});

	it('python: an interpolation closes tight only after a format specifier', () => {
		expect(tightAt('python', 'interpolation:members.5')).toEqual([expect.objectContaining({ next: '}', after: 'interpolation:members.4' })]);
	});

	it('regex: a `)` that closes another group witnesses nothing for an inline flags toggle', () => {
		expect(tightAt('regex', 'inline_flags_group_toggle:members.3')).toEqual([]);
	});

	it('rust: a repetition operator is tight after its `)`, where a space lexes into the separator', () => {
		expect(tightAt('rust', 'token_repetition:members.5')).toEqual([
			expect.objectContaining({ previous: ')', reason: 'the space lexes into the next token' })
		]);
	});
});
