// @generated-header: false (hand-written core — preserved across regeneration)
//
// Pure render engine — no I/O, no `node:*` imports. Browser-safe.
// YAML loading and the `createRenderer(yamlPath)` convenience live in
// `./loader.ts`.

import type { AnyNodeData, Edit, ByteRange, RulesConfig, TemplateRule, TemplateRuleObject } from './types.ts';

export type { RulesConfig };

// ---------------------------------------------------------------------------
// Variable scanner regex
// ---------------------------------------------------------------------------

// Matches $$$NAME, $$NAME, $_NAME, $NAME (longest prefix first)
// Captures: [1] prefix ($$$, $$, $_, $), [2] NAME
const DEFAULT_VAR_RE = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;

// ---------------------------------------------------------------------------
// Render context — precomputed once per createRenderer call
// ---------------------------------------------------------------------------

interface InternalRenderContext {
	config: RulesConfig;
	varPattern: RegExp;
	prefix: string;
}

function buildRenderContext(config: RulesConfig): InternalRenderContext {
	const prefix = config.expandoChar ?? '$';
	const varPattern = prefix === '$'
		? DEFAULT_VAR_RE
		: new RegExp(`(${escapeRegex(prefix)}{3}|${escapeRegex(prefix)}{2}|${escapeRegex(prefix)}_|${escapeRegex(prefix)})([A-Z][A-Z0-9_]*)`, 'g');
	return { config, varPattern, prefix };
}

// ---------------------------------------------------------------------------
// Template resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the template string for a node. TemplateRule is either:
 * - `string`: a single template, returned directly
 * - `{ template: string }`: the standard object form
 * - `{ variants: { <name>: template, … }, detect?: … }`: named variants,
 *   dispatched from `node.$variant`, anonymous-token `detect` entries,
 *   or a field-presence fallback across the variant values.
 */
function resolveTemplate(rule: TemplateRule, node: AnyNodeData, varPattern: RegExp): string {
	if (typeof rule === 'string') return rule;

	const obj = rule as TemplateRuleObject;

	if (obj.variants) {
		// 1. Explicit variant field (set by form factories)
		if (node.$variant && obj.variants[node.$variant]) {
			return obj.variants[node.$variant]!;
		}
		// 2. Detect from anonymous tokens in children
		if (obj.detect && node.$children) {
			for (const child of node.$children) {
				const c = child as AnyNodeData;
				if (c.$named === false) {
					for (const [subtype, token] of Object.entries(obj.detect)) {
						if (c.$text === token) return obj.variants[subtype]!;
					}
				}
			}
		}
		// 3. Field-presence fallback — pick the variant whose `$VAR`
		//    placeholders all resolve against the incoming node.
		//    Prefers the variant with the MOST resolved variables when
		//    several partially match, falling back to the first entry.
		const picked = pickTemplate(Object.values(obj.variants), node, varPattern);
		if (picked !== null) return picked;
		return Object.values(obj.variants)[0]!;
	}

	const tmpl = obj.template;
	if (!tmpl) throw new Error(`Rule for '${node.$type}' has neither template nor variants`);
	return tmpl;
}

// ---------------------------------------------------------------------------
// Render engine
// ---------------------------------------------------------------------------

