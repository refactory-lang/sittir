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
	rules: {}
};

describe('createRendererFromConfig({ templatesDir }) — T025', () => {
	it('renders a branch node using the matching .jinja file', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'greet.jinja'), '{{ name }}!');
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'greet',
				$fields: { name: { $type: 'id', $text: 'world' } }
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
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'wrap',
				$fields: {
					inner: {
						$type: 'pair',
						$fields: {
							first: { $type: 'id', $text: 'a' },
							second: { $type: 'id', $text: 'b' }
						}
					}
				}
			};
			expect(render(node)).toBe('([a,b])');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('renders boolean keyword and punctuation fields before Nunjucks interpolation', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(
				join(tmp, 'flagged.jinja'),
				'{% if async_marker | isPresent %}{{ async_marker }} {% endif %}{{ optional_marker }}'
			);
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'flagged',
				$fields: {
					async_marker: true,
					optional_marker: true
				}
			};
			expect(render(node)).toBe('async ?');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('dispatches polymorph via $variant', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(
				join(tmp, 'poly.jinja'),
				'{%- if variant == "alpha" -%}A:{{ name }}{%- elif variant == "beta" -%}B:{{ name }}{%- endif -%}'
			);
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const nodeA: AnyNodeData = {
				$type: 'poly',
				$variant: 'alpha',
				$fields: { name: { $type: 'id', $text: 'x' } }
			};
			const nodeB: AnyNodeData = {
				$type: 'poly',
				$variant: 'beta',
				$fields: { name: { $type: 'id', $text: 'y' } }
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
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'mod_item_external',
				$text: 'mod foo;',
				$named: true
			};
			expect(render(node)).toBe('mod foo;');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('throws when no .jinja file exists AND the node has named fields or children', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'unknown_rule',
				$fields: { name: { $type: 'id', $text: 'foo', $named: true } }
			};
			expect(() => render(node)).toThrow(/unknown_rule/);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});

describe('$TEXT fallback + anon-filter shape — post-011 coverage', () => {
	it('synthesizes `text` from $fields when a factory-built node hits a {{ text }} template', () => {
		// Factory-built node: no $text span; template asks for `{{ text }}`.
		// buildNunjucksTemplateContext concatenates rendered field /
		// child values so verbatim-pass-through templates still work
		// after a factory construction.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'raw.jinja'), '{{ text }}');
			writeFileSync(join(tmp, 'id.jinja'), '{{ text }}');
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'raw',
				$fields: {
					a: { $type: 'id', $text: 'hello' },
					b: { $type: 'id', $text: 'world' }
				}
			};
			// Factory-synthesized text concatenates rendered field values
			// in iteration order.
			expect(render(node)).toBe('helloworld');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('uses $text verbatim when present — synthesis does not overwrite a real span', () => {
		// Parsed-tree path: readNode captured $text from the source.
		// Synthesis must NOT fire — the real span wins over any
		// rendered-fields concatenation. Regression guard: earlier
		// versions of the fallback tested `$text === ''` which
		// accidentally treats a falsy-but-intentional `''` as absent;
		// the current gate `$text === ''` is the intent, but this test
		// pins that a non-empty $text short-circuits regardless of
		// fields being present.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'raw.jinja'), '{{ text }}');
			writeFileSync(join(tmp, 'id.jinja'), '{{ text }}');
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'raw',
				$text: 'r"actual"',
				$fields: {
					a: { $type: 'id', $text: 'hello' },
					b: { $type: 'id', $text: 'world' }
				}
			};
			// $text wins — synthesis (which would give "helloworld")
			// doesn't fire because the real span is present.
			expect(render(node)).toBe('r"actual"');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('filters anon children out of multi-valued field slots', () => {
		// Multi-valued slot with a structural anon separator interleaved:
		// the anon is a structural comma, it belongs in the joinBy, not
		// in the rendered values. The context builder drops $named:false
		// entries from multi-slots.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'list.jinja'), '[{{ items | join(",") }}]');
			writeFileSync(join(tmp, 'id.jinja'), '{{ text }}');
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'list',
				$fields: {
					items: [
						{ $type: 'id', $text: 'a', $named: true },
						{ $type: 'anon', $text: ',', $named: false },
						{ $type: 'id', $text: 'b', $named: true }
					]
				}
			};
			expect(render(node)).toBe('[a,b]');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('keeps anon entries in SINGLE-valued field slots (promoted keyword path)', () => {
		// Single-valued slot: even when the source is an anon token
		// (promoted keyword like async / move / unsafe), the context
		// keeps it — renders straight through. Mirrors the
		// factory-built path for modifier keywords.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'wrap.jinja'), '{{ modifier }} fn');
			writeFileSync(join(tmp, 'anon.jinja'), '{{ text }}');
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'wrap',
				$fields: {
					modifier: { $type: 'anon', $text: 'async', $named: false }
				}
			};
			expect(render(node)).toBe('async fn');
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
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = {
				$type: 'broken',
				$fields: {}
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
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = { $type: 'maybe', $fields: {} };
			expect(render(node)).toBe('[]');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('T038: render errors surface with the template filename', () => {
		// FR-018: any render error from Nunjucks — unknown filter,
		// syntax error, typed-expression resolution failure — must be
		// rewrapped with the template filename so field diagnostics
		// can point back to the source. We use an unknown filter as
		// the trigger because it unconditionally throws regardless of
		// variable definedness.
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-render-'));
		try {
			writeFileSync(join(tmp, 'uses_undef.jinja'), '{{ something | no_such_filter }}');
			const { render } = createRendererFromConfig(emptyConfig, {
				templatesDir: tmp
			});
			const node: AnyNodeData = { $type: 'uses_undef', $fields: {} };
			expect(() => render(node)).toThrow(/uses_undef\.jinja/);
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});
