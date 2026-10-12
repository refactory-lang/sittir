import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import language from '../src/index.ts';

const engine = await createEngine(language);

describe('a snapshot span on the wire', () => {
	it('renders a built node whose layout carries a span exactly as one without it', () => {
		const plain = { $type: engine.kinds.Identifier, $text: 'x' };
		const spanned = { ...plain, $_layout: { span: { start: { row: 0, column: 4 }, end: { row: 0, column: 5 } } } };
		expect(engine.render(spanned as never).toString()).toBe(engine.render(plain as never).toString());
	});
	it('refuses a span whose point is not a row and a column', () => {
		const bad = { $type: engine.kinds.Identifier, $text: 'x', $_layout: { span: { start: 3, end: 4 } } };
		expect(() => engine.render(bad as never).toString()).toThrow(/span/);
	});
});