function render(node: AnyNodeData, ctx: InternalRenderContext): string {
	if (node.$text !== undefined && !node.$fields && !node.$children) return node.$text;

	if (!node.$fields && !node.$children) {
		throw new Error(`Node '${node.$type}' has no 'fields' or 'children' — did you mean to set 'text' for a leaf node?`);
	}

	const rule = ctx.config.rules[node.$type];
	if (!rule) {
		// Token-shaped named kinds — tree-sitter rules that resolve to a
		// single string literal (rust `mod_item_external`/`never_type`,
		// typescript `empty_statement`/`existential_type`, etc). Codegen
		// classifies them as `AssembledToken`, which emits no template,
		// because they aren't anonymous structural tokens (`(`, `+`) —
		// they're named wrappers over a single terminator. readNode
		// captures the terminator either as an anonymous $child or as an
		// anonymous-keyword entry in $fields (via promoteAnonymousKeyword,
		// keyed by the literal text). Either way: no named sub-structure,
		// and the captured $text is already the full render.
		//
		// Narrow fallback so a real missing-rule bug (node with actual
		// named fields or named children) still throws.
		const isAnonEntry = (v: unknown): boolean => {
			if (v == null || typeof v !== 'object') return false;
			const n = v as AnyNodeData;
			return n.$named === false;
		};
		const fieldsAllAnon = !node.$fields || Object.values(node.$fields).every(v =>
			Array.isArray(v) ? v.every(isAnonEntry) : isAnonEntry(v),
		);
		const childrenAllAnon = !node.$children ||
			(node.$children as readonly AnyNodeData[]).every(c => c.$named === false);
		if (node.$text !== undefined && fieldsAllAnon && childrenAllAnon) return node.$text;
		throw new Error(`No render rule for '${node.$type}'`);
	}

	const ruleObj = typeof rule === 'string' ? undefined : rule as unknown as Record<string, unknown>;

	const { varPattern, prefix } = ctx;

	// Resolve template — handles simple and named-variant forms.
	const rawTemplate = resolveTemplate(rule, node, varPattern);

	// Trim trailing newline from YAML | block scalar
	const tmpl = rawTemplate.endsWith('\n') ? rawTemplate.slice(0, -1) : rawTemplate;

	// Consumption model: track which children indices have been used.
	// $$$CHILDREN renders only the unconsumed remainder.
	const consumed = new Set<number>();

	const resolveSlot = (pfx: string, name: string): string => {
		const fieldKey = name.toLowerCase();
		const clauseKey = `${fieldKey}`;

		// `$TEXT` — emit the node's native text. Used for rules whose
		// tokens include external-scanner symbols (e.g. rust's
		// `raw_string_literal`: `_raw_string_literal_start` and
		// `_raw_string_literal_end` are scanner-generated and never
		// appear as named children, so a field-by-field template
		// can't reconstruct them).
		// `$NEWLINE` / `$INDENT` / `$DEDENT` — structural-whitespace role
		// placeholders emitted by the walker when a grammar uses external
		// tokens (python / haskell-style indent-sensitive parsers) to
		// delimit block structure. They always resolve to the literal
		// character(s) because tree-sitter consumes the physical token
		// as part of its layout engine without exposing it as a concrete
		// child node — so a field/children lookup would never find it.
		if (fieldKey === 'newline') return '\n';
		if (fieldKey === 'indent') return '';  // render-time indent is handled by column tracking
		if (fieldKey === 'dedent') return '';
		if (fieldKey === 'text') {
			// Parsed-tree path: readNode captured the full source span.
			if (node.$text !== undefined && node.$text !== '') return node.$text;
			// Factory-built path: the node never saw a source span.
			// Best-effort concatenate the fields + children so round-
			// trip tests for `$TEXT` rules still produce non-empty
			// output; better than silent ''.
			// Iterate fields + children, skipping absent entries. Optional
			// fields on a factory-built node come through as `undefined`
			// in `$fields` (the factory preserves the key, stamps the
			// value as the caller's `config?.fieldName`). Passing those
			// to `renderValue` crashes inside `render()` reading `.$text`
			// on undefined. The $TEXT fallback is a best-effort anyway —
			// silently dropping absent entries is the right call.
			const parts: string[] = [];
			if (node.$fields) {
				for (const v of Object.values(node.$fields)) {
					if (v === undefined || v === null) continue;
					const items = Array.isArray(v) ? v : [v];
					for (const item of items) {
						if (item === undefined || item === null) continue;
						parts.push(renderValue(item as AnyNodeData | string | number, ctx));
					}
				}
			}
			if (node.$children) {
				for (const c of node.$children) {
					if (c === undefined || c === null) continue;
					parts.push(renderValue(c as AnyNodeData | string | number, ctx));
				}
			}
			return parts.join('');
		}

		// 1. Clause reference (e.g., $RETURN_TYPE_CLAUSE → return_type_clause key in rule)
		// Exclude rule-object meta keys and require the value be a string template.
		if (
			ruleObj
			&& clauseKey in ruleObj
			&& clauseKey !== 'template'
			&& clauseKey !== 'joinBy'
			&& clauseKey !== 'variants'
			&& clauseKey !== 'detect'
			&& typeof ruleObj[clauseKey] === 'string'
		) {
			const clauseTemplate = ruleObj[clauseKey] as string;
			return renderClause(clauseTemplate, node, ctx, consumed, ruleObj);
		}

		// 2. Fields (tree-sitter FIELDs + promoted overrides)
		if (node.$fields?.[fieldKey] !== undefined) {
			const value = node.$fields[fieldKey];
			if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
				const items = Array.isArray(value) ? value : [value];
				const sep = resolveJoinBy(ruleObj, name);
				// Filter anonymous tokens out of multi-valued field
				// rendering — they're template-structural (commas,
				// delimiters) and belong in the joinBy, not in the value
				// list. Mirrors the rule for `$$$CHILDREN`. A lone
				// anonymous token on a single-value field survives
				// because the else-branch below skips this filter.
				const named = items.filter(item => {
					if (typeof item !== 'object' || item === null) return true;
					return (item as AnyNodeData).$named !== false;
				});
				const joined = named.map(item => renderValue(item as AnyNodeData | string | number, ctx)).join(sep);
				// Apply joinByLeading / joinByTrailing to multi-valued
				// fields too (not just $$$CHILDREN). Mandatory-separator
				// patterns like rust's tuple_expression `seq(expr, ',')`
				// produce a field (`elements`) containing the expressions
				// AND an anon comma that gets promoted to $fields[','] or
				// overflows to $children. flankSep probes $children for
				// the trailing anon sep; when missing from $children it
				// falls back to presence on $fields keyed by sep text.
				if (!sep || sep.length === 0 || named.length === 0) return joined;
				const prefix2 = ruleObj?.['joinByLeading'] === true ? flankSepForField(node, fieldKey, sep, 'leading') : '';
				const suffix = ruleObj?.['joinByTrailing'] === true ? flankSepForField(node, fieldKey, sep, 'trailing') : '';
				return prefix2 + joined + suffix;
			}
			if (Array.isArray(value)) {
				// Empty array in a single-slot field position means
				// upstream (factory / readNode / from.ts) produced a
				// zero-length list where the template expects exactly
				// one value. Emitting `''` silently produces malformed
				// output (e.g. a binary expression with no operand) —
				// same severity as the leaf "has no fields or children"
				// guard, so throw with the same shape.
				if (value.length === 0) {
					throw new Error(
						`Node '${node.$type}' field '${fieldKey}' is an empty array but the template expects exactly one value — single-slot field was rendered from a zero-length array.`,
					);
				}
				return renderValue(value[0] as AnyNodeData | string | number, ctx);
			}
			return renderValue(value as AnyNodeData | string | number, ctx);
		}

		// 3. $$$CHILDREN — unconsumed named children only
		// Anonymous tokens (delimiters, separators, keywords) are template-structural:
		// delimiters are in template text, separators are in joinBy, keywords are
		// in override fields. Only named children carry user content.
		if ((pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) && fieldKey === 'children') {
			if (!node.$children) return '';
			const remaining = node.$children.filter((c, i) =>
				!consumed.has(i) && (c as AnyNodeData).$named !== false
			);
			const sep = resolveJoinBy(ruleObj, name);
			// Render each child, then join. A line_comment child forces
			// a newline to follow (regardless of the configured sep),
			// because `//` comments extend to end-of-line — joining them
			// with ` ` to the next statement would fold that statement
			// into the comment at reparse time. Grammar-agnostic: any
			// node kind whose text starts with `//` or `#` and doesn't
			// already end in `\n` gets a `\n` suffix.
			const rendered = remaining.map(c => renderValue(c as AnyNodeData | string | number, ctx));
			const endsLineComment = (s: string): boolean => {
				const trimmed = s.trimEnd();
				if (trimmed.endsWith('\n')) return false;
				return /(?:^|\n)\s*(?:\/\/|#)[^\n]*$/.test(trimmed);
			};
			const pieces: string[] = [];
			for (let i = 0; i < rendered.length; i++) {
				pieces.push(rendered[i]!);
				if (i < rendered.length - 1) {
					pieces.push(endsLineComment(rendered[i]!) ? '\n' : sep);
				}
			}
			const joined = pieces.join('');
			if (!sep || sep.length === 0 || remaining.length === 0) return joined;
			// Leading / trailing-separator fidelity: codegen emits
			// `joinByLeading: true` / `joinByTrailing: true` when the
			// repeat rule captured those markers at evaluate time
			// (e.g. rust's or_pattern `| a | b`, struct_pattern
			// `{ a, b, }`). For each marker, probe the parse-tree
			// children for an anonymous separator token flanking the
			// named-child run and emit it when present — preserves
			// the original's with-or-without-flank state so ast-match
			// stays stable.
			const prefix = ruleObj?.['joinByLeading'] === true ? flankSep(node.$children, 'leading', sep) : '';
			const suffix = ruleObj?.['joinByTrailing'] === true ? flankSep(node.$children, 'trailing', sep) : '';
			return prefix + joined + suffix;
		}

		// 4a. Field-to-child promotion when tree-sitter omitted the field
		// label. Some parse paths surface the declared child without a
		// field name (python `list_splat`: `(list_splat (identifier))`
		// in expression-statement context but `(list_splat expression:
		// (identifier))` in argument-list context — same rule, different
		// GLR state). Gated to templates with NO `$$$CHILDREN` slot so
		// kinds that legitimately forward children elsewhere (rust
		// `impl_item`, `closure_expression`) don't steal unrelated
		// content. Single-valued slot only (`$FIELD`, not `$$$FIELD`) —
		// multi-valued slots fall through to existing logic.
		if (
			(pfx === prefix || pfx.length === 1)
			&& node.$children
			&& Array.isArray(node.$children)
			&& !tmpl.includes(`${prefix}${prefix}${prefix}CHILDREN`)
			&& !tmpl.includes(`${prefix}${prefix}${prefix}${fieldKey.toUpperCase()}`)
		) {
			const unconsumedNamed = node.$children.findIndex((c: any, i: number) =>
				!consumed.has(i) && (c as AnyNodeData).$named !== false
			);
			if (unconsumedNamed >= 0) {
				const onlyOne = node.$children
					.filter((c: any, i: number) => !consumed.has(i) && (c as AnyNodeData).$named !== false)
					.length === 1;
				if (onlyOne) {
					consumed.add(unconsumedNamed);
					return renderValue(node.$children[unconsumedNamed] as AnyNodeData | string | number, ctx);
				}
			}
		}

		// 4. Named child by kind — consume first unconsumed named match
		if (node.$children && Array.isArray(node.$children)) {
			const idx = node.$children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.$type === fieldKey && (c as AnyNodeData).$named !== false
			);
			if (idx >= 0) {
				consumed.add(idx);
				const child = node.$children[idx];
				if (pfx.length === 3 || pfx === `${prefix}${prefix}${prefix}`) {
					// $$$ on a single matched child — collect all unconsumed named of this type
					const items: unknown[] = [child];
					for (let i = idx + 1; i < node.$children.length; i++) {
						const c = node.$children[i] as AnyNodeData;
						if (!consumed.has(i) && c?.$type === fieldKey && c.$named !== false) {
							consumed.add(i);
							items.push(node.$children[i]);
						}
					}
					const sep = resolveJoinBy(ruleObj, name);
					return items.map(item => renderValue(item as AnyNodeData | string | number, ctx)).join(sep);
				}
				return renderValue(child as AnyNodeData | string | number, ctx);
			}
		}

		// 5. $CHILDREN (single) — first unconsumed named child
		if (fieldKey === 'children' && node.$children) {
			for (let i = 0; i < node.$children.length; i++) {
				const c = node.$children[i] as AnyNodeData;
				if (!consumed.has(i) && c.$named !== false) {
					consumed.add(i);
					return renderValue(c as AnyNodeData | string | number, ctx);
				}
			}
		}

		// 6. Absent → empty
		return '';
	};

	// Substitute with column-aware re-indentation. For each `$VAR` we look
	// at the characters since the previous newline in `result`; if they
	// are all spaces (line-leading indentation), we insert that same
	// indentation after every `\n` inside the substituted value. This
	// lets nested blocks compound their indent levels without baking
	// depth into templates or joinBy strings — block joinBy is just `\n`
	// and each outer substitution re-indents the joined content.
	let result = '';
	let lastIdx = 0;
	// Capture matches up-front: `matchAll` returns an independent iterator,
	// so recursive sub-renders (which reuse the same varPattern) cannot
	// interfere with the outer iteration's `lastIndex`.
	for (const match of tmpl.matchAll(varPattern)) {
		const idx = match.index!;
		result += tmpl.slice(lastIdx, idx);
		const slot = resolveSlot(match[1]!, match[2]!);
		const lastNl = result.lastIndexOf('\n');
		const lineLead = lastNl === -1 ? result : result.slice(lastNl + 1);
		const indented = lineLead.length > 0 && /^ +$/.test(lineLead)
			? slot.replace(/\n/g, '\n' + lineLead)
			: slot;
		result += indented;
		lastIdx = idx + match[0].length;
	}
	result += tmpl.slice(lastIdx);

	// FR-017: Absent-field space absorption — collapse runs of 2+ spaces
	// left by empty variable interpolations. The negative lookbehind skips
	// runs whose immediately-preceding character is a newline OR another
	// space, so line-leading indentation (any depth) is preserved verbatim.
	// No trim here: recursive sub-renders may legitimately start/end with
	// whitespace (block-bearer fields emit `\n  …\n`). The top-level
	// `boundRender` wrapper trims once at the end of the render tree.
	return result.replace(/(?<![\n ]) {2,}/g, ' ');
}

