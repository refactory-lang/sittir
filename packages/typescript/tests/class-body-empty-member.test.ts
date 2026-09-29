// A stray `;` among class members reads as its own kind, `empty_member`, not
// as the shared `;` token: the patch mints `_empty_member` over `';'`, so the
// read keeps the minted symbol's own id.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

const SOURCE = 'class C { ; foo() {} }\n';

describe('class_body stray semicolon', () => {
	it('reads as EmptyMember, not the shared Semi token', () => {
		const engine = ts;
		const file = engine.parse(SOURCE) as unknown as {
			statements(): readonly { body(): { contents(): readonly unknown[]; $render(): string } }[];
		};
		const body = file.statements()[0]!.body();
		const [stray] = body.contents();
		expect(stray).toBe(ts.kinds.EmptyMember);
		expect(stray).not.toBe(ts.kinds.Semi);
		expect(body.$render()).toBe('{ ; foo() {} }');
	});
});
