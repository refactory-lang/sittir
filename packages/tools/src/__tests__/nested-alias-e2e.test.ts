import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { loadLanguageForGrammar } from '../validate/common.ts';

const wasmPath = join(__dirname, '../../../python/.sittir/parser.wasm');

describe('nested-alias polymorph — python assignment e2e', () => {
	it.skipIf(!existsSync(wasmPath))('parse tree shows variant child type', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang as any);

		// Simple assignment: x = 1 → assignment_eq variant. Navigate by
		// descendant type, not fixed depth — the parse tree carries a
		// visible statement_group1 layer (the multi-slot _simple_statements
		// group is deliberately visible so its slots stay addressable).
		const tree = (parser as any).parse('x = 1');
		const assign = tree.rootNode.descendantsOfType('assignment')[0];

		expect(assign.type).toBe('assignment');

		// The variant should appear as a named child
		let variantChild = null;
		for (let i = 0; i < assign.namedChildCount; i++) {
			const c = assign.namedChild(i);
			if (c.type === 'assignment_eq' || c.type === 'assignment_type' || c.type === 'assignment_typed') {
				variantChild = c;
				break;
			}
		}

		expect(variantChild).not.toBeNull();
		expect(variantChild.type).toBe('assignment_eq');
	});

	it.skipIf(!existsSync(wasmPath))('type annotation → assignment_type variant', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang as any);

		const tree = (parser as any).parse('x: int');
		const assign = tree.rootNode.descendantsOfType('assignment')[0];

		let variantChild = null;
		for (let i = 0; i < assign.namedChildCount; i++) {
			const c = assign.namedChild(i);
			if (c.type.startsWith('assignment_')) {
				variantChild = c;
				break;
			}
		}
		expect(variantChild?.type).toBe('assignment_type');
	});

	it.skipIf(!existsSync(wasmPath))('annotated assignment → assignment_typed variant', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang as any);

		const tree = (parser as any).parse('x: int = 1');
		const assign = tree.rootNode.descendantsOfType('assignment')[0];

		let variantChild = null;
		for (let i = 0; i < assign.namedChildCount; i++) {
			const c = assign.namedChild(i);
			if (c.type.startsWith('assignment_')) {
				variantChild = c;
				break;
			}
		}
		expect(variantChild?.type).toBe('assignment_typed');
	});

	it.skipIf(!existsSync(wasmPath))('parent kind "assignment" still present for ast-grep compat', async () => {
		const { Parser, lang } = await loadLanguageForGrammar('python');
		const parser = new Parser();
		parser.setLanguage(lang as any);

		const tree = (parser as any).parse('x = 1');
		const assign = tree.rootNode.descendantsOfType('assignment')[0];
		expect(assign?.type).toBe('assignment');
	});
});
