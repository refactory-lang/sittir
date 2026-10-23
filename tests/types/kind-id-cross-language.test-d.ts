import type { Engine } from '@sittir/types';
import rust, { type RustAPI } from '@sittir/rust';
import python, { type PythonAPI } from '@sittir/python';

declare const rustEngine: Engine<RustAPI>;
declare const pythonEngine: Engine<PythonAPI>;

rustEngine.trivia.kindName(rust.kinds.FunctionItem);
pythonEngine.trivia.kindName(python.kinds.FunctionDefinition);
// @ts-expect-error a python kind id through a rust engine's kindName
rustEngine.trivia.kindName(python.kinds.FunctionDefinition);
// @ts-expect-error a literal that is no rust kind id
rustEngine.trivia.kindName(777);
// @ts-expect-error a kind name is no rust kind id
rustEngine.trivia.kindName('function_item');

rust.is.portable.type.primitive.boolean(rust.kinds.BoolKeyword);
// @ts-expect-error a python kind id through rust's portable guard
rust.is.portable.type.primitive.boolean(python.kinds.True);
// @ts-expect-error a literal that is no rust kind id
rust.is.portable.type.primitive.boolean(777);

declare const id: typeof rust.kinds.BoolKeyword | typeof rust.kinds.FunctionItem;
if (rust.is.portable.type.primitive.boolean(id)) {
	const narrowed: typeof rust.kinds.BoolKeyword = id;
	void narrowed;
}
