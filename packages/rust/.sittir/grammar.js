"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/rust/overrides.ts
var overrides_exports = {};
__export(overrides_exports, {
  default: () => overrides_default
});
module.exports = __toCommonJS(overrides_exports);
var import_grammar = __toESM(require("tree-sitter-rust/grammar.js"), 1);

// packages/codegen/src/dsl/runtime-shapes.ts
function isFieldLike(v) {
  if (!v || typeof v !== "object") return false;
  const t = v.type;
  return (t === "field" || t === "FIELD") && typeof v.name === "string";
}
function isContainerType(t) {
  return t === "seq" || t === "SEQ" || t === "choice" || t === "CHOICE";
}
function isWrapperType(t) {
  return t === "optional" || t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1" || t === "field" || t === "FIELD" || t === "TOKEN" || t === "IMMEDIATE_TOKEN" || t === "BLANK";
}
function isPrecWrapper(rule) {
  const t = rule.type;
  return t === "prec" || t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC";
}

// packages/codegen/src/dsl/transform-path.ts
function dsl() {
  return globalThis;
}
function nativeRequired(name) {
  const fn = dsl()[name];
  if (typeof fn !== "function") {
    throw new Error(`transform: no global ${String(name)}() found \u2014 must be called inside a runtime that injects ${String(name)}() (sittir evaluate.ts or tree-sitter CLI)`);
  }
  return fn;
}
var ApplyPathSkip = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ApplyPathSkip";
  }
};
function parsePath(pathStr) {
  if (typeof pathStr !== "string" || pathStr.length === 0) {
    throw new Error(`parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`);
  }
  if (pathStr.startsWith("/") || pathStr.endsWith("/")) {
    throw new Error(`parsePath: leading/trailing slash not allowed in path '${pathStr}'`);
  }
  const parts = pathStr.split("/");
  const segments = [];
  for (const part of parts) {
    if (part === "*") {
      segments.push({ kind: "wildcard" });
    } else if (/^\d+$/.test(part)) {
      segments.push({ kind: "index", value: Number(part) });
    } else {
      throw new Error(`parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index or '*'`);
    }
  }
  return segments;
}
var membersOf = (r) => r.members;
var contentOf = (r) => r.content;
function applyPath(rule, segments, patch, precStack) {
  if (segments.length === 0) {
    return typeof patch === "function" ? patch(rule, precStack) : patch;
  }
  if (isPrecWrapper(rule)) {
    const newStack = precStack ? [...precStack, rule] : [rule];
    const newContent = applyPath(contentOf(rule), segments, patch, newStack);
    return reconstructPrec(rule, newContent);
  }
  const [head, ...rest] = segments;
  const t = rule.type;
  if (isContainerType(t)) {
    return applyToMembers(rule, head, rest, patch, precStack);
  }
  if (isWrapperType(t)) {
    if (head.kind === "wildcard" || head.kind === "index" && head.value === 0) {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructWrapper(rule, newContent);
    }
    throw new ApplyPathSkip(
      `applyPath: index ${head.kind === "index" ? head.value : "*"} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 is valid)`
    );
  }
  throw new ApplyPathSkip(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`);
}
function reconstructContainer(rule, members) {
  const t = rule.type;
  if (t === "seq" || t === "SEQ") return nativeRequired("seq")(...members);
  if (t === "choice" || t === "CHOICE") return nativeRequired("choice")(...members);
  throw new Error(`reconstructContainer: unknown container type '${t}'`);
}
function reconstructWrapper(rule, newContent) {
  const t = rule.type;
  if (t === "optional") return nativeRequired("optional")(newContent);
  if (t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1") {
    const r = rule;
    if (r.separator !== void 0 || r.leading !== void 0 || r.trailing !== void 0) {
      throw new Error(
        `reconstructWrapper: cannot path-address under a '${rule.type}' rule with separator/leading/trailing metadata \u2014 native repeat() can't round-trip those fields. Use flat positional transform or restructure the override.`
      );
    }
    return nativeRequired(t === "repeat" || t === "REPEAT" ? "repeat" : "repeat1")(newContent);
  }
  if (t === "field" || t === "FIELD") {
    const name = rule.name;
    return nativeRequired("field")(name, newContent);
  }
  throw new Error(
    `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' \u2014 this is a bug in the path-descent logic.`
  );
}
var PREC_VARIANT_MAP = {
  prec_left: "left",
  prec_right: "right",
  prec_dynamic: "dynamic"
};
function reconstructPrec(rule, newContent) {
  const t = rule.type.toLowerCase();
  const value = rule.value ?? 0;
  const prec = nativeRequired("prec");
  const variant2 = PREC_VARIANT_MAP[t];
  if (variant2) {
    const fn = prec[variant2];
    if (typeof fn !== "function") throw new Error(`transform: native prec.${variant2} not available`);
    return fn(value, newContent);
  }
  return prec(value, newContent);
}
function applyToMembers(rule, head, rest, patch, precStack) {
  const members = [...membersOf(rule)];
  if (head.kind === "index") {
    if (head.value < 0 || head.value >= members.length) {
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds in ${rule.type} of length ${members.length}`
      );
    }
    members[head.value] = applyPath(members[head.value], rest, patch, precStack);
    return reconstructContainer(rule, members);
  }
  if (members.length === 0) {
    throw new ApplyPathSkip(`applyPath: wildcard matched zero members in empty ${rule.type}`);
  }
  let anyApplied = false;
  for (let i = 0; i < members.length; i++) {
    try {
      members[i] = applyPath(members[i], rest, patch, precStack);
      anyApplied = true;
    } catch (e) {
      if (e instanceof ApplyPathSkip) continue;
      throw e;
    }
  }
  if (!anyApplied) {
    throw new ApplyPathSkip(`applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`);
  }
  return reconstructContainer(rule, members);
}

// packages/codegen/src/dsl/field.ts
function isFieldPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "field";
}
function field(name, content) {
  if (content === void 0) {
    return { __sittirPlaceholder: "field", name };
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error("field(): no global field() found \u2014 must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)");
  }
  return native(name, content);
}

// packages/codegen/src/dsl/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}

// packages/codegen/src/dsl/variant.ts
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name) {
  return { __sittirPlaceholder: "variant", name };
}

// packages/codegen/src/dsl/synthetic-rules.ts
var currentSyntheticRules = null;
var currentRuleKind = null;
var currentPolymorphVariants = /* @__PURE__ */ new Map();
function getCurrentRuleKind() {
  return currentRuleKind;
}
function registerSyntheticRule(name, content) {
  if (!currentSyntheticRules) {
    currentSyntheticRules = /* @__PURE__ */ new Map();
  }
  currentSyntheticRules.set(name, content);
}
function registerPolymorphVariant(parentKind, variantName) {
  const existing = currentPolymorphVariants.get(parentKind) ?? [];
  existing.push(variantName);
  currentPolymorphVariants.set(parentKind, existing);
}
function drainSyntheticRules() {
  const rules = currentSyntheticRules ?? /* @__PURE__ */ new Map();
  currentSyntheticRules = null;
  return rules;
}
function installGrammarWrapper() {
  const g = globalThis;
  const nativeGrammar = g.grammar;
  if (typeof nativeGrammar !== "function") return;
  g.grammar = function wrappedGrammar(...args) {
    currentSyntheticRules = /* @__PURE__ */ new Map();
    const opts = args.length > 1 ? args[1] : args[0];
    if (opts?.rules) {
      const permissive = new Proxy({}, {
        get(_, name) {
          return { type: "SYMBOL", name };
        }
      });
      for (const [name, ruleFn] of Object.entries(opts.rules)) {
        if (typeof ruleFn === "function") {
          currentRuleKind = name;
          try {
            ruleFn.call(permissive, permissive, void 0);
          } catch {
          } finally {
            currentRuleKind = null;
          }
        }
      }
    }
    const discoveredNames = new Map(currentSyntheticRules);
    currentSyntheticRules = /* @__PURE__ */ new Map();
    if (opts?.rules) {
      for (const [name, ruleFn] of Object.entries(opts.rules)) {
        if (typeof ruleFn !== "function") continue;
        opts.rules[name] = function(...a) {
          currentRuleKind = name;
          try {
            return ruleFn.apply(this, a);
          } finally {
            currentRuleKind = null;
          }
        };
      }
    }
    if (opts?.rules && discoveredNames.size > 0) {
      const blank = g.blank;
      for (const [name] of discoveredNames) {
        if (!(name in opts.rules)) {
          opts.rules[name] = () => blank ? blank() : { type: "BLANK" };
        }
      }
    }
    const result = nativeGrammar.apply(this, args);
    const synthetic = drainSyntheticRules();
    if (result && synthetic.size > 0 && typeof result === "object") {
      const grammar2 = result.grammar ?? result;
      if ("rules" in grammar2) {
        const rules = grammar2.rules;
        for (const [name, content] of synthetic) {
          rules[name] = content;
        }
      }
    }
    return result;
  };
}

// packages/codegen/src/dsl/transform.ts
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = Object.keys(patches).some((k) => k.includes("/") || k.includes("*"));
    const hasPlaceholderAlias = Object.values(patches).some((v) => isAliasPlaceholder(v) || isVariantPlaceholder(v));
    if (hasPathKeys || hasPlaceholderAlias) {
      rule = applyPathPatches(rule, patches);
    } else {
      rule = applyFlatPatches(rule, patches);
    }
  }
  return rule;
}
function applyPathPatches(original, patches) {
  let rule = original;
  for (const [key, value] of Object.entries(patches)) {
    const segments = parsePath(String(key));
    rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  return rule;
}
var membersOf2 = (r) => r.members;
var contentOf2 = (r) => r.content;
function applyFlatPatches(original, patches) {
  const t = original.type;
  if (t === "seq" || t === "SEQ") {
    const members = [...membersOf2(original)];
    for (const [key, patch] of Object.entries(patches)) {
      if (!/^\d+$/.test(key)) {
        throw new Error(
          `transform: invalid flat-positional key '${key}' \u2014 keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`
        );
      }
      const index = Number(key);
      if (index >= members.length) {
        throw new Error(
          `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`
        );
      }
      members[index] = resolvePatch(patch, members[index]);
    }
    return reconstructContainer(original, members);
  }
  if (t === "choice" || t === "CHOICE") {
    const newMembers = membersOf2(original).map((m) => applyFlatPatches(m, patches));
    return reconstructContainer(original, newMembers);
  }
  if (isPrecWrapper(original)) {
    const newContent = applyFlatPatches(contentOf2(original), patches);
    return reconstructPrec(original, newContent);
  }
  if (isWrapperType(t)) {
    const newContent = applyFlatPatches(contentOf2(original), patches);
    return reconstructWrapper(original, newContent);
  }
  return original;
}
function wrapInPrec(content, precStack) {
  if (!precStack?.length) return content;
  let result = content;
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = reconstructPrec(precStack[i], result);
  }
  return result;
}
function resolvePatch(patch, originalMember, precStack) {
  if (isFieldPlaceholder(patch)) {
    let content = originalMember;
    if (isFieldLike(content) && content.source === "inferred") {
      content = content.content;
    }
    const native = globalThis.field;
    if (typeof native !== "function") {
      throw new Error("transform: no global field() found \u2014 patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)");
    }
    const reconstructed = native(patch.name, content);
    return { ...reconstructed, source: "override" };
  }
  if (isFieldLike(patch)) {
    return { ...patch, source: "override" };
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = getCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    const fullName = `${parentKind}_${patch.name}`;
    const hiddenName = "_" + fullName;
    registerSyntheticRule(hiddenName, wrapInPrec(originalMember, precStack));
    registerPolymorphVariant(parentKind, fullName);
    const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
    return {
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: fullName
    };
  }
  if (isAliasPlaceholder(patch)) {
    const hiddenName = "_" + patch.name;
    registerSyntheticRule(hiddenName, wrapInPrec(originalMember, precStack));
    const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
    return {
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: patch.name
    };
  }
  return patch;
}

// packages/codegen/src/dsl/enrich.ts
var PASSES = [
  kindToNamePass,
  optionalKeywordPrefixPass,
  bareKeywordPrefixPass
];
function enrich(base2) {
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  if (!("grammar" in base2)) {
    return base2;
  }
  if (!base2.grammar || typeof base2.grammar.rules !== "object") {
    throw new Error("enrich(): grammar is missing a rules record");
  }
  let result = base2;
  for (const pass of PASSES) {
    result = pass(result);
  }
  return result;
}
function kindToNamePass(g) {
  return mapRules(g, applyKindToName);
}
function applyKindToName(ruleName, rule) {
  if (rule.type !== "seq") return rule;
  const kindCounts = /* @__PURE__ */ new Map();
  for (const m of rule.members) {
    if (m.type === "symbol") {
      kindCounts.set(m.name, (kindCounts.get(m.name) ?? 0) + 1);
    }
  }
  const existingFields = collectFieldNames(rule);
  let changed = false;
  const newMembers = rule.members.map((m) => {
    if (m.type !== "symbol") return m;
    const sym = m;
    const kindName = sym.name;
    if (kindName.startsWith("_")) return m;
    if ((kindCounts.get(kindName) ?? 0) > 1) return m;
    if (existingFields.has(kindName)) {
      reportSkip("kind-to-name", ruleName, `field '${kindName}' already exists`);
      return m;
    }
    existingFields.add(kindName);
    changed = true;
    return wrapAsField(kindName, sym);
  });
  if (!changed) return rule;
  return { type: "seq", members: newMembers };
}
function optionalKeywordPrefixPass(g) {
  return mapRules(g, (ruleName, rule) => walkOptionalKeyword(ruleName, rule));
}
function walkOptionalKeyword(ruleName, rule) {
  switch (rule.type) {
    case "seq": {
      const seq2 = rule;
      const claimed = /* @__PURE__ */ new Set();
      for (const m of seq2.members) {
        if (m.type === "field") claimed.add(m.name);
      }
      const members = seq2.members.map((m) => {
        if (m.type === "optional") {
          const inner = m.content;
          if (inner.type === "string") {
            const kw = inner.value;
            if (isIdentifierShaped(kw)) {
              if (claimed.has(kw)) {
                reportSkip("optional-keyword-prefix", ruleName, `field '${kw}' already exists`);
                return m;
              }
              claimed.add(kw);
              return {
                type: "optional",
                content: wrapAsField(kw, inner)
              };
            }
          }
        }
        return walkOptionalKeyword(ruleName, m);
      });
      return { type: "seq", members };
    }
    case "choice": {
      const ch = rule;
      return {
        type: "choice",
        members: ch.members.map((m) => walkOptionalKeyword(ruleName, m))
      };
    }
    case "optional":
    case "repeat":
    case "repeat1":
    case "field": {
      const r = rule;
      return { ...rule, content: walkOptionalKeyword(ruleName, r.content) };
    }
    default:
      return rule;
  }
}
function bareKeywordPrefixPass(g) {
  return mapRules(g, applyBareKeywordPrefix);
}
function applyBareKeywordPrefix(ruleName, rule) {
  if (rule.type !== "seq") return rule;
  const seq2 = rule;
  const first = seq2.members[0];
  if (!first || first.type !== "string") return rule;
  const kw = first.value;
  if (!isIdentifierShaped(kw)) return rule;
  const existingFields = collectFieldNames(rule);
  if (existingFields.has(kw)) {
    reportSkip("bare-keyword-prefix", ruleName, `field '${kw}' already exists`);
    return rule;
  }
  return {
    type: "seq",
    members: [wrapAsField(kw, first), ...seq2.members.slice(1)]
  };
}
function mapRules(g, fn) {
  const newRules = {};
  for (const [name, rule] of Object.entries(g.grammar.rules)) {
    newRules[name] = fn(name, rule);
  }
  return {
    ...g,
    grammar: {
      ...g.grammar,
      rules: newRules
    }
  };
}
function wrapAsField(name, content) {
  return {
    type: "field",
    name,
    content,
    source: "inferred"
  };
}
function collectFieldNames(rule) {
  const names = /* @__PURE__ */ new Set();
  if (rule.type !== "seq") return names;
  for (const m of rule.members) {
    if (m.type === "field") {
      names.add(m.name);
    } else if (m.type === "optional" && m.content.type === "field") {
      names.add(m.content.name);
    }
  }
  return names;
}
function isIdentifierShaped(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
function reportSkip(pass, ruleName, reason) {
  if (process.env.SITTIR_QUIET) return;
  process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})
`);
}

// packages/codegen/src/dsl/index.ts
installGrammarWrapper();

// packages/rust/overrides.ts
var overrides_default = grammar(enrich(import_grammar.default), {
  name: "rust",
  rules: {
    // abstract_type: 1 field(s)
    abstract_type: ($, original) => transform(original, {
      1: field("type_parameters")
      // type_parameters [struct=0]
    }),
    // array_expression: pos 1 is the outer attribute_item repeat. Pos 2
    // is a choice between `[expr; length]` and `[elem1, elem2, ...]`
    // shapes. Wrapping pos 2 as a single `elements` field carries the
    // list-shape joinBy but clobbers `field('length', ...)` in the
    // semi form. Open gap: promotePolymorph would splice in both
    // shapes but loses the list-form ',' separator from the repeat.
    array_expression: ($, original) => transform(original, {
      1: field("attributes"),
      // attribute_item
      2: field("elements")
      // _expression | attribute_item
    }),
    // associated_type: 1 field(s)
    associated_type: ($, original) => transform(original, {
      4: field("where_clause")
      // where_clause [struct=0]
    }),
    // async_block: position 2 is the `block` symbol (position 1 is
    // the optional `move` choice). Autogen placed the override at
    // position 1, which wrapped the move choice and dropped the
    // block routing entirely.
    async_block: ($, original) => transform(original, {
      2: field("block")
    }),
    // attribute_item: 1 field(s)
    attribute_item: ($, original) => transform(original, {
      2: field("attribute")
      // attribute [struct=0]
    }),
    // block: 1 field(s)
    block: ($, original) => transform(original, {
      0: field("label")
      // label [struct=0]
    }),
    // bounded_type: 2 field(s)
    bounded_type: ($, original) => transform(original, {
      0: field("left"),
      // lifetime | _type | use_bounds [struct=0]
      2: field("right")
      // lifetime | _type | use_bounds [struct=1]
    }),
    // break_expression: 2 field(s)
    break_expression: ($, original) => transform(original, {
      1: field("label"),
      // label [struct=0]
      2: field("expression")
      // _expression [struct=1]
    }),
    // captured_pattern: 2 field(s)
    captured_pattern: ($, original) => transform(original, {
      0: field("identifier"),
      // identifier [struct=0]
      2: field("pattern")
      // _pattern [struct=1]
    }),
    // const_item: 1 field(s)
    const_item: ($, original) => transform(original, {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    }),
    // continue_expression: 1 field(s)
    continue_expression: ($, original) => transform(original, {
      1: field("label")
      // label [struct=0]
    }),
    // enum_item: 2 field(s)
    enum_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      4: field("where_clause")
      // where_clause [struct=1]
    }),
    // enum_variant: 1 field(s)
    enum_variant: ($, original) => transform(original, {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    }),
    // extern_crate_declaration: 2 field(s)
    extern_crate_declaration: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      2: field("crate")
      // crate [struct=1]
    }),
    // extern_modifier: 1 field(s)
    extern_modifier: ($, original) => transform(original, {
      1: field("string_literal")
      // string_literal [struct=0]
    }),
    // field_declaration: 1 field(s)
    field_declaration: ($, original) => transform(original, {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    }),
    // field_pattern: 1 field(s)
    // Grammar: seq(optional('ref'), optional(mutable_specifier), choice(...))
    // Position 0 = optional('ref') [anonymous], position 1 = optional(mutable_specifier)
    field_pattern: ($, original) => transform(original, {
      1: field("mutable_specifier")
      // mutable_specifier [struct=0]
    }, {
      "2/0": variant("shorthand"),
      // name only (shorthand)
      "2/1": variant("named")
      // name: pattern
    }),
    // for_expression: 1 field(s)
    for_expression: ($, original) => transform(original, {
      0: field("label")
      // label [struct=0]
    }),
    // foreign_mod_item: 2 field(s)
    foreign_mod_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      1: field("extern_modifier")
      // extern_modifier [struct=1]
    }),
    // function_item: pos 6 is optional(seq('->', field('return_type', ..))) —
    // don't touch it, return_type is already a base-grammar field. The
    // where_clause symbol lives at pos 7. Pos 8 is the body block (also
    // already a base field).
    function_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier
      1: field("function_modifiers"),
      // function_modifiers
      7: field("where_clause")
      // where_clause
    }),
    // function_signature_item: same shape as function_item but ends in
    // ';' instead of a body block — pos 7 is where_clause here too.
    function_signature_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier
      1: field("function_modifiers"),
      // function_modifiers
      7: field("where_clause")
      // where_clause
    }),
    // function_type: 2 field(s)
    function_type: ($, original) => transform(original, {
      0: field("for_lifetimes"),
      // for_lifetimes [struct=0]
      1: field("function_modifiers")
      // function_modifiers [struct=1]
    }),
    // gen_block: same fix as async_block — the block symbol is
    // at position 2, position 1 is the optional `move` choice.
    gen_block: ($, original) => transform(original, {
      2: field("block")
    }),
    // impl_item: override removed. Same autogen mistake as struct_item —
    // position 0 was labeled `field('where_clause')` but it's the
    // unsafe/impl header start, not a where_clause. The where_clause
    // is buried deeper in the rule's seq.
    // index_expression: 2 field(s)
    index_expression: ($, original) => transform(original, {
      0: field("object"),
      // _expression [struct=0]
      2: field("index")
      // _expression [struct=1]
    }),
    // inner_attribute_item: 1 field(s)
    inner_attribute_item: ($, original) => transform(original, {
      3: field("attribute")
      // attribute [struct=0]
    }),
    // label: 1 field(s)
    label: ($, original) => transform(original, {
      1: field("identifier")
      // identifier [struct=0]
    }),
    // let_declaration: 1 field(s)
    let_declaration: ($, original) => transform(original, {
      1: field("mutable_specifier")
      // mutable_specifier [struct=0]
    }),
    // lifetime: 1 field(s)
    lifetime: ($, original) => transform(original, {
      1: field("identifier")
      // identifier [struct=0]
    }),
    // loop_expression: 1 field(s)
    loop_expression: ($, original) => transform(original, {
      0: field("label")
      // label [struct=0]
    }),
    // macro_definition: 1 field(s)
    macro_definition: ($, original) => transform(original, {
      2: field("rules")
      // macro_rule [struct=0]
    }),
    // macro_invocation: 1 field(s)
    macro_invocation: ($, original) => transform(original, {
      2: field("token_tree")
      // token_tree [struct=0]
    }),
    // mod_item: 1 field(s)
    mod_item: ($, original) => transform(original, {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    }),
    // mut_pattern: 2 field(s)
    mut_pattern: ($, original) => transform(original, {
      0: field("mutable_specifier"),
      // mutable_specifier [struct=0]
      1: field("pattern")
      // _pattern [struct=1]
    }),
    // negative_literal: 2 field(s)
    negative_literal: ($, original) => transform(original, {
      1: field("value")
      // integer_literal | float_literal [struct=0]
    }),
    // ordered_field_declaration_list: 1 field(s)
    // The original override had position 2 for `visibility_modifier`
    // targeting `optional(',')` (trailing comma). After evaluate's
    // `absorbTrailingSeparator` collapses the trailing comma into the
    // repeat's `trailing: true` flag, position 2 becomes `)` — wrong.
    // Also `visibility_modifier` is inside the per-element seq, not at
    // the outer level, so the position 2 override was structurally
    // incorrect. Only wrapping position 1 (the per-element group).
    ordered_field_declaration_list: ($, original) => transform(original, {
      1: field("attributes")
      // per-element group [struct=0]
    }),
    // parameter: 1 field(s)
    parameter: ($, original) => transform(original, {
      0: field("mutable_specifier")
      // mutable_specifier [struct=0]
    }),
    // pointer_type: position 1 is `choice('const', $.mutable_specifier)`.
    // Wrapping the choice as `field('mutable_specifier')` makes BOTH
    // the `const` string and the `mutable_specifier` symbol route to
    // the named slot at readNode time, so the template can emit the
    // actual qualifier text instead of hardcoding "const".
    pointer_type: ($, original) => transform(original, {
      1: field("mutable_specifier")
    }),
    // raw_string_literal: 3 field(s)
    raw_string_literal: ($, original) => transform(original, {
      0: field("raw_string_literal_start"),
      //  [struct=0]
      1: field("string_content"),
      // string_content [struct=1]
      2: field("raw_string_literal_end")
      //  [struct=2]
    }),
    // reference_expression: 1 field(s)
    reference_expression: ($, original) => transform(original, {
      1: field("mutable_specifier")
      // mutable_specifier [struct=0]
    }),
    // reference_pattern: 2 field(s)
    reference_pattern: ($, original) => transform(original, {
      1: field("mutable_specifier"),
      // mutable_specifier [struct=0]
      2: field("pattern")
      // _pattern [struct=1]
    }),
    // reference_type: 2 field(s)
    reference_type: ($, original) => transform(original, {
      1: field("lifetime"),
      // lifetime [struct=0]
      2: field("mutable_specifier")
      // mutable_specifier [struct=1]
    }),
    // self_parameter: 3 field(s)
    self_parameter: ($, original) => transform(original, {
      0: field("lifetime"),
      // lifetime [struct=0]
      1: field("mutable_specifier"),
      // mutable_specifier [struct=1]
      2: field("self")
      // self [struct=2]
    }),
    // shorthand_field_initializer: 2 field(s)
    shorthand_field_initializer: ($, original) => transform(original, {
      0: field("attributes"),
      // attribute_item [struct=0]
      1: field("identifier")
      // identifier [struct=1]
    }),
    // source_file: 2 field(s)
    source_file: ($, original) => transform(original, {
      0: field("shebang"),
      // shebang [struct=0]
      1: field("statements")
      // _statement [struct=1]
    }),
    // static_item: 2 field(s)
    static_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      2: field("mutable_specifier")
      // mutable_specifier [struct=1]
    }),
    // struct_item: position 0 is `choice(visibility_modifier, BLANK)`
    // — wrap it as `field('visibility_modifier')` so readNode
    // routes the modifier child onto the named slot. Position 4
    // (the body/semi/unit polymorph choice) is intentionally NOT
    // wrapped — that's what lets Link's promotePolymorph classify
    // the body/semi/unit variants.
    struct_item: ($, original) => transform(original, {
      0: field("visibility_modifier")
    }),
    // trait_item: position 0 is the same visibility_modifier
    // optional choice as struct_item. The where_clause at
    // position 6 and the body field at position 7 stay as
    // declared in the base grammar.
    trait_item: ($, original) => transform(original, {
      0: field("visibility_modifier")
    }),
    // try_block: 1 field(s)
    try_block: ($, original) => transform(original, {
      1: field("block")
      // block [struct=0]
    }),
    // try_expression: 2 field(s)
    try_expression: ($, original) => transform(original, {
      0: field("value")
      // _expression [struct=0]
    }),
    // tuple_expression: 4 field(s)
    tuple_expression: ($, original) => transform(original, {
      1: field("attributes"),
      // attribute_item [struct=0]
      2: field("first"),
      // _expression [struct=1]
      3: field("rest"),
      // _expression [struct=2]
      4: field("trailing")
      // _expression [struct=3]
    }),
    // type_item: 3 field(s)
    type_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      4: field("where_clause"),
      // where_clause [struct=1]
      7: field("trailing_where_clause")
      // where_clause [struct=2]
    }),
    // unary_expression: override removed. Autogen wrapped position
    // 0 (the `choice('-','*','!')` operator) in `field('operand')`
    // but that position is the OPERATOR, not the operand. Letting
    // the walker see the raw enum emits `-$$$CHILDREN`. Note:
    // overrides.json still has `operator`/`operand` fields, so
    // readNode at runtime produces field data — but the walker
    // no longer masks the operator as an "operand" slot.
    // union_item: 2 field(s)
    union_item: ($, original) => transform(original, {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      4: field("where_clause")
      // where_clause [struct=1]
    }),
    // unsafe_block: 1 field(s)
    unsafe_block: ($, original) => transform(original, {
      1: field("block")
      // block [struct=0]
    }),
    // use_declaration: 1 field(s)
    use_declaration: ($, original) => transform(original, {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    }),
    // use_wildcard: 1 field(s)
    use_wildcard: ($, original) => transform(original, {
      0: field("path")
      // crate | identifier | metavariable | scoped_identifier | self | super [struct=0]
    }),
    // variadic_parameter: 1 field(s)
    variadic_parameter: ($, original) => transform(original, {
      0: field("mutable_specifier")
      // mutable_specifier [struct=0]
    }),
    // while_expression: 1 field(s)
    while_expression: ($, original) => transform(original, {
      0: field("label")
      // label [struct=0]
    }),
    // ---------------------------------------------------------------------------
    // New overrides — expressing field routing previously only in overrides.json
    // ---------------------------------------------------------------------------
    // closure_expression — label the three optional modifiers so readNode
    // can route `async`, `move`, `static` tokens to named fields instead
    // of leaving them as anonymous children.
    closure_expression: ($, original) => transform(
      original,
      { 0: field("static"), 1: field("async"), 2: field("move") },
      { "4/0": variant("block"), "4/1": variant("expr") }
    ),
    // function_modifiers — full replacement: label each choice alternative
    // so readNode can route `async`, `const`, `default`, `unsafe` tokens.
    function_modifiers: ($) => repeat1(choice(
      field("async", "async"),
      field("default", "default"),
      field("const", "const"),
      field("unsafe", "unsafe"),
      $.extern_modifier
    )),
    // or_pattern — patches the BASE rule's prec.left(-2, ...)
    // structure to add field labels. Base shape:
    //   choice(seq(_pattern, '|', _pattern), seq('|', _pattern))
    or_pattern: ($, original) => transform(
      original,
      { "0/0": field("left"), "0/2": field("right"), "1/1": field("right") },
      { "0": variant("binary"), "1": variant("prefix") }
    ),
    // range_expression — patches the BASE rule's choice alternatives
    // by position so the prec.left(1, ...) wrapper survives. The
    // base shape (after path addressing's prec-transparency) is:
    //   choice(
    //     seq(expr, choice('..','...','..='), expr),  // alt 0 — binary
    //     seq(expr, '..'),                            // alt 1 — postfix
    //     seq('..', expr),                            // alt 2 — prefix
    //     '..',                                       // alt 3 — bare
    //   )
    // Each {path,value} below labels one position in one alternative.
    range_expression: ($, original) => transform(
      original,
      {
        "0/0": field("start"),
        "0/1": field("operator"),
        "0/2": field("end"),
        "1/0": field("start"),
        "1/1": field("operator"),
        "2/0": field("operator"),
        "2/1": field("end"),
        "3": field("operator")
      },
      {
        "0": variant("binary"),
        "1": variant("postfix"),
        "2": variant("prefix"),
        "3": variant("bare")
      }
    ),
    // range_pattern — two variants: left-bounded (has field 'left') vs
    // prefix form (just operator + right). Base grammar already carries
    // 'left' and 'right' field labels.
    range_pattern: ($, original) => transform(original, {
      "0": variant("left"),
      // seq(left, choice(seq(op,right), '..'))
      "1": variant("prefix")
      // seq(op, right)
    }),
    // unary_expression — label both the operator token (pos 0) and
    // the operand expression (pos 1). overrides.json promotes both
    // to fields at readNode time; the walker needs matching IR
    // fields so the template emits `$OPERATOR$OPERAND` instead of
    // `$OPERATOR $$$CHILDREN` (which reads empty after field promotion).
    unary_expression: ($, original) => transform(original, {
      0: field("operator"),
      // choice('-', '*', '!')
      1: field("operand")
      // $._expression
    }),
    // visibility_modifier — label the `pub` keyword and the `in` keyword
    // (inside `pub(in path)`) so readNode can route them to named fields.
    visibility_modifier: ($) => choice(
      $.crate,
      seq(
        field("pub", "pub"),
        optional(seq(
          "(",
          choice(
            $.self,
            $.super,
            $.crate,
            seq(field("in", "in"), $._path)
          ),
          ")"
        ))
      )
    )
  }
});
if (module.exports && module.exports.default) module.exports = module.exports.default;
