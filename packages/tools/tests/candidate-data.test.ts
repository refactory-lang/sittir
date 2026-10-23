import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeOf } from '@sittir/common/utils';
import type { AnyUntypedNode, NodeTrivia } from '@sittir/types';
import python from '../../python/src/index.ts';
import { loadNativeEngine, loadSlotAccessorOf, materializeDetached, tableSides } from '../src/validate/common.ts';
import { candidateData } from '../src/validate/read-render-parse.ts';

const py = await createEngine(python);
const native = await loadNativeEngine('python');
const accessorOf = await loadSlotAccessorOf('python');
const render = (node: AnyUntypedNode): string => native.render(node).toString();
const triviaOf = (node: object): NodeTrivia | undefined => (node as { readonly $_layout?: { readonly trivia?: NodeTrivia } }).$_layout?.trivia;

/** The block of the first `case` clause in `source`, detached and carrying its table sides as a lane's copy does. */
function caseBlock(source: string): AnyUntypedNode {
	const root = py.parse(source);
	const clause = root.$query().$descendants.ofType(py.kinds.CaseClause).at(0);
	if (clause === undefined || !py.is.caseClause(clause)) throw new Error('expected a case clause');
	const suite = clause.consequence();
	if (!py.is.suiteBlock(suite)) throw new Error('expected a block suite');
	const block = suite.block();
	const tree = treeOf(block);
	if (tree === undefined) throw new Error('expected a parsed block');
	const data = materializeDetached(block, accessorOf) as AnyUntypedNode & { $_layout?: object };
	return { ...data, $_layout: { ...data.$_layout, trivia: tableSides(block, accessorOf, (read) => read) } } as AnyUntypedNode;
}

describe('a candidate rendered alone is its own span', () => {
	it("leaves out the leading side the table gives a case body, which lies before the body's span", () => {
		const data = caseBlock('match x:\n    case C():\n        # no args\n        foo1()\n');
		expect(render(data)).toContain('# no args');
		expect(render(candidateData(data, triviaOf))).not.toContain('# no args');
	});
});