/**
 * Pick the best variant template: the first where all $VARIABLES resolve.
 * Falls back to the first template with the most resolved variables.
 */
function pickTemplate(
	templates: string[],
	node: AnyNodeData,
	varPattern: RegExp,
): string | null {
	// Score each template by variable resolution against the node.
	// Lower `unresolved` is better — a template with all variables
	// resolved beats one with any phantoms. On ties, prefer more total
	// variables (more specific).
	const scored = templates.map(tmpl => {
		let total = 0;
		let resolved = 0;
		const tpl = tmpl.endsWith('\n') ? tmpl.slice(0, -1) : tmpl;
		tpl.replace(varPattern, (_match: string, _pfx: string, name: string) => {
			const fieldKey = name.toLowerCase();
			total++;
			if (node.$fields?.[fieldKey] !== undefined) { resolved++; return ''; }
			if (fieldKey === 'children' && node.$children && node.$children.length > 0) { resolved++; return ''; }
			if (node.$children && Array.isArray(node.$children)) {
				if (node.$children.some((c: any) => c?.$type === fieldKey)) { resolved++; return ''; }
			}
			return '';
		});
		return { tmpl, total, resolved, unresolved: total - resolved };
	});

	// Sort: fewest unresolved variables first, then most total (specificity).
	scored.sort((a, b) => {
		if (a.unresolved !== b.unresolved) return a.unresolved - b.unresolved;
		return b.total - a.total;
	});

	return scored[0]?.tmpl ?? null;
}

