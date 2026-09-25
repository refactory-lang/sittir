// A stray `;` among class members reads as its own kind, `empty_member`, not
// as the shared `;` token: the patch mints `_empty_member` over `';'`, so the
// read keeps the minted symbol's own id.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { TSKindId } from '../src/types.js';

const SOURCE = 'class C { ; foo() {} }\n';

describe('class_body stray semicolon', () => {
	it('reads as EmptyMember, not the shared Semi token', () => {
		const engine = createEngine();
		const file = engine.parse(SOURCE) as unknown as {
			statements(): readonly { body(): { contents(): readonly unknown[]; $render(): string } }[];
		};
		const body = file.statements()[0]!.body();
		const [stray] = body.contents();
		expect(stray).toBe(TSKindId.EmptyMember);
		expect(stray).not.toBe(TSKindId.Semi);
		expect(body.$render()).toBe('{ ; foo() {} }');
	});
});
