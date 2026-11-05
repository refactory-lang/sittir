import { describe, expect, it } from 'vitest';
import { createEngine } from '../../common/src/index.ts';
import { snapshotOf } from '../../common/src/snapshot.ts';
import rust from '../src/index.ts';

const CYCLE = 'a node tree holds itself: a value is its own descendant';

async function objectEngine(): Promise<any> {
	return createEngine(rust, { nodeStorage: 'object' });
}

function selfHolding(rs: any): Record<string, any> {
	const paren = rs.build.parenthesizedExpression(rs.build.integerLiteral('1'));
	paren._expression = paren;
	const binary = rs.build.binaryExpression({ left: rs.build.integerLiteral('1'), operator: '+', right: rs.build.integerLiteral('2') });
	binary._right = binary;
	return { 'a wrapper': paren, 'a node of two slots': binary };
}

describe('a node tree that holds itself', () => {
	it.each(['a wrapper', 'a node of two slots'])('refuses, by name, to render %s that holds itself', async (name) => {
		const rs = await objectEngine();
		try {
			expect(() => rs.render(selfHolding(rs)[name]).toString()).toThrow(CYCLE);
		} finally {
			rs.dispose();
		}
	});

	it.each(['a wrapper', 'a node of two slots'])('refuses, by name, to snapshot %s that holds itself', async (name) => {
		const rs = await objectEngine();
		try {
			expect(() => snapshotOf(selfHolding(rs)[name])).toThrow(CYCLE);
		} finally {
			rs.dispose();
		}
	});

	it('renders and snapshots a child two slots share, once in each', async () => {
		const rs = await objectEngine();
		try {
			const shared = rs.build.integerLiteral('7');
			const node = rs.build.binaryExpression({ left: shared, operator: '+', right: shared });
			expect(rs.render(node).toString()).toBe('7 + 7');
			expect(rs.render(snapshotOf(node)).toString()).toBe('7 + 7');
		} finally {
			rs.dispose();
		}
	});
});
