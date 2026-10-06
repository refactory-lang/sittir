import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';
import type { PythonAPI } from '@sittir/python';
import type { TypescriptAPI } from '@sittir/typescript';

declare const rust: Engine<RustAPI>;
declare const python: Engine<PythonAPI>;
declare const typescript: Engine<TypescriptAPI>;

type Constants<Build> = { [K in keyof Build]: Build[K] extends number ? Build[K] : never }[keyof Build];

export const renderRustConstant = (constant: Constants<typeof rust.build>) => rust.render(constant);
export const renderPythonConstant = (constant: Constants<typeof python.build>) => python.render(constant);
export const renderTypescriptConstant = (constant: Constants<typeof typescript.build>) => typescript.render(constant);

export const rustConstant: Constants<typeof rust.build> = rust.build.self;
export const pythonConstant: Constants<typeof python.build> = python.build.passStatement;
export const typescriptConstant: Constants<typeof typescript.build> = typescript.build.this;

rust.render(rust.build.layout.space);
rust.render(rust.build.layout.tab);
rust.render(rust.build.layout.newline);
rust.render(rust.build.layout.blankline);
rust.render(rust.build.layout.doubleBlankline);
// @ts-expect-error a zero-width kind has no text
rust.render(rust.build.layout.tight);
// @ts-expect-error a depth sentinel has no text
rust.render(rust.build.layout.indent);
// @ts-expect-error a depth sentinel has no text
rust.render(rust.build.layout.dedent);
