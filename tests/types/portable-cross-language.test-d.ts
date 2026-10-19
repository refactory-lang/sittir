import rust, { type RustNode } from '@sittir/rust';
import python, { type PythonNode } from '@sittir/python';

declare const rustNode: RustNode;
declare const pythonNode: PythonNode;
declare const either: RustNode | PythonNode;

rust.is.portable.declaration.function(rustNode);
python.is.portable.declaration.function(pythonNode);

// @ts-expect-error a python node through rust's portable guard
rust.is.portable.declaration.function(pythonNode);
// @ts-expect-error a rust node through python's portable guard
python.is.portable.declaration.function(rustNode);
// @ts-expect-error a node of either language through rust's portable guard
rust.is.portable.declaration(either);
