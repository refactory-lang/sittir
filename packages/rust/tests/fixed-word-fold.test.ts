import { readFileSync } from 'node:fs';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Admit } from '@sittir/types';
import type { DocComment, Identifier, LineComment, LineCommentDocOuter, VisibilityModifierPubScope, VisibilityModifierPubScopeInPath } from '../src/types.ts';

const model = JSON.parse(readFileSync(new URL('../src/node-model.json5', import.meta.url), 'utf8')) as {
	nodes: { kind: string; bareAccepts?: string[] }[];
};
const accepts = (kind: string): string[] => model.nodes.find((n) => n.kind === kind)?.bareAccepts ?? [];

describe('a kind whose fold carries a fixed word is taken bare only as itself', () => {
	it('keeps its own builder taking its content bare', () => {
		expect(accepts('line_comment_doc_outer')).toContain('doc_comment');
		expect(accepts('line_comment_doc_inner')).toContain('doc_comment');
	});

	it('stops a holder taking that content bare through it', () => {
		expect(accepts('line_comment')).toContain('line_comment_doc_outer');
		expect(accepts('line_comment')).toContain('line_comment_doc_inner');
		expect(accepts('line_comment')).not.toContain('doc_comment');
	});

	it('types a holder as taking that kind only as itself', () => {
		expectTypeOf<Admit<DocComment>>().toMatchTypeOf<LineCommentDocOuter.Loose>();
		expectTypeOf<Admit<LineCommentDocOuter>>().toMatchTypeOf<LineComment.Loose>();
		expectTypeOf<Admit<DocComment>>().not.toMatchTypeOf<LineComment.Loose>();
		expectTypeOf<Admit<Identifier>>().toMatchTypeOf<VisibilityModifierPubScopeInPath.Loose>();
		expectTypeOf<Admit<Identifier>>().not.toMatchTypeOf<VisibilityModifierPubScope.Loose>();
	});
});
