import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';
import type { PythonAPI } from '@sittir/python';
import type { TypescriptAPI } from '@sittir/typescript';

declare const rust: Engine<RustAPI>;
declare const python: Engine<PythonAPI>;
declare const typescript: Engine<TypescriptAPI>;

rust.render(rust.build.identifier('x'));
rust.render(rust.build.lifetime('a'));
rust.render(rust.build.block());
rust.render(rust.parse('fn f() {}'));
// @ts-expect-error a kind id is not a node
rust.render(rust.kinds.Identifier);

python.render(python.build.identifier('x'));
python.render(python.build.returnStatement());
python.render(python.parse('pass\n'));
// @ts-expect-error a kind id is not a node
python.render(python.kinds.Identifier);

typescript.render(typescript.build.identifier('x'));
typescript.render(typescript.build.statementBlock());
typescript.render(typescript.parse('let x = 1;'));
// @ts-expect-error a kind id is not a node
typescript.render(typescript.kinds.Identifier);
