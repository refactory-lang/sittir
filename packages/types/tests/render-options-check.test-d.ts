/**
 * Type-level pins for RenderOptionsCheck: a caller generic over the language
 * forwards the language's declared render options unchecked, and a concrete
 * language still rejects an undeclared key or an indent unit outside its
 * indent characters, literal or not.
 *
 * Compile-time only: `pnpm --filter @sittir/types type-check`.
 */

import type { Engine, LanguageAPI, RenderOptionsCheck } from '../src/index.ts';

interface FakeNode {
	readonly $type: 1;
}
interface SpacedAPI extends LanguageAPI {
	readonly name: 'spaced';
	readonly root: FakeNode;
	readonly node: FakeNode;
	readonly options: { readonly indent?: string; readonly block?: { readonly after?: 'newline' | 'space' } };
	readonly indentChar: ' ' | '\t';
}
interface PlainAPI extends LanguageAPI {
	readonly name: 'plain';
	readonly root: FakeNode;
	readonly node: FakeNode;
	readonly options: { readonly list?: { readonly separator?: ',' | ';' } };
	readonly indentChar: never;
}
interface Apis {
	readonly spaced: SpacedAPI;
	readonly plain: PlainAPI;
}

/** The shape of `createEngine`'s `render` option. */
declare function withRender<API extends LanguageAPI, const R extends API['options'] = API['options']>(
	api: API,
	options?: { readonly render?: R & RenderOptionsCheck<API, R> }
): void;

export function engineFor<G extends keyof Apis>(api: Apis[G], render?: Apis[G]['options']): void {
	withRender(api, render === undefined ? undefined : { render });
}

export function renderWith<G extends keyof Apis>(
	engine: Engine<Apis[G]>,
	node: Apis[G]['node'],
	render: Apis[G]['options']
): string {
	return engine.render(node, render).toString();
}

declare const spaced: SpacedAPI;
declare const engine: Engine<SpacedAPI>;
declare const node: FakeNode;
declare const declared: SpacedAPI['options'];
const undeclared = { nope: 1 } as const;
const badIndent = { indent: 'x' } as const;
const mixed = { indent: '  ', nope: 1 } as const;

withRender(spaced, { render: { indent: '\t', block: { after: 'space' } } });
withRender(spaced, { render: declared });
// @ts-expect-error an undeclared key
withRender(spaced, { render: { nope: 1 } });
// @ts-expect-error an undeclared key, not a literal
withRender(spaced, { render: undeclared });
// @ts-expect-error an indent unit outside the indent characters
withRender(spaced, { render: { indent: 'x' } });
// @ts-expect-error an indent unit outside the indent characters, not a literal
withRender(spaced, { render: badIndent });
// @ts-expect-error a declared key beside an undeclared one
withRender(spaced, { render: mixed });

engine.render(node, { indent: '  ' });
engine.render(node, declared);
// @ts-expect-error an undeclared key
engine.render(node, undeclared);
// @ts-expect-error an indent unit outside the indent characters
engine.render(node, badIndent);
// @ts-expect-error a declared key beside an undeclared one
engine.render(node, mixed);

declare const plain: PlainAPI;
withRender(plain, { render: { list: { separator: ';' } } });
// @ts-expect-error a language with no indent character has no indent key
withRender(plain, { render: { indent: ' ' } });
