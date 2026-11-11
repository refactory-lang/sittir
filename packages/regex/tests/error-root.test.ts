// A source the parser cannot read at all parses to an ERROR root: the read
// gives it its text, and it renders as the source.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isErrorNode } from '@sittir/common/utils';
import { getActiveBackend } from '../src/backend.ts';
import regex from '../src/index.ts';

const live = (): number => {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return status.native.liveTreeCount();
};

const re = await createEngine(regex);

describe('an ERROR root', () => {
	it('reads as an ERROR node holding the whole source', () => {
		const root = re.parse(')');
		expect(isErrorNode(root)).toBe(true);
		expect((root as unknown as { $text(): string }).$text()).toBe(')');
		expect(re.render(root as never).toString()).toBe(')');
	});

	it('holds its arena parse until either release of the root frees it', async () => {
		const arena = () => createEngine(regex, { nodeStorage: 'arena' });
		type Engine = Awaited<ReturnType<typeof arena>>;
		const releases = [(engine: Engine, root: object) => engine.release(root as never), (_: Engine, root: object) => (root as Disposable)[Symbol.dispose]()];
		for (const release of releases) {
			using engine = await arena();
			const before = live();
			const root = engine.parse('?');
			expect(isErrorNode(root)).toBe(true);
			expect(engine.render(root as never).toString()).toBe('?');
			expect(live()).toBe(before + 1);
			release(engine, root);
			expect(live()).toBe(before);
		}
	});
});
