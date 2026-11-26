import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { editedRender } from '../../common/tests/support/edited-render.ts';
import typescript from '../src/index.ts';

const source = 'type T = {\n  a?: boolean\n  b?: string // note\n}\n';

describe.each(['object', 'arena'] as const)('a member whose line comment comes before its automatic semicolon (%s storage)', (nodeStorage) => {
	it.each(['a?: boolean', 'b?: string'])('renders as its source when the type is edited at %j', async (text) => {
		using engine = await createEngine(typescript, { nodeStorage });
		expect(editedRender(engine as never, source, text)).toBe(source);
	});
});
