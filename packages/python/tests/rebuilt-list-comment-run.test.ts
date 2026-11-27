import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const UNCHANGED = [
	'x = 1\n\n# five\n',
	'x = 1 # c\n\n# five\n',
	'def a():\n    b\n\n# five\n',
	'def a():\n    b # c\n\n# five\n',
	'x = 1\n\n\n# five\n',
	'x = 1\n\n# five\ny = 2\n',
];

describe.each(['arena', 'object'] as const)('a same-value rebuild of a list whose last item a comment on its own row follows, %s storage', (nodeStorage) => {
	async function rebuilt(source: string) {
		using engine = await createEngine(python, { nodeStorage });
		const root: any = engine.parse(source, { adoptStyle: true });
		return String(root.$with.statements(...root.statements()).$render());
	}

	it.each(UNCHANGED)('keeps the blank-line run before the comment: %j', async (source) => {
		expect(await rebuilt(source)).toBe(source);
	});

	it('writes a run of three or more blank lines as two', async () => {
		expect(await rebuilt('x = 1\n\n\n\n# five\n')).toBe('x = 1\n\n\n# five\n');
		expect(await rebuilt('def a():\n    b\n\n\n\n\n# five\n')).toBe('def a():\n    b\n\n\n# five\n');
	});
});
