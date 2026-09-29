export interface Probe {
	readonly source: string;
	readonly detached: string;
	readonly owner?: string;
}

export const PROBES: Record<string, readonly Probe[]> = {
	rust: [
		{ source: 'fn f() { // TODO\n}\n', detached: 'fn f() {\n    // TODO\n}' },
		{ source: 'foo(/* none */);\n', detached: 'foo(/* none */);' },
		{ source: 'struct S { /* empty */ }\n', detached: 'struct S {\n    /* empty */\n}' },
		{ source: 'a; // note\n', detached: 'a; // note\n' },
		{ source: '// one\n/* two */\n', detached: '// one\n/* two */' }
	],
	typescript: [
		{
			source: 'function f() { /* empty */ }\n',
			detached: 'function f() {\n  /* empty */\n}\n',
			owner: 'inner of the block: its zero-width automatic_semicolon owns nothing'
		}
	],
	python: [
		{
			source: 'def f():\n    # only a comment\n    pass\n',
			detached: 'def f():\n    # only a comment\n    pass\n',
			owner: 'leading of the body block'
		},
		{
			source: 'if x:\n    a\n# c\nb\n',
			detached: 'if x:\n    a\n# c\nb\n',
			owner: 'leading of the next statement, not trailing of the if block'
		}
	]
};

export const ORPHANS: Record<string, readonly (readonly [string, string])[]> = {
	typescript: [
		['x = (/* c */ this);', 'x = /* c */ (this);'],
		['x = (/* c */ undefined);', 'x = /* c */ (undefined);'],
		['x = (/* c */ true);', 'x = /* c */ (true);'],
		['x = (/* c */ null);', 'x = /* c */ (null);'],
		['class A extends B { m() { (/* c */ super).m(); } }', 'class A extends B {\n  m() {\n    /* c */ (super).m();\n  }\n}\n'],
		['for (/* c */;;) {}', 'for (;;) /* c */ {}\n'],
		['x = (// c\n this);', 'x = // c\n(this);'],
		['x = (this /* c */);', 'x = (this) /* c */;']
	],
	rust: [
		['fn f() { (/* c */ self); }', 'fn f() {\n    /* c */ (self);\n}'],
		['fn f() { (self /* c */); }', 'fn f() {\n    (self) /* c */;\n}'],
		['fn f() { (// c\n self); }', 'fn f() {\n    // c\n    (self);\n}']
	],
	python: [
		['x = (  # c\n    True)\n', 'x = # c\n(True)\n'],
		['x = (  # c\n    True) + 1\n', 'x = # c\n(True) + 1\n'],
		['a = 1; x = (  # c\n    True)\n', 'a = 1; x = # c\n(True)\n']
	]
};
