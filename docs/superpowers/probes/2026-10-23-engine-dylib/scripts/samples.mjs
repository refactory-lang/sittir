// One small source per grammar, for the probe scripts that parse a sample.
export const samples = {
	rust: 'fn main() {\n    let x = vec![1, 2, 3];\n    for y in x {\n        println!("{y}");\n    }\n}\n',
	typescript: 'export function f(x: number): number {\n  return x + 1;\n}\n',
	python: 'def f(x):\n    return [y for y in x if y]\n',
	scm: '(identifier) @name\n',
	regex: 'a(b|c)*d'
};
