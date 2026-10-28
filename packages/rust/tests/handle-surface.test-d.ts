import type { FunctionItem, Identifier } from '@sittir/rust';
import type { SourceFileTree } from '../src/wrap.ts';

declare const built: FunctionItem;
declare const leaf: Identifier;
declare const root: SourceFileTree;

// @ts-expect-error a node does not expose its record's words
void built.$words;
// @ts-expect-error nor its address
void built.$at;
// @ts-expect-error nor its tree handle
void built.$tree;
// @ts-expect-error nor its child cache
void built.$cache;
// @ts-expect-error nor whether it was moved
void built.$owned;
// @ts-expect-error a leaf does not expose its entry
void leaf.$entry;
// @ts-expect-error nor its site
void leaf.$site;
// @ts-expect-error a parsed root does not expose its words
void root.$words;
// @ts-expect-error nor its address
void root.$at;
