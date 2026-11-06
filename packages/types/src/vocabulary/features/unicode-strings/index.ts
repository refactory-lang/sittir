export type * from './literal.ts';

/** Unicode strings: string literals spelled with a unicode prefix, `u"…"`. */
export interface UnicodeStrings {
	readonly 'unicode-strings': true;
}
