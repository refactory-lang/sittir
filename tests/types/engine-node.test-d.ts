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
rust.render(rust.kinds.FnKeyword);
rust.render(rust.kinds.Semi);
// @ts-expect-error an identifier's text is not its kind's
rust.render(rust.kinds.Identifier);
// @ts-expect-error a depth sentinel has no text
rust.render(rust.kinds.Indent);

python.render(python.build.identifier('x'));
python.render(python.build.returnStatement());
python.render(python.parse('pass\n'));
python.render(python.build.passStatement);
python.render(python.kinds.Comma);
// @ts-expect-error an identifier's text is not its kind's
python.render(python.kinds.Identifier);
// @ts-expect-error a depth sentinel has no text
python.render(python.kinds.Indent);

typescript.render(typescript.build.identifier('x'));
typescript.render(typescript.build.statementBlock());
typescript.render(typescript.parse('let x = 1;'));
typescript.render(typescript.kinds.FunctionKeyword);
typescript.render(typescript.kinds.Semi);
// @ts-expect-error an identifier's text is not its kind's
typescript.render(typescript.kinds.Identifier);
// @ts-expect-error a depth sentinel has no text
typescript.render(typescript.kinds.Indent);
