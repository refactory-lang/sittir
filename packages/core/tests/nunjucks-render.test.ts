import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRendererFromConfig } from '../src/render.ts';
import type { RulesConfig, AnyNodeData } from '../src/types.ts';

// T025 + T027 + T028 — Nunjucks-backed renderer end-to-end. Drives the
// `templatesDir` option on createRendererFromConfig; confirms recursive
// render, fallback for rules without templates (T027a), and wrapped
// error messages (T028). T026 (loader directory vs yaml detection) is
// covered in a separate test in nunjucks-loader.test.ts.

// Minimal RulesConfig — the Nunjucks path doesn't read `rules` when
// a templatesDir is provided, so an empty shape is fine.
const emptyConfig: RulesConfig = {
	language: 'test',
	extensions: [],
	expandoChar: null,
	metadata: {},
	rules: {},
};

describe('createRendererFromConfig({ templatesDir }) — T025', () => {
	it('renders a branch node using the matching .jinja file', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'greet.jinja'), '{{ name }}!');
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = {
				$type: 'greet',
				$fields: { name: { $type: 'id', $text: 'world' } },
			};
			expect(render(node)).toBe('world!');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('recursively renders child nodes before passing to parent template', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'pair.jinja'), '[{{ first }},{{ second }}]');
			writeFileSync(join(tmp, 'wrap.jinja'), '({{ inner }})');
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = {
				$type: 'wrap',
				$fields: {
					inner: {
						$type: 'pair',
						$fields: {
							first: { $type: 'id', $text: 'a' },
							second: { $type: 'id', $text: 'b' },
						},
					},
				},
			};
			expect(render(node)).toBe('([a,b])');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('dispatches polymorph via $variant', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(
				join(tmp, 'poly.jinja'),
				'{%- if variant == "alpha" -%}A:{{ name }}{%- elif variant == "beta" -%}B:{{ name }}{%- endif -%}',
			);
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const nodeA: AnyNodeData = {
				$type: 'poly',
				$variant: 'alpha',
				$fields: { name: { $type: 'id', $text: 'x' } },
			};
			const nodeB: AnyNodeData = {
				$type: 'poly',
				$variant: 'beta',
				$fields: { name: { $type: 'id', $text: 'y' } },
			};
			expect(render(nodeA)).toBe('A:x');
			expect(render(nodeB)).toBe('B:y');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});

describe('Token-shaped-kind fallback — T027a / FR-017', () => {
	it('emits $text when no .jinja file exists and fields/children are all anonymous', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			// No .jinja file for `mod_item_external` — fallback should
			// emit $text verbatim. Mirrors rust's mod_item_external /
			// never_type / typescript's empty_statement cases.
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = {
				$type: 'mod_item_external',
				$text: 'mod foo;',
				$named: true,
			};
			expect(render(node)).toBe('mod foo;');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('throws when no .jinja file exists AND the node has named fields or children', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = {
				$type: 'unknown_rule',
				$fields: { name: { $type: 'id', $text: 'foo', $named: true } },
			};
			expect(() => render(node)).toThrow(/unknown_rule/);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});

describe('Error wrapping — T028 / FR-018', () => {
	it('wraps Nunjucks template errors with rule-kind + filename context', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			// Template with a Jinja syntax error
			writeFileSync(join(tmp, 'broken.jinja'), '{% if %}bogus');
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = {
				$type: 'broken',
				$fields: {},
			};
			expect(() => render(node)).toThrow(/broken.jinja/);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('T038: bare {{ undef }} renders empty (optional-field semantics)', () => {
		// Missing-field-in-context MUST render empty, not throw — this
		// is the legacy substitutor's "Absent → empty" contract that
		// templates like `{{ visibility_modifier }}` rely on. Keep this
		// test locked so a well-intentioned throwOnUndefined flip gets
		// caught by CI.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'maybe.jinja'), '[{{ maybe_present }}]');
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = { $type: 'maybe', $fields: {} };
			expect(render(node)).toBe('[]');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('T038: undefined variable inside a typed expression DOES throw with filename context', () => {
		// Typed-expression context (filter, arithmetic, method call)
		// forces Nunjucks to resolve the variable before applying the
		// operator — undefined variables throw even with
		// throwOnUndefined: false. Our wrapper surfaces the filename.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(
				join(tmp, 'uses_undef.jinja'),
				'{{ undefined_list | join(",") }}',
			);
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = { $type: 'uses_undef', $fields: {} };
			expect(() => render(node)).toThrow(/uses_undef\.jinja/);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});
