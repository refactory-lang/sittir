import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { TSKindId } from '../src/types.ts';
import { Delimiter } from '@sittir/common/utils';

it('the emitted Options type is pinned', () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every site by kind id at its address and rejects a wrong member at compile time', () => {
	const ok: Options = {
		argumentListElements: {
			element: { separator: { comma: { after: TSKindId.Space } }, delimiter: Delimiter.Trailing }
		},
		block: { statements: { separator: TSKindId.Newline } },
		module: { statements: { separator: TSKindId.Newline } },
		decoratedDefinition: { decorator: { separator: TSKindId.Newline, decorator: { after: TSKindId.Newline } } },
		indent: '    '
	};
	const bad: Options = {
		argumentListElements: {
			element: {
				// @ts-expect-error a comma is not a whitespace kind
				separator: { comma: { after: TSKindId.Comma } },
				// @ts-expect-error the leading flank is fixed here
				delimiter: Delimiter.Leading
			}
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
