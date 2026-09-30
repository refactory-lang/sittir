import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '@sittir/python';

const py = await createEngine(python);

const SOURCE = '[a for a in lambda: True, lambda: False if a()]\n';

type Node = { readonly $type: number };
type ForInClause = Node & { readonly $slotOrder?: readonly string[]; rights(): readonly Node[] };
type Comprehension = Node & { comprehensionClauses(): { contents(): readonly Node[] } };
type Module = Node & {
	statements(): readonly { simpleStatementsElements(): { simpleStatements(): readonly { content(): Comprehension }[] } }[];
};

describe('for_in_clause right side — a bare-tuple iterable', () => {
	const module = py.parse(SOURCE) as unknown as Module & { $render(): string };
	const comprehension = module.statements()[0]!.simpleStatementsElements().simpleStatements()[0]!.content();
	const clause = comprehension.comprehensionClauses().contents()[0] as ForInClause;

	it('holds the two lambdas alone: the field-tagged `,` is punctuation', () => {
		expect(clause.rights().map((right) => right.$type)).toEqual([py.kinds.LambdaWithinForInClause, py.kinds.LambdaWithinForInClause]);
	});

	it('orders its slots without the dropped `,`', () => {
		expect(clause.$slotOrder).toEqual(['left', 'right', 'right']);
	});

	it('renders back to its source', () => {
		expect(module.$render()).toBe(SOURCE);
	});
});