/** Render a clause sub-template. If any variable is absent, omit the entire clause. */
function renderClause(
	clauseTemplate: string,
	node: AnyNodeData,
	ctx: InternalRenderContext,
	consumed: Set<number>,
	ruleObj?: Record<string, unknown>,
): string {
	const { varPattern } = ctx;
	// Nested clause references inside a clause body (`$BANG_CLAUSE` inside
	// `trait_clause`) resolve against the enclosing rule's clause map. They're
	// optional by nature — a missing nested clause renders to empty, not to
	// a dropped parent — so the allPresent check treats them as present.
	const isNestedClauseRef = (name: string): boolean => {
		if (!ruleObj) return false;
		const k = name.toLowerCase();
		const v = ruleObj[k];
		return typeof v === 'string' && k !== 'template' && k !== 'joinBy';
	};

	// Bare-literal clauses (no `$VAR` placeholders) are anonymous-token
	// presence checks. A walker that wants to round-trip an
	// `optional(',')` / `optional(';')` / `optional('::')` emits a
	// clause whose body IS the literal string; this branch fires the
	// clause only when readNode captured an unconsumed anonymous child
	// with exactly that text. Consuming the child keeps `$$$CHILDREN`
	// from double-emitting it later in the same template.
	if (!varPattern.test(clauseTemplate)) {
		// Reset stateful regex — .test() advances lastIndex when global.
		varPattern.lastIndex = 0;
		if (node.$children && Array.isArray(node.$children)) {
			const idx = node.$children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.$type === clauseTemplate
			);
			if (idx >= 0) {
				consumed.add(idx);
				return clauseTemplate;
			}
		}
		// readNode promotes anonymous tokens to $fields keyed by their
		// text (see readNode.ts promoteAnonymousKeyword). So a bare-literal
		// clause body like `!` resolves against $fields['!'] rather than
		// $children. The walker emits these for non-word-punctuation
		// optionals (rust `impl_item` trait negation, etc.).
		if (node.$fields && node.$fields[clauseTemplate] !== undefined) {
			return clauseTemplate;
		}
		return '';
	}
	varPattern.lastIndex = 0;

	// First pass: check if all variables resolve
	let allPresent = true;
	clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		if (node.$fields?.[fieldKey] !== undefined) return '';
		// Also check children by kind
		if (node.$children && Array.isArray(node.$children)) {
			const idx = node.$children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.$type === fieldKey
			);
			if (idx >= 0) return '';
		}
		if (isNestedClauseRef(name)) return '';
		allPresent = false;
		return '';
	});

	if (!allPresent) return '';

	// Second pass: actually render (consuming children)
	return clauseTemplate.replace(varPattern, (_match: string, _pfx: string, name: string) => {
		const fieldKey = name.toLowerCase();
		if (isNestedClauseRef(name)) {
			return renderClause(ruleObj![fieldKey] as string, node, ctx, consumed, ruleObj);
		}
		if (node.$fields?.[fieldKey] !== undefined) {
			const raw = node.$fields[fieldKey];
			// Multi-valued fields (promoted anonymous tokens +
			// repeated slots) arrive as arrays. renderValue(array)
			// would treat it as a node with `.type === undefined`
			// and throw; single-value clauses just want the first
			// entry (same convention as the `$NAME` single-slot
			// path above in resolveSlot).
			const value = Array.isArray(raw)
				? (raw.length > 0 ? raw[0] as AnyNodeData | string | number : '')
				: raw as AnyNodeData | string | number;
			if (value === '') return '';
			return renderValue(value, ctx);
		}
		// Children by kind fallback
		if (node.$children && Array.isArray(node.$children)) {
			const idx = node.$children.findIndex((c: any, i: number) =>
				!consumed.has(i) && c?.$type === fieldKey
			);
			if (idx >= 0) {
				consumed.add(idx);
				return renderValue(node.$children[idx] as AnyNodeData | string | number, ctx);
			}
		}
		return '';
	});
}

