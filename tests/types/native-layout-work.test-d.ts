import { expectTypeOf } from 'vitest';
import type { LayoutWork } from '../../packages/common/src/engine.ts';
import type * as Python from '../../packages/python/native/index.js';
import type * as Regex from '../../packages/regex/native/index.js';
import type * as Rust from '../../packages/rust/native/index.js';
import type * as Scm from '../../packages/scm/native/index.js';
import type * as TypeScript from '../../packages/typescript/native/index.js';

expectTypeOf<Readonly<ReturnType<typeof Python.layoutWork>>>().toEqualTypeOf<LayoutWork>();
expectTypeOf<Readonly<ReturnType<typeof Regex.layoutWork>>>().toEqualTypeOf<LayoutWork>();
expectTypeOf<Readonly<ReturnType<typeof Rust.layoutWork>>>().toEqualTypeOf<LayoutWork>();
expectTypeOf<Readonly<ReturnType<typeof Scm.layoutWork>>>().toEqualTypeOf<LayoutWork>();
expectTypeOf<Readonly<ReturnType<typeof TypeScript.layoutWork>>>().toEqualTypeOf<LayoutWork>();
