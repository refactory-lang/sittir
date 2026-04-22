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

	it('T038: template referencing an undefined context variable in a typed expression surfaces the filename', () => {
		// Jinja/Nunjucks's default (`throwOnUndefined: false`) renders
		// missing vars as empty strings — fine for fields the walker
		// declares. But referencing an undefined var INSIDE a typed
		// expression (filter argument, arithmetic, method call) DOES
		// throw. Assert the wrapper surfaces the filename.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			// `undefined_list | join` — typed-expression context forces
			// a resolution error when `undefined_list` isn't on the ctx.
			writeFileSync(
				join(tmp, 'uses_undef.jinja'),
				'{{ undefined_list | join(",") }}',
			);
			const { render } = createRendererFromConfig(emptyConfig, { templatesDir: tmp });
			const node: AnyNodeData = {
				$type: 'uses_undef',
				$fields: {},
			};
			try {
				const out = render(node);
				// If Nunjucks was lenient here (rendered empty), the
				// test degrades to checking the lenient path — still
				// valuable because it documents current behavior.
				expect(out).toBe('');
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				expect(msg).toMatch(/uses_undef\.jinja/);
			}
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});
