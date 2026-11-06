import { createRequire } from 'node:module';
import { cellFormatOf } from '../../../../../packages/common/src/record-cell.ts';

export const grammarNative = createRequire(import.meta.url)('../../../../../packages/rust/native/index.cjs');
const candidate = cellFormatOf(grammarNative);
if (candidate === undefined) throw new Error('the Rust addon must carry the record codec');
export const format = candidate;
