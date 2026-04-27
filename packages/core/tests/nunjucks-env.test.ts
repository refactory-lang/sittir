import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createNunjucksEnvironment } from "../src/templates/nunjucks-env.ts";

// T024 — Nunjucks Environment factory for sittir. Configured to:
//   - trim whitespace-controls (`{%-` / `-%}` strip like Jinja2)
//   - no autoescape (output is source code, not HTML)
//   - load `.jinja` files from a directory via Node-backed loader
//     (browser support is deferred to the Rust→WASM path post-port)
//
// These tests drive the config surface; they don't exercise the
// render flow end-to-end (that lands in T027).

describe("createNunjucksEnvironment — T024", () => {
	it("loads a .jinja file from the configured templatesDir and renders it", () => {
		const tmp = mkdtempSync(join(tmpdir(), "sittir-nunjucks-"));
		try {
			writeFileSync(join(tmp, "greet.jinja"), "{{ name }}!");
			const env = createNunjucksEnvironment(tmp);
			const rendered = env.render("greet.jinja", { name: "world" });
			expect(rendered).toBe("world!");
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it("strips whitespace around {%- and -%} markers", () => {
		const tmp = mkdtempSync(join(tmpdir(), "sittir-nunjucks-"));
		try {
			writeFileSync(join(tmp, "strip.jinja"), "a {%- if flag -%} B {%- endif -%} c");
			const env = createNunjucksEnvironment(tmp);
			// `{%-` strips leading whitespace, `-%}` strips trailing.
			// Both sides eat the adjacent spaces whether the block
			// renders or not — matches Jinja2 / askama.
			expect(env.render("strip.jinja", { flag: true })).toBe("aBc");
			expect(env.render("strip.jinja", { flag: false })).toBe("ac");
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it("does NOT autoescape HTML — output is literal", () => {
		const tmp = mkdtempSync(join(tmpdir(), "sittir-nunjucks-"));
		try {
			writeFileSync(join(tmp, "code.jinja"), "{{ expr }}");
			const env = createNunjucksEnvironment(tmp);
			// Source-code output: `<` must stay literal, not become `&lt;`.
			expect(env.render("code.jinja", { expr: "a < b && c > d" })).toBe("a < b && c > d");
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it("throws when the referenced template is missing", () => {
		const tmp = mkdtempSync(join(tmpdir(), "sittir-nunjucks-"));
		try {
			const env = createNunjucksEnvironment(tmp);
			expect(() => env.render("absent.jinja", {})).toThrow();
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('supports variant-dispatch via {% if variant == "form" %}', () => {
		const tmp = mkdtempSync(join(tmpdir(), "sittir-nunjucks-"));
		try {
			writeFileSync(
				join(tmp, "poly.jinja"),
				'{%- if variant == "alpha" -%}A:{{ name }}{%- elif variant == "beta" -%}B:{{ name }}{%- endif -%}',
			);
			const env = createNunjucksEnvironment(tmp);
			expect(env.render("poly.jinja", { variant: "alpha", name: "x" })).toBe("A:x");
			expect(env.render("poly.jinja", { variant: "beta", name: "y" })).toBe("B:y");
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});
