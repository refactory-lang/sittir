import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

type Leaf = { $text: string };
type ComplexPattern = {
	$type: number;
	sign(): true | undefined;
	real(): Leaf;
	operator(): number;
	imaginary(): Leaf;
	$render(): string;
};

function readComplexPattern(pattern: string): ComplexPattern {
	const module = createEngine().parse(`match x:\n    case ${pattern}:\n        pass\n`) as unknown as {
		statements(): readonly {
			body(): {
				content(): {
					alternatives(): readonly {
						casePatterns(): { casePatterns(): readonly { content(): { content(): ComplexPattern } }[] };
					}[];
				};
			};
		}[];
	};
	return module.statements()[0]!.body().content().alternatives()[0]!.casePatterns().casePatterns()[0]!.content().content();
}

describe('complex_pattern names its parts', () => {
	it('reads 1+2j as real 1, imaginary 2j, no sign', () => {
		const node = readComplexPattern('1+2j');
		expect(node.$type).toBe(TSKindId.ComplexPattern);
		expect(node.sign()).toBeUndefined();
		expect(node.real().$text).toBe('1');
		expect(node.operator()).toBe(TSKindId.Plus);
		expect(node.imaginary().$text).toBe('2j');
		expect(node.$render()).toBe('1+2j');
	});

	it('reads -1-2j with the leading sign, real 1, imaginary 2j', () => {
		const node = readComplexPattern('-1-2j');
		expect(node.sign()).toBe(true);
		expect(node.real().$text).toBe('1');
		expect(node.operator()).toBe(TSKindId.Dash);
		expect(node.imaginary().$text).toBe('2j');
		expect(node.$render()).toBe('-1-2j');
	});
});
