import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const GRAMMARS = ['python', 'regex', 'rust', 'scm', 'typescript'] as const;
const MODULES = ['raw', 'coerce'] as const;
const TYPE_PROVED_GUARDS = ['_assertNonEmpty(', '_requireField(', 'rejectBareText('] as const;

const copies = (text: string, guard: string): number => text.split(guard).length - 1;

describe('the generated builders run no check the types prove', () => {
	it.each(GRAMMARS.flatMap((grammar) => MODULES.map((module) => [grammar, module] as const)))('%s factories/%s', (grammar, module) => {
		const text = readFileSync(resolve(repoRoot, 'packages', grammar, 'src', 'factories', `${module}.ts`), 'utf8');
		expect(Object.fromEntries(TYPE_PROVED_GUARDS.map((guard) => [guard, copies(text, guard)]))).toEqual({
			'_assertNonEmpty(': 0,
			'_requireField(': 0,
			'rejectBareText(': 0
		});
	});
});
