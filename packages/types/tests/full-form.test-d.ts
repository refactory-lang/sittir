import type { CoercedSpelling, NodeMethods, SpelledAffix } from '../src/index.ts';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const opened: SpelledAffix<'0XFF', '0x' | '0X', '0x'> = '0X';
const openDefault: SpelledAffix<'FF', '0x' | '0X', '0x'> = '0x';
const closed: SpelledAffix<'10l', 'L' | 'l', 'L', 'close'> = 'l';
const closeDefault: SpelledAffix<'10', 'L' | 'l', 'L', 'close'> = 'L';
const closeFromNumber: SpelledAffix<10n, 'L' | 'l', 'L', 'close'> = 'L';
const closeUnknown: SpelledAffix<string, 'L' | 'l', 'L', 'close'> = 'l';

// @ts-expect-error a closing spelling is read from the end of the text, not its start
const closeNotOpen: SpelledAffix<'l10', 'L' | 'l', 'L', 'close'> = 'l';
// @ts-expect-error an opening spelling is read from the start of the text, not its end
const openNotClose: SpelledAffix<'FF0X', '0x' | '0X', '0x'> = '0X';

const bareOrOpened: Same<SpelledAffix<'FF' | '0XFF', '0x' | '0X', '0x'>, '0x' | '0X'> = true;
const bareOrClosed: Same<SpelledAffix<'10' | '10l', 'L' | 'l', 'L', 'close'>, 'L' | 'l'> = true;
const numberOrClosed: Same<SpelledAffix<10n | '10l', 'L' | 'l', 'L', 'close'>, 'L' | 'l'> = true;

const templateUnknown: Same<SpelledAffix<`1${string}`, 'L' | 'l', 'L', 'close'>, 'L' | 'l'> = true;
const templateKnown: Same<SpelledAffix<`${string}l`, 'L' | 'l', 'L', 'close'>, 'l'> = true;
const plainString: Same<SpelledAffix<string, '0x' | '0X', '0x'>, '0x' | '0X'> = true;
const config: Same<SpelledAffix<{ readonly content: '10' }, 'L' | 'l', 'L', 'close'>, 'L'> = true;

export const unions = [bareOrOpened, bareOrClosed, numberOrClosed];
export const unresolved = [templateUnknown, templateKnown, plainString, config];

type Long<I, O> = CoercedSpelling<I, O, 'suffix', 'L' | 'l', 'L', 'close'>;
type SpelledNode = NodeMethods & { readonly _suffix: 'l' } & { readonly _suffix: 'L' | 'l' };

const fromText: Same<Long<'7l', {}>, 'l'> = true;
const fromDefault: Same<Long<'7', {}>, 'L'> = true;
const givenOption: Same<Long<'7L', { readonly suffix: 'l' }>, 'l'> = true;
const optionalOption: Same<Long<'7L', { readonly suffix?: 'L' | 'l' }>, 'L' | 'l'> = true;
const optionalOptionNarrow: Same<Long<'7L', { readonly suffix?: 'l' }>, 'L' | 'l'> = true;
const undefinedOption: Same<Long<'7L', { readonly suffix: 'l' | undefined }>, 'L' | 'l'> = true;
const otherOption: Same<Long<'7l', { readonly other: 1 }>, 'l'> = true;
const numberWithOption: Same<Long<10n, { readonly suffix?: 'l' }>, 'L' | 'l'> = true;
const nodeOverOption: Same<Long<SpelledNode, { readonly suffix: 'L' }>, 'l'> = true;
const nodeWithoutStored: Same<Long<NodeMethods, { readonly suffix: 'L' }>, 'L' | 'l'> = true;
const nodeOrText: Same<Long<SpelledNode | '7L', {}>, 'L' | 'l'> = true;
const indexedOption: Same<Long<'7L', Record<string, 'l'>>, 'L' | 'l'> = true;
const indexedOptionNumber: Same<Long<10n, Record<string, 'l'>>, 'L' | 'l'> = true;
const patternOption: Same<Long<'7L', Record<`suf${string}`, 'l'>>, 'L' | 'l'> = true;
const namedBesideIndex: Same<Long<'7L', { readonly [key: string]: 'l'; readonly suffix: 'l' }>, 'l'> = true;
const unionOfOptions: Same<Long<'7L', { readonly suffix: 'l' } | {}>, 'L' | 'l'> = true;

export const coerced = [fromText, fromDefault, givenOption, optionalOption, optionalOptionNarrow, undefinedOption, otherOption, numberWithOption, nodeOverOption, nodeWithoutStored, nodeOrText, indexedOption, indexedOptionNumber, patternOption, namedBesideIndex, unionOfOptions];
export const spellings = [opened, openDefault, closed, closeDefault, closeFromNumber, closeUnknown, closeNotOpen, openNotClose];