/** Resolve joinBy for a $$$ variable. Per-field overrides take precedence
 * over the rule-level default. The walker emits `joinByField: { name: sep }`
 * when a single rule has multiple multi-valued slots with different
 * separators (e.g. rust tuple_expression: `attributes` joins with `\n`,
 * `rest` joins with `,`). */
/**
 * Probe a children array for an anonymous separator token immediately
 * before (`leading`) or after (`trailing`) the run of named children.
 * Returns the separator when one is found adjacent to the named-child
 * boundary, `''` otherwise — caller uses the return value verbatim as
 * the prefix/suffix to append to the joined slot output.
 */
/**
 * Multi-valued field flank detector — companion to `flankSep` for the
 * `$$$FIELD` render path. readNode scatters anon tokens between
 * `$children` and `$fields[text]` depending on promotion order:
 *   - First occurrence of each text → `$fields[text]`
 *   - Subsequent occurrences → `$children`
 * So the separator for a rule with the first-mandatory-comma pattern
 * (rust `seq(expr, ',')`) can end up either place. We can't infer
 * leading/trailing from membership alone.
 *
 * Use spans: a separator is "trailing" iff an anon `sep` token's span
 * starts at-or-after the last named field-value's span.end. Symmetric
 * for "leading" with span.end ≤ first value's span.start. Probes the
 * separator-keyed $fields entry plus any anon in $children.
 */
