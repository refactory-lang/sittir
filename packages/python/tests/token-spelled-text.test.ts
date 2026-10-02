import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const py = await createEngine(python);

type Spelled = { readonly $text?: string; readonly $other?: unknown };

function importPrefixOf(source: string): Spelled {
	const root = py.parse(source) as unknown as {
		statements(): readonly { elements(): { items(): readonly unknown[] } }[];
	};
	const statement = root.statements()[0]!.elements().items()[0] as {
		moduleName(): { prefix(): Spelled };
	};
	return statement.moduleName().prefix();
}

describe('a named node spelled only by tokens', () => {
	it('takes its text from the tokens that tile it', () => {
		const prefix = importPrefixOf('from .. import x\n');
		expect(prefix.$text).toBe('..');
		expect(prefix.$other).toBeUndefined();
	});

	it('renders back to its source', () => {
		const source = 'from .. import x\n';
		expect(py.parse(source).$render()).toBe(source);
	});
});
