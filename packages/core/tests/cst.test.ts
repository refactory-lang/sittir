import { describe, it, expect } from 'vitest';
import { toCst } from '../src/cst.ts';
import { createRenderer } from '../src/loader.ts';
import type { RulesConfig, AnyNodeData } from '../src/types.ts';

// Synthetic numeric kind IDs for test purposes (Phase D: $type is always numeric).
const KIND_IDENTIFIER = 1;
const KIND_FUNCTION_ITEM = 2;
const KIND_BLOCK = 3;

const kindNames: Record<number, string> = {
	[KIND_IDENTIFIER]: 'identifier',
	[KIND_FUNCTION_ITEM]: 'function_item',
	[KIND_BLOCK]: 'block'
};
const kindNameFromId = (id: number): string | undefined => kindNames[id];

const config: RulesConfig = {
	language: 'test',
	extensions: ['test'],
	expandoChar: null,
	metadata: { grammarSha: 'test' },
	rules: {
		function_item: 'fn $NAME() $BODY',
		block: '{ }'
	},
	kindNameFromId
};

const renderer = createRenderer(config);

describe('toCst', () => {
	it('produces a CSTNode for a terminal node', () => {
		const node: AnyNodeData = { $type: KIND_IDENTIFIER, $text: 'main' };
		const cst = toCst(node, renderer, 0, kindNameFromId);
		expect(cst.type).toBe('identifier');
		expect(cst.text).toBe('main');
		expect(cst.isNamed).toBe(true);
		expect(cst.startIndex).toBe(0);
		expect(cst.endIndex).toBe(4);
		expect(cst.children).toHaveLength(0);
	});

	it('produces a CSTNode for a branch node with correct text', () => {
		const node: AnyNodeData = {
			$type: KIND_FUNCTION_ITEM,
			$fields: {
				name: { $type: KIND_IDENTIFIER, $text: 'main' },
				body: { $type: KIND_BLOCK, $fields: {} }
			}
		};
		const cst = toCst(node, renderer, 0, kindNameFromId);
		expect(cst.type).toBe('function_item');
		expect(cst.text).toBe('fn main() { }');
		expect(cst.isNamed).toBe(true);
		expect(cst.startIndex).toBe(0);
		expect(cst.endIndex).toBe(cst.text.length);
	});

	it('respects offset parameter', () => {
		const node: AnyNodeData = { $type: KIND_IDENTIFIER, $text: 'x' };
		const cst = toCst(node, renderer, 100, kindNameFromId);
		expect(cst.startIndex).toBe(100);
		expect(cst.endIndex).toBe(101);
	});
});
