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
    } else if (/^-?\d+$/.test(part)) {
      segments.push({ kind: "index", value: Number(part) });
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part)) {
      segments.push({ kind: "kind-match", name: part });
    } else {
      throw new Error(`parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index, '*', or a kind name ([a-zA-Z_][a-zA-Z0-9_]*)`);
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
  if (head.kind === "kind-match") {
    return applyKindMatch(rule, head.name, rest, patch, precStack, false);
  }
  if (isContainerType(t)) {
    return applyToMembers(rule, head, rest, patch, precStack);
  }
  if (isWrapperType(t)) {
    const wrapperHit = head.kind === "wildcard" || head.kind === "index" && (head.value === 0 || head.value === -1);
    if (wrapperHit) {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructWrapper(rule, newContent);
    }
    throw new ApplyPathSkip(
      `applyPath: index ${head.kind === "index" ? head.value : "*"} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
    );
  }
  throw new ApplyPathSkip(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`);
}
function applyKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField) {
  const result = walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField);
  if (!result.matched) {
    throw new ApplyPathSkip(`applyPath: kind '${targetKind}' matched zero occurrences in this subtree`);
  }
  return result.rule;
}
function walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField) {
  if (rule === null || rule === void 0 || typeof rule !== "object" || typeof rule.type !== "string") {
    return { rule, matched: false };
  }
  const t = rule.type;
  if (isPrecWrapper(rule)) {
    const stack = precStack ? [...precStack, rule] : [rule];
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, stack, insideNamedField);
    return { rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule, matched: inner.matched };
  }
  if (t === "symbol" || t === "SYMBOL") {
    const name = rule.name;
    if (name !== targetKind) return { rule, matched: false };
    if (insideNamedField) return { rule, matched: false };
    const patched = rest.length === 0 ? typeof patch === "function" ? patch(rule, precStack) : patch : applyPath(rule, rest, patch, precStack);
    return { rule: patched, matched: true };
  }
  if (t === "field" || t === "FIELD") {
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, true);
    return { rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule, matched: inner.matched };
  }
  if (isWrapperType(t)) {
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, insideNamedField);
    return { rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule, matched: inner.matched };
  }
  if (isContainerType(t)) {
    const members = [...membersOf(rule)];
    let anyMatched = false;
    for (let i = 0; i < members.length; i++) {
      const inner = walkKindMatch(members[i], targetKind, rest, patch, precStack, insideNamedField);
      if (inner.matched) {
        members[i] = inner.rule;
        anyMatched = true;
      }
    }
    return { rule: anyMatched ? reconstructContainer(rule, members) : rule, matched: anyMatched };
  }
  return { rule, matched: false };
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
    const baseNode = nativeRequired(t === "repeat" || t === "REPEAT" ? "repeat" : "repeat1")(newContent);
    if (r.separator !== void 0) baseNode.separator = r.separator;
    if (r.leading !== void 0) baseNode.leading = r.leading;
    if (r.trailing !== void 0) baseNode.trailing = r.trailing;
    return baseNode;
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
    const idx = head.value < 0 ? members.length + head.value : head.value;
    if (idx < 0 || idx >= members.length) {
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds in ${rule.type} of length ${members.length}`
      );
    }
    members[idx] = applyPath(members[idx], rest, patch, precStack);
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

// packages/codegen/src/dsl/synthetic-rules.ts
var currentSyntheticRules = null;
var currentRuleKind = null;
var currentOptsRules = null;
var currentBlankFn = null;
var currentPolymorphVariants = [];
function getCurrentRuleKind() {
  return currentRuleKind;
}
function registerSyntheticRule(name, content) {
  if (!currentSyntheticRules) {
    currentSyntheticRules = /* @__PURE__ */ new Map();
  }
  currentSyntheticRules.set(name, content);
  if (currentOptsRules && !(name in currentOptsRules)) {
    const blank = currentBlankFn;
    currentOptsRules[name] = () => blank ? blank() : { type: "BLANK" };
  }
}
function maybeKeywordSymbol(fieldName, content, wrapSyntheticBody) {
  const c = content;
  if (!c || typeof c.type !== "string") return content;
  const isString = c.type === "STRING" || c.type === "string";
  if (!isString) return content;
  const isUpperCase = c.type === "STRING";
  const hiddenName = `_kw_${fieldName}`;
  const nativePrec = globalThis.prec;
  let precBody = typeof nativePrec?.left === "function" ? nativePrec.left(1, content) : content;
  if (wrapSyntheticBody) precBody = wrapSyntheticBody(precBody);
  registerSyntheticRule(hiddenName, precBody);
  return {
    type: isUpperCase ? "SYMBOL" : "symbol",
    name: hiddenName
  };
}
function registerPolymorphVariant(parentKind, childSuffix) {
  const dup = currentPolymorphVariants.find((v) => v.parent === parentKind && v.child === childSuffix);
  if (dup) {
    throw new Error(
      `variant('${childSuffix}'): duplicate variant name on rule '${parentKind}'. Each variant() within a rule must have a unique name \u2014 change one or merge the patches.`
    );
  }
  currentPolymorphVariants.push({ parent: parentKind, child: childSuffix });
}
function drainSyntheticRules() {
  const rules = currentSyntheticRules ?? /* @__PURE__ */ new Map();
  currentSyntheticRules = null;
  return rules;
}
var currentConflicts = [];
function registerConflict(names) {
  if (names.length === 0) return;
  currentConflicts.push([...names]);
}
function drainConflicts() {
  const conflicts = currentConflicts;
  currentConflicts = [];
  return conflicts;
}
function wrapInPrecStack(content, precStack, reconstructPrec2) {
  if (!precStack?.length) return content;
  let result = content;
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = reconstructPrec2(precStack[i], result);
  }
  return result;
}
function registerAliasedVariant(hiddenName, aliasValue, originalMember, bodyWrapper) {
  const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
  const wasEmpty = matchesEmpty(originalMember);
  const factored = factorOutEmptiness(originalMember);
  if (wasEmpty && !factored) {
    throw new Error(
      `variant()/alias(): can't extract '${hiddenName}' \u2014 its content matches the empty string and no non-empty core could be factored out. Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`
    );
  }
  const body = factored ? factored.nonEmpty : originalMember;
  registerSyntheticRule(hiddenName, bodyWrapper(body));
  const aliasNode = {
    type: isUpperCase ? "ALIAS" : "alias",
    content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
    named: true,
    value: aliasValue
  };
  if (factored) {
    const optional2 = globalThis.optional;
    if (typeof optional2 !== "function") {
      throw new Error("synthetic-rules: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()");
    }
    return optional2(aliasNode);
  }
  return aliasNode;
}
function factorOutEmptiness(rule) {
  if (!matchesEmpty(rule)) return null;
  return extractNonEmpty(rule);
}
function extractNonEmpty(rule) {
  const t = rule.type;
  if (t === "repeat" || t === "REPEAT") {
    const r = rule;
    const nonEmpty = { ...r, type: t === "REPEAT" ? "REPEAT1" : "repeat1" };
    return { nonEmpty };
  }
  if (t === "optional") {
    const inner = rule.content;
    return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
  }
  if (t === "choice" || t === "CHOICE") {
    const members = rule.members;
    const nonEmpty = members.filter((m) => !matchesEmpty(m));
    if (nonEmpty.length === 0) return null;
    if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
    return { nonEmpty: { type: t, members: nonEmpty } };
  }
  if (t === "seq" || t === "SEQ") {
    const members = [...rule.members];
    for (let i = 0; i < members.length; i++) {
      const factored = extractNonEmpty(members[i]);
      if (factored) {
        members[i] = factored.nonEmpty;
        return { nonEmpty: { type: t, members } };
      }
    }
    return null;
  }
  return null;
}
function matchesEmpty(rule) {
  const t = rule.type;
  if (t === "blank" || t === "BLANK") return true;
  if (t === "optional") return true;
  if (t === "repeat" || t === "REPEAT") return true;
  if (t === "choice" || t === "CHOICE") {
    const members = rule.members;
    return members.some((m) => matchesEmpty(m));
  }
  if (t === "seq" || t === "SEQ") {
    const members = rule.members;
    return members.every((m) => matchesEmpty(m));
  }
  return false;
}
function installGrammarWrapper() {
  const g = globalThis;
  const nativeGrammar = g.grammar;
  if (typeof nativeGrammar !== "function") return;
  g.grammar = function wrappedGrammar(...args) {
    currentSyntheticRules = /* @__PURE__ */ new Map();
    const base2 = args.length > 1 ? args[0] : void 0;
    const opts = args.length > 1 ? args[1] : args[0];
    if (opts) {
      const userNames = Object.keys(opts.rules ?? {});
      Object.defineProperty(opts, "__userOverrideRuleNames__", {
        value: userNames,
        enumerable: false,
        configurable: true,
        writable: false
      });
    }
    if (base2?.__enrichOverrides__ && opts) {
      if (!opts.rules) opts.rules = {};
      for (const [name, fn] of Object.entries(base2.__enrichOverrides__)) {
        if (!(name in opts.rules)) opts.rules[name] = fn;
      }
    }
    if (opts?.rules) {
      const permissive = new Proxy({}, {
        get(_, name) {
          return { type: "SYMBOL", name };
        }
      });
      for (const [name, ruleFn] of Object.entries(opts.rules)) {
        if (typeof ruleFn === "function") {
          currentRuleKind = name;
          let baseOriginal = void 0;
          const baseFn = base2?.rules?.[name];
          if (typeof baseFn === "function") {
            try {
              baseOriginal = baseFn.call(permissive, permissive, void 0);
            } catch {
            }
          }
          try {
            ruleFn.call(permissive, permissive, baseOriginal);
          } catch {
          } finally {
            currentRuleKind = null;
          }
        }
      }
    }
    const discoveredNames = new Map(currentSyntheticRules);
    currentSyntheticRules = /* @__PURE__ */ new Map();
    const pendingConflictsAfterGrammar = drainConflicts();
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
    if (opts?.rules) {
      currentOptsRules = opts.rules;
      currentBlankFn = g.blank ?? null;
    }
    const result = nativeGrammar.apply(this, args);
    currentOptsRules = null;
    currentBlankFn = null;
    const allConflicts = [...pendingConflictsAfterGrammar, ...drainConflicts()];
    if (result && allConflicts.length > 0 && typeof result === "object") {
      const grammar2 = result.grammar ?? result;
      const current = Array.isArray(grammar2.conflicts) ? grammar2.conflicts : [];
      for (const group of allConflicts) {
        current.push([...group]);
      }
      grammar2.conflicts = current;
    }
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
  const initial = native(name, content);
  const inner = initial.content;
  const symbolized = maybeKeywordSymbol(name, inner);
  if (symbolized !== inner) {
    const reconstructed = native(name, symbolized);
    return { ...reconstructed, source: "override" };
  }
  return { ...initial, source: "override" };
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

// packages/codegen/src/dsl/transform.ts
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = Object.keys(patches).some((k) => !/^\d+$/.test(k));
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
  const variantEntries = [];
  const otherEntries = [];
  for (const entry of Object.entries(patches)) {
    const v = entry[1];
    if (isVariantPlaceholder(v)) variantEntries.push([entry[0], v]);
    else otherEntries.push(entry);
  }
  let rule = original;
  for (const [key, value] of otherEntries) {
    const segments = parsePath(String(key));
    rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  if (variantEntries.length > 0) {
    const hoisted = tryHoistSiblingVariants(rule, variantEntries);
    if (hoisted) {
      rule = hoisted.rule;
      for (const [key, value] of variantEntries) {
        if (hoisted.consumed.has(key)) continue;
        const segments = parsePath(key);
        rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
      }
    } else {
      for (const [key, value] of variantEntries) {
        const segments = parsePath(key);
        rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
      }
    }
  }
  return rule;
}
function tryHoistSiblingVariants(rule, variantEntries) {
  const precStack = [];
  let core = rule;
  while (core && isPrecWrapper(core)) {
    precStack.push(core);
    core = contentOf2(core);
  }
  const t = core?.type;
  if (!t) return null;
  if (t !== "seq" && t !== "SEQ") return null;
  const parsed = [];
  for (const [key, v] of variantEntries) {
    const segs = parsePath(key);
    if (segs.length !== 2) return null;
    if (segs[0].kind !== "index" || segs[1].kind !== "index") return null;
    parsed.push({ key, v, choicePos: segs[0].value, altIdx: segs[1].value });
  }
  const choicePos = parsed[0].choicePos;
  if (parsed.some((p) => p.choicePos !== choicePos)) return null;
  const seqMembers = [...membersOf2(core)];
  const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
  const choice2 = seqMembers[resolvedPos];
  if (!choice2 || choice2.type !== "choice" && choice2.type !== "CHOICE") return null;
  const choiceMembers = membersOf2(choice2);
  const anyEmpty = parsed.some((p) => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]));
  if (!anyEmpty) return null;
  const parentKind = getCurrentRuleKind();
  if (!parentKind) return null;
  const refs = [];
  const isUpperCase = core.type === core.type.toUpperCase();
  const wrapInPrecStack2 = (body) => {
    let wrapped = body;
    for (let i = precStack.length - 1; i >= 0; i--) {
      wrapped = reconstructPrec(precStack[i], wrapped);
    }
    return wrapped;
  };
  for (const p of parsed) {
    const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
    const altContent = choiceMembers[resolvedAlt];
    const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m);
    const hoistedSeq = reconstructContainer(core, hoistedMembers);
    const hoistedBody = wrapInPrecStack2(hoistedSeq);
    const visibleName = `${parentKind}_${p.v.name}`;
    registerPolymorphVariant(parentKind, p.v.name);
    registerSyntheticRule(visibleName, hoistedBody);
    refs.push({
      type: isUpperCase ? "SYMBOL" : "symbol",
      name: visibleName
    });
  }
  const variantNames = parsed.map((p) => `${parentKind}_${p.v.name}`);
  registerConflict(variantNames);
  for (const n of variantNames) registerConflict([n]);
  const newChoice = reconstructContainer(choice2, refs);
  return { rule: newChoice, consumed: new Set(parsed.map((p) => p.key)) };
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
var wrapInPrec = (content, precStack) => wrapInPrecStack(content, precStack, reconstructPrec);
function resolvePatch(patch, originalMember, precStack) {
  if (isFieldPlaceholder(patch)) {
    let content = originalMember;
    if (isFieldLike(content) && content.source === "inferred") {
      content = content.content;
    }
    const maybeSymbolized = maybeKeywordSymbol(
      patch.name,
      content,
      (body) => wrapInPrec(body, precStack)
    );
    if (maybeSymbolized !== content) {
      content = maybeSymbolized;
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
    registerPolymorphVariant(parentKind, patch.name);
    const fullName = `${parentKind}_${patch.name}`;
    const hiddenName = "_" + fullName;
    return registerAliasedVariant(hiddenName, fullName, originalMember, (body) => wrapInPrec(body, precStack));
  }
  if (isAliasPlaceholder(patch)) {
    const hiddenName = "_" + patch.name;
    return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
  }
  return patch;
}

// packages/codegen/src/dsl/enrich.ts
function enrich(base2) {
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const rulesBag = ("grammar" in base2 ? base2.grammar?.rules : base2.rules) ?? {};
  const enrichOverrides = {};
  for (const name of Object.keys(rulesBag)) {
    enrichOverrides[name] = function(_$, original) {
      return applyEnrichPasses(name, original);
    };
  }
  Object.defineProperty(base2, "__enrichOverrides__", {
    value: enrichOverrides,
    enumerable: false,
    configurable: true,
    writable: false
  });
  return base2;
}
function applyEnrichPasses(ruleName, rule) {
  let r = rule;
  r = applyKindToNameViaTransform(ruleName, r);
  r = applyBareKeywordViaTransform(ruleName, r);
  r = applyOptionalKeywordViaTransform(ruleName, r);
  return r;
}
function typeEq(t, lower) {
  return typeof t === "string" && (t === lower || t === lower.toUpperCase());
}
function isSeqType(t) {
  return typeEq(t, "seq");
}
function isStringType(t) {
  return typeEq(t, "string");
}
function isSymbolType(t) {
  return typeEq(t, "symbol");
}
function isFieldType(t) {
  return typeEq(t, "field");
}
function isOptionalType(t) {
  return typeEq(t, "optional");
}
function isChoiceType(t) {
  return typeEq(t, "choice");
}
function isRepeatType(t) {
  return typeEq(t, "repeat") || typeEq(t, "repeat1");
}
function normalizeMember(m) {
  if (typeof m === "string") return { type: "STRING", value: m };
  if (m instanceof RegExp) return { type: "PATTERN", value: m.source };
  return m ?? { type: "UNKNOWN" };
}
function collectFieldNamesRuntime(rule) {
  const names = /* @__PURE__ */ new Set();
  if (!isSeqType(rule.type)) return names;
  const members = rule.members;
  for (const raw of members) {
    const m = normalizeMember(raw);
    if (isFieldType(m.type) && typeof m.name === "string") {
      names.add(m.name);
      continue;
    }
    const peeled = peelOptional(m);
    if (peeled.isOptional) {
      const innerN = normalizeMember(peeled.inner);
      if (isFieldType(innerN.type) && typeof innerN.name === "string") {
        names.add(innerN.name);
      }
    }
  }
  return names;
}
function applyKindToNameViaTransform(ruleName, rule) {
  if (!isSeqType(rule.type)) return rule;
  const raw = rule.members;
  const members = raw.map(normalizeMember);
  const kindCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    if (isSymbolType(m.type) && typeof m.name === "string") {
      kindCounts.set(m.name, (kindCounts.get(m.name) ?? 0) + 1);
    }
  }
  const existing = collectFieldNamesRuntime(rule);
  const patches = {};
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (!isSymbolType(m.type) || typeof m.name !== "string") continue;
    const k = m.name;
    if (k.startsWith("_")) continue;
    if ((kindCounts.get(k) ?? 0) > 1) continue;
    if (existing.has(k)) {
      reportSkip("kind-to-name", ruleName, `field '${k}' already exists`);
      continue;
    }
    existing.add(k);
    patches[String(i)] = field(k);
  }
  if (Object.keys(patches).length === 0) return rule;
  return transform(rule, patches);
}
function applyOptionalKeywordViaTransform(ruleName, rule) {
  const patches = {};
  collectOptionalKeywordPatches(ruleName, rule, "", patches);
  if (Object.keys(patches).length === 0) return rule;
  return transform(rule, patches);
}
function peelOptional(rule) {
  if (isOptionalType(rule.type)) {
    return { inner: rule.content, isOptional: true };
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    if (members.length === 2) {
      const blankIdx = members.findIndex((m) => m.type === "BLANK" || m.type === "blank");
      if (blankIdx !== -1) {
        const inner = members[1 - blankIdx];
        return { inner, isOptional: true };
      }
    }
  }
  return { inner: rule, isOptional: false };
}
function collectOptionalKeywordPatches(ruleName, rule, prefix, patches) {
  if (isSeqType(rule.type)) {
    const raw = rule.members;
    const claimed = collectFieldNamesRuntime(rule);
    for (let i = 0; i < raw.length; i++) {
      const m = normalizeMember(raw[i]);
      const peeled = peelOptional(m);
      if (peeled.isOptional) {
        const innerN = normalizeMember(peeled.inner);
        if (isStringType(innerN.type)) {
          const kw = innerN.value;
          if (typeof kw === "string" && isIdentifierShaped(kw)) {
            if (claimed.has(kw)) {
              reportSkip("optional-keyword-prefix", ruleName, `field '${kw}' already exists`);
              continue;
            }
            claimed.add(kw);
            let innerPath;
            if (isOptionalType(m.type)) {
              innerPath = "0";
            } else {
              const cm = m.members;
              const strIdx = cm.findIndex((x) => {
                const n = normalizeMember(x);
                return n.type !== "BLANK" && n.type !== "blank";
              });
              innerPath = String(strIdx);
            }
            const fullPath = prefix ? `${prefix}/${i}/${innerPath}` : `${i}/${innerPath}`;
            patches[fullPath] = field(kw);
            continue;
          }
        }
      }
      const childPrefix = prefix ? `${prefix}/${i}` : `${i}`;
      collectOptionalKeywordPatches(ruleName, m, childPrefix, patches);
    }
    return;
  }
  if (isChoiceType(rule.type)) {
    const raw = rule.members;
    for (let i = 0; i < raw.length; i++) {
      const childPrefix = prefix ? `${prefix}/${i}` : `${i}`;
      const m = normalizeMember(raw[i]);
      collectOptionalKeywordPatches(ruleName, m, childPrefix, patches);
    }
    return;
  }
  if (isOptionalType(rule.type) || isRepeatType(rule.type) || isFieldType(rule.type)) {
    const inner = normalizeMember(rule.content);
    const childPrefix = prefix ? `${prefix}/0` : `0`;
    collectOptionalKeywordPatches(ruleName, inner, childPrefix, patches);
  }
}
function applyBareKeywordViaTransform(ruleName, rule) {
  if (!isSeqType(rule.type)) return rule;
  const raw = rule.members;
  const first = raw[0];
  if (first === void 0) return rule;
  const normFirst = normalizeMember(first);
  if (!isStringType(normFirst.type)) return rule;
  const kw = normFirst.value;
  if (typeof kw !== "string" || !isIdentifierShaped(kw)) return rule;
  const existing = collectFieldNamesRuntime(rule);
  if (existing.has(kw)) {
    reportSkip("bare-keyword-prefix", ruleName, `field '${kw}' already exists`);
    return rule;
  }
  return transform(
    rule,
    { 0: field(kw) }
  );
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
    // array_expression: polymorph split — auto-hoist includes `[`/`]`
    // in each alias body and uses INLINE alias (no new named hidden
    // rule), so tree-sitter's state machine doesn't have to reconcile
    // a new symbol against its auto-generated _repeat1 helpers.
    array_expression: ($, original) => transform(
      original,
      { 1: field("attributes") },
      { "2/_expression": field("elements") },
      { "2/0": variant("semi"), "2/1": variant("list") }
    ),
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
    // mod_item: two forms — `mod name;` (external) vs `mod name { ... }`
    // (inline). Variant-split so each form's template emits the
    // right terminator (trailing `;` vs `{...}` body).
    mod_item: ($, original) => transform(
      original,
      { 0: field("visibility_modifier") },
      { "3/0": variant("external"), "3/1": variant("inline") }
    ),
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
    // struct_item: three body shapes — brace (`{ ... }`), tuple
    // (`(...)` + `;`), unit (`;`). Auto-hoist each into a visible
    // variant so the trailing `;` on tuple/unit forms gets rendered
    // (the flat template dropped it because `;` is an anonymous
    // token not routed to any field).
    struct_item: ($, original) => transform(
      original,
      { 0: field("visibility_modifier") },
      { "4/0": variant("brace"), "4/1": variant("tuple"), "4/2": variant("unit") }
    ),
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
    // tuple_expression: flat list of expressions comma-separated.
    // Kind-match labels every `_expression` as `elements` without
    // capturing the `,` separators (same pattern as array_expression).
    tuple_expression: ($, original) => transform(original, {
      1: field("attributes"),
      "_expression": field("elements")
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