function flankSepForField(node: AnyNodeData, fieldKey: string, sep: string, side: 'leading' | 'trailing'): string {
	// Anchor the leading/trailing boundary on the spans of THIS specific
	// multi-valued field's named entries. Anchoring on every named field
	// in the node is wrong: rust `match_statement`'s `$$$SUBJECT` with a
	// trailing `,` (before `:` and the body) would see the body's span
	// as "latest end" and the comma (which is between subject and body)
	// would fail the `start >= boundary` trailing check.
	const fieldSpans: { start: number; end: number }[] = [];
	const value = node.$fields?.[fieldKey];
	if (value !== undefined) {
		const arr = Array.isArray(value) ? value : [value];
		for (const item of arr) {
			if (!item || typeof item !== 'object') continue;
			const n = item as AnyNodeData;
			if (n.$named === false) continue;
			if (n.$span) fieldSpans.push(n.$span);
		}
	}
	if (fieldSpans.length === 0) return '';
	const boundary = side === 'leading'
		? Math.min(...fieldSpans.map(s => s.start))
		: Math.max(...fieldSpans.map(s => s.end));
	// Collect candidate anon sep tokens from $fields[sep] and $children.
	const candidates: AnyNodeData[] = [];
	const sepEntry = node.$fields?.[sep];
	if (sepEntry) {
		const arr = Array.isArray(sepEntry) ? sepEntry : [sepEntry];
		for (const x of arr) if (x && typeof x === 'object' && (x as AnyNodeData).$named === false) candidates.push(x as AnyNodeData);
	}
	if (node.$children) {
		for (const c of node.$children) if (c && typeof c === 'object' && (c as AnyNodeData).$named === false && (c as AnyNodeData).$text === sep) candidates.push(c as AnyNodeData);
	}
	for (const c of candidates) {
		if (!c.$span || c.$text !== sep) continue;
		if (side === 'trailing' && c.$span.start >= boundary) return sep;
		if (side === 'leading' && c.$span.end <= boundary) return sep;
	}
	return '';
}

