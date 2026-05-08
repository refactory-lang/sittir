import { describe, it, expect } from 'vitest';
import { parseSCMQuery, parseInheritsDirective } from '../scm/parse.ts';
import { extractTriviaRoles } from '../scm/extract-roles.ts';

describe('SCM parser', () => {
	it('parses simple node pattern with capture', () => {
		const result = parseSCMQuery('(line_comment) @comment');
		expect(result).toContainEqual({ kindName: 'line_comment', captureName: 'comment' });
	});

	it('parses nested pattern with sub-capture', () => {
		const result = parseSCMQuery('(line_comment (doc_comment)) @comment.documentation');
		expect(result).toContainEqual({
			kindName: 'line_comment',
			captureName: 'comment.documentation'
		});
	});

	it('skips predicates', () => {
		const result = parseSCMQuery('((identifier) @type (#match? @type "^[A-Z]"))');
		expect(result).toContainEqual({ kindName: 'identifier', captureName: 'type' });
	});

	it('handles multiple patterns', () => {
		const result = parseSCMQuery(`
			(line_comment) @comment
			(block_comment) @comment
		`);
		expect(result.filter((c) => c.captureName === 'comment')).toHaveLength(2);
	});

	it('skips string literals at top level', () => {
		const result = parseSCMQuery('";" @punctuation.delimiter');
		expect(result).toHaveLength(0);
	});

	it('handles bracket alternation with named nodes', () => {
		const result = parseSCMQuery(`
			[
				(true)
				(false)
				(null)
			] @constant.builtin
		`);
		expect(result).toContainEqual({ kindName: 'true', captureName: 'constant.builtin' });
		expect(result).toContainEqual({ kindName: 'false', captureName: 'constant.builtin' });
		expect(result).toContainEqual({ kindName: 'null', captureName: 'constant.builtin' });
	});

	it('handles field patterns with captures on children', () => {
		const result = parseSCMQuery(`
			(function_item (identifier) @function)
		`);
		expect(result).toContainEqual({ kindName: 'identifier', captureName: 'function' });
	});

	it('handles bracket alternation inside predicate group', () => {
		const result = parseSCMQuery(
			'([(function_declaration) (arrow_function)] @definition.function (#strip! @definition.function))'
		);
		expect(result).toContainEqual({
			kindName: 'function_declaration',
			captureName: 'definition.function'
		});
		expect(result).toContainEqual({
			kindName: 'arrow_function',
			captureName: 'definition.function'
		});
	});

	it('handles bracket alternation inside predicate group with multiple predicates', () => {
		const result = parseSCMQuery(`
			([(class_declaration) (function_declaration)] @definition.type
				(#set! role "type")
				(#strip! @definition.type))
		`);
		expect(result).toContainEqual({
			kindName: 'class_declaration',
			captureName: 'definition.type'
		});
		expect(result).toContainEqual({
			kindName: 'function_declaration',
			captureName: 'definition.type'
		});
	});

	it('handles field-colon syntax', () => {
		const result = parseSCMQuery(`
			(call_expression
				function: (identifier) @function)
		`);
		expect(result).toContainEqual({ kindName: 'identifier', captureName: 'function' });
	});

	it('parses a realistic rust comment block', () => {
		const result = parseSCMQuery(`
			(line_comment) @comment
			(block_comment) @comment
			(line_comment (doc_comment)) @comment.documentation
			(block_comment (doc_comment)) @comment.documentation
		`);
		const commentCaptures = result.filter((c) => c.captureName === 'comment' || c.captureName.startsWith('comment.'));
		expect(commentCaptures).toHaveLength(4);
		expect(commentCaptures.map((c) => c.kindName)).toContain('line_comment');
		expect(commentCaptures.map((c) => c.kindName)).toContain('block_comment');
	});
});

describe('inherits directive', () => {
	it('detects ; inherits: javascript', () => {
		expect(parseInheritsDirective('; inherits: javascript\n(type_identifier) @type')).toBe('javascript');
	});

	it('returns undefined when no directive', () => {
		expect(parseInheritsDirective('(comment) @comment')).toBeUndefined();
	});

	it('handles extra whitespace', () => {
		expect(parseInheritsDirective(';  inherits:  python')).toBe('python');
	});
});

describe('trivia role extraction', () => {
	it('extracts rust trivia kinds', () => {
		const result = extractTriviaRoles('rust');
		expect(result.grammar).toBe('rust');
		expect(result.triviaKinds).toContain('line_comment');
		expect(result.triviaKinds).toContain('block_comment');
	});

	it('extracts typescript trivia kinds (inherits from javascript)', () => {
		const result = extractTriviaRoles('typescript');
		expect(result.grammar).toBe('typescript');
		expect(result.triviaKinds).toContain('comment');
	});

	it('extracts python trivia kinds', () => {
		const result = extractTriviaRoles('python');
		expect(result.grammar).toBe('python');
		expect(result.triviaKinds).toContain('comment');
	});
});
