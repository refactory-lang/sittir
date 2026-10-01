import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PACKAGES_DIR, stableGrammars } from '@sittir/codegen/grammars';
import { join } from 'node:path';

interface ListSetter {
	readonly node: string;
	readonly setter: string;
	readonly rest: boolean;
}

/** Every `$with` setter of a list slot in a grammar's generated wrap: a slot stored through a repeated-slot normalizer. */
function listSetters(grammar: string): ListSetter[] {
	const source = readFileSync(join(PACKAGES_DIR, grammar, 'src', 'wrap.ts'), 'utf-8');
	const parts = source.split(/\nexport function wrap(\w+)\(/);
	const found: ListSetter[] = [];
	for (let i = 1; i < parts.length; i += 2) {
		const node = parts[i]!;
		const body = parts[i + 1]!;
		const withAt = body.indexOf('$with:');
		if (withAt < 0) continue;
		const setters = body
			.slice(withAt)
			.matchAll(/(\w+): \((\.\.\.)?\w+: [^=]*?\) =>\s*wrap\w+\(\{ \.\.\.\$edited\(data\), (_\w+):/gs);
		for (const [, setter, rest, key] of setters) {
			const stored = new RegExp(`\\b${key}: storeExpanded\\(\\s*([^.]{0,200})data\\.`, 's').exec(body)?.[1] ?? '';
			if (rest !== undefined || /normalizeRepeatedWrapSlot|splitElidedWrapSlot/.test(stored)) {
				found.push({ node, setter: setter!, rest: rest !== undefined });
			}
		}
	}
	return found;
}

describe('list-valued $with setters', () => {
	it.each(stableGrammars().map((grammar) => [grammar]))('%s: every one takes rest arguments', (grammar) => {
		const setters = listSetters(grammar);
		expect(setters.length).toBeGreaterThan(0);
		expect(setters.filter((setter) => !setter.rest).map((setter) => `${setter.node}.${setter.setter}`)).toEqual([]);
	});
});
