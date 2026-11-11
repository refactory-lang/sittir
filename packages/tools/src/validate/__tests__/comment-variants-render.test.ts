import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { detachedRenderer } from './helpers/detached-renderer.ts';
import { languageByName } from '../../languages.ts';

const rust = await createEngine(await languageByName('rust'));

afterAll(() => {
	rust.dispose();
});

// The comments whose markers or extra slashes the typed read routes as
// layout. No validator row compares a comment's bytes, since the AST compare
// skips extras, so each is pinned here.
const SOURCES = {
	block_comment_doc_outer: '/** x */\nfn f() {}\n',
	block_comment_doc_inner: '/*! x */\n',
	line_comment_doc_outer: '/// x\nfn f() {}\n',
	line_comment_doc_inner: '//! x\n',
	line_comment_extra_slashes: '//// x\nfn f() {}\n'
};

describe('a rust comment whose marker is layout, read deep', () => {
	for (const [kind, source] of Object.entries(SOURCES)) {
		it(`${kind}: renders its source through the tree and detached`, async () => {
			expect(rust.parse(source, { depth: Infinity }).$render().toString()).toBe(source);
			expect((await detachedRenderer('rust'))(source)).toBe(source);
		});
	}
});
