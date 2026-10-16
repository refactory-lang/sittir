import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const GRAMMARS = ['python', 'regex', 'rust', 'scm', 'typescript'] as const;

function writableNodeMembers(text: string): string[] {
	const writable: string[] = [];
	for (const block of text.matchAll(/^export interface (\w+)[^\n]*\{\n([\s\S]*?)^\}/gm)) {
		const [, name, body] = block;
		if (!/^\treadonly \$type: /m.test(body!)) continue;
		for (const member of body!.matchAll(/^\t(?!readonly )([\w$]+)\??\s*[(:]/gm)) writable.push(`${name}.${member[1]}`);
	}
	return writable;
}

describe('no generated node surface has a writable member', () => {
	it.each(GRAMMARS)('%s types', (grammar) => {
		const text = readFileSync(resolve(repoRoot, 'packages', grammar, 'src', 'types.ts'), 'utf8');
		expect(writableNodeMembers(text)).toEqual([]);
	});
});
