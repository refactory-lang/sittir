import type { RecordHandle } from '../src/handle.ts';
import type { ChunkWords, RecordWords } from '../src/read.ts';

declare const words: ChunkWords;
declare const handle: RecordHandle;
declare const records: RecordWords;

export const first: number | undefined = words[0];
export const cut: ChunkWords = words.subarray(0, 1);

// @ts-expect-error a chunk view is read-only
words[0] = 1;
// @ts-expect-error a cut of a chunk view is read-only too
words.subarray(0, 1)[0] = 1;
// @ts-expect-error a handle's words are read-only
handle.$words[0] = 1;
// @ts-expect-error a record reader's words are read-only
records.words(0, 1)[0] = 1;
// @ts-expect-error a chunk view does not reach the memory behind it
void words.buffer;
// @ts-expect-error a chunk view has no bulk writer
words.set([1]);
// @ts-expect-error a chunk view has no fill
words.fill(0);
