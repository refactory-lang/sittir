import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const COMPOUNDS: Readonly<Record<string, string>> = {
	if: 'if d:\n  pass\n',
	ifElse: 'if d:\n  pass\nelse:\n  pass\n',
	for: 'for a in b:\n  pass\n',
	while: 'while a:\n  pass\n',
	try: 'try:\n  pass\nexcept A:\n  pass\n',
	with: 'with a:\n  pass\n',
	match: 'match a:\n  case 1:\n    pass\n'
};

describe('a compound statement ends its line when another statement is written after it', () => {
	for (const [name, source] of Object.entries(COMPOUNDS)) {
		it(name, async () => {
			const engine = await createEngine(await languageByName('python'));
			const parse = (text: string) => engine.parse(text);
			const compound = parse(source).statements().at(0);
			const simple = parse('x = 1\n').statements().at(0);
			if (compound === undefined || simple === undefined) throw new Error('a parsed module holds no statement');
			const rendered = parse('x = 1\n').$with.statements(compound, simple).$render();
			expect(rendered).toBe(`${source}x = 1\n`);
		}, 120_000);
	}
});
