import { describe, expect, it } from 'vitest';
import { grammarPackage, sittirDirOf } from '../../../grammars.ts';
import { readJoinSeams } from '../join-seams/file.ts';

function kindsJoiningNext(grammar: string): ReadonlySet<string> {
	const file = readJoinSeams(sittirDirOf(grammarPackage(grammar)));
	if (file === undefined) throw new Error(`${grammar} has no committed join seams; regenerate ${grammar}`);
	return new Set(file.joinsNextKinds);
}

describe('the kinds whose last token can join what is written after them', () => {
	it('python: a string, its content, an escaped brace and an interpolation end in tokens that join nothing, and the brace opening an interpolation joins', () => {
		const kinds = kindsJoiningNext('python');
		for (const kind of ['string', 'string_content', 'escape_interpolation', 'interpolation']) expect(kinds.has(kind), kind).toBe(false);
		expect(kinds.has('{')).toBe(true);
	});

	it('rust: a range pattern open on the right ends in a `..` that joins a following `=`', () => {
		const kinds = kindsJoiningNext('rust');
		for (const kind of ['range_pattern_with_left_bare', 'range_pattern_with_left', '..']) expect(kinds.has(kind), kind).toBe(true);
	});
});
