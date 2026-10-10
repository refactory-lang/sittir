/** What every flag encoding must give, checked by the compiler in each flag variant (`tsconfig.check.json`). */
import type { PythonContext, RustContext, TypeScriptContext } from './languages.ts';
import type { Steps } from './vocabulary/flags.ts';

/** A typescript method has a step per flag its composition gives a method. */
export const tsMethod: (keyof Steps<TypeScriptContext, 'declaration.method'>)[] = ['async', 'generator', 'static', 'private', 'computed', 'optional', 'override', 'readonly'];
/** A getter has its method's steps, since a flag holds for every kind beneath the one that declares it. */
export const tsGetter: (keyof Steps<TypeScriptContext, 'declaration.method.getter'>)[] = ['static', 'async', 'generator'];
// @ts-expect-error typescript composes no compile-time evaluation
export const tsConst: keyof Steps<TypeScriptContext, 'declaration.method'> = 'const';
// @ts-expect-error rust composes no generators
export const rsGenerator: keyof Steps<RustContext, 'declaration.method'> = 'generator';
/** Rust's async block has `move`; python composes no async blocks. */
export const rsMove: keyof Steps<RustContext, 'expression.block.async'> = 'move';
// @ts-expect-error python composes no async blocks
export const pyMove: keyof Steps<PythonContext, 'expression.block.async'> = 'move';