function flankSep(children: readonly unknown[], side: 'leading' | 'trailing', sep: string): string {
	const isNamed = (c: unknown): boolean =>
		typeof c === 'object' && c !== null && (c as AnyNodeData).$named !== false;
	const namedIdx = side === 'leading'
		? children.findIndex(isNamed)
		: children.findLastIndex(isNamed);
	if (namedIdx < 0) return '';
	const neighborIdx = side === 'leading' ? namedIdx - 1 : namedIdx + 1;
	if (neighborIdx < 0 || neighborIdx >= children.length) return '';
	const neighbor = children[neighborIdx] as AnyNodeData | undefined;
	return neighbor && neighbor.$named === false && neighbor.$text === sep ? sep : '';
}

function resolveJoinBy(ruleObj: Record<string, unknown> | undefined, varName: string): string {
	if (!ruleObj) return ' ';
	const joinByField = ruleObj['joinByField'] as Record<string, string> | undefined;
	if (joinByField) {
		const fieldKey = varName.toLowerCase();
		if (fieldKey in joinByField) return joinByField[fieldKey]!;
	}
	const joinBy = ruleObj['joinBy'] as string | undefined;
	return joinBy ?? ' ';
}

/** Render a field value — handles AnyNodeData, string, and number. */
function renderValue(value: AnyNodeData | string | number, ctx: InternalRenderContext): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	// Guard against undefined / null reaching the NodeData branch. Callers
	// that iterate a parent's fields can legitimately see an optional-field
	// slot come through undefined; they should filter before calling here,
	// but throwing with context is better than the raw
	// `Cannot read properties of undefined (reading '$text')` from
	// `render()`'s first line.
	if (value === undefined || value === null) {
		throw new Error(`renderValue: value is ${value === null ? 'null' : 'undefined'} — filter absent fields before calling`);
	}
	return render(value, ctx);
}

/** Escape a string for use in a RegExp. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// createRendererFromConfig — close over rules once, return bound helpers
// ---------------------------------------------------------------------------
//
// File-loading variants (`createRenderer(yamlPath)` + `loadTemplates`)
// live in `./loader.ts` so `render.ts` has no `node:*` dependencies.

export interface BoundRenderer {
	render(node: AnyNodeData): string;
	toEdit(node: AnyNodeData, start: number, end: number): Edit;
	toEdit(node: AnyNodeData, range: ByteRange): Edit;
}

/**
 * Create a renderer from a pre-parsed RulesConfig.
 */
export function createRendererFromConfig(config: RulesConfig): BoundRenderer {
	const ctx = buildRenderContext(config);

	function boundRender(node: AnyNodeData): string {
		return render(node, ctx).trim();
	}

	function boundToEdit(node: AnyNodeData, startOrRange: number | ByteRange, end?: number): Edit {
		if (typeof startOrRange === 'number') {
			if (typeof end !== 'number') {
				throw new Error('endPos is required when startPos is a number');
			}
			if (startOrRange < 0 || end < 0) {
				throw new Error(`Edit positions must be non-negative (got start=${startOrRange}, end=${end})`);
			}
			if (startOrRange > end) {
				throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${end})`);
			}
			return { startPos: startOrRange, endPos: end, insertedText: boundRender(node) };
		}
		return {
			startPos: startOrRange.start.index,
			endPos: startOrRange.end.index,
			insertedText: boundRender(node),
		};
	}

	return { render: boundRender, toEdit: boundToEdit as BoundRenderer['toEdit'] };
}
