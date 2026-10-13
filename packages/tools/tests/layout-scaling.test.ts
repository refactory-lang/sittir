import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import type { LayoutWork } from '@sittir/common/engine';
import { languageByName } from '../src/languages.ts';
import { layoutWorkOf } from '../src/validate/layout-runs.ts';

const rust = await createEngine(await languageByName('rust'));
const typescript = await createEngine(await languageByName('typescript'));
const rustWork = await layoutWorkOf('rust');
const typescriptWork = await layoutWorkOf('typescript');

afterAll(() => {
	rust.dispose();
	typescript.dispose();
});

const total = (work: LayoutWork): number => work.regionNodes + work.siblingItems;
const shown = (count: number, work: LayoutWork): string => `${count}: ${work.regionNodes} region nodes, ${work.siblingItems} sibling items`;

/** Four times the items must do less than eight times the layout work: linear growth, with room for a constant. */
function expectLinear(measure: (count: number) => LayoutWork): void {
	const small = measure(500);
	const large = measure(2000);
	expect(total(small), shown(500, small)).toBeGreaterThan(0);
	expect(total(large) / total(small), `${shown(500, small)}; ${shown(2000, large)}`).toBeLessThan(8);
}

describe("a long list's layout work grows linearly with its length", () => {
	it('a snapshot of an array literal', () => {
		expectLinear((count) => {
			const root = rust.parse(`fn f() { let a = [${Array.from({ length: count }, (_, i) => String(i)).join(', ')}]; }\n`) as unknown as { $snapshot(): unknown };
			root.$snapshot();
			return rustWork(root);
		});
	});

	it('the render of a list of statements reversed', () => {
		expectLinear((count) => {
			const root = typescript.parse(`// A\n;\n${Array.from({ length: count }, (_, i) => `x${i}();`).join('\n')}\n`) as unknown as {
				statements(): Iterable<unknown>;
				$with: { statements(...items: unknown[]): { $render(): string } };
			};
			root.$with.statements(...[...root.statements()].reverse()).$render();
			return typescriptWork(root);
		});
	});
});
