import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';
import { Delimiter } from '@sittir/common/utils';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

it('the emitted Options type is pinned', () => {
	expect(readFileSync(new URL('../src/options.ts', import.meta.url), 'utf8')).toMatchSnapshot();
});

it('types every site by kind id at its address and rejects a wrong member at compile time', () => {
	const ok: Options = {
		argumentListElements: {
			item: { separator: { comma: { after: py.kinds.Space } }, delimiter: Delimiter.Trailing }
		},
		block: { statements: { separator: py.kinds.Newline } },
		module: { statements: { separator: py.kinds.Newline } },
		decoratedDefinition: { decorator: { separator: py.kinds.Newline, decorator: { after: py.kinds.Newline } } },
		layout: { indent: '    ' }
	};
	const bad: Options = {
		argumentListElements: {
			item: {
				// @ts-expect-error a comma is not a whitespace kind
				separator: { comma: { after: py.kinds.Comma } },
				// @ts-expect-error the leading flank is fixed here
				delimiter: Delimiter.Leading
			}
		}
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
