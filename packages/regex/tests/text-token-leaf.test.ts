import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

const rx = await createEngine(regex);

function controlEscapeOf(source: string): Record<string, unknown> {
	const term = rx.parse(source).content();
	if (term.$type !== TSKindId.Term) throw new Error(`expected a term, read ${term.$type}`);
	const [group] = term.termGroups();
	return group!.content() as unknown as Record<string, unknown>;
}

describe('a kind whose body is only minted text tokens', () => {
	for (const source of ['\\n', '\\x41']) {
		it(`stores ${source} as a text leaf with no child key`, () => {
			const escape = controlEscapeOf(source);
			expect(escape.$type).toBe(TSKindId.ControlEscape);
			expect(escape.$text).toBe(source);
			expect(Object.keys(escape).filter((key) => key.startsWith('_') || key === '$other')).toEqual([]);
		});
	}
});
