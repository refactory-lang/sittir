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
  return t === "prec" || t === "PREC" || t === "prec_left" || t === "PREC_LEFT" || t === "prec_right" || t === "PREC_RIGHT" || t === "prec_dynamic" || t === "PREC_DYNAMIC";
}
function typeEq(t, lower) {
  return typeof t === "string" && (t === lower || t === lower.toUpperCase());
}
var isSeqType = (t) => typeEq(t, "seq");
var isChoiceType = (t) => typeEq(t, "choice");
var isOptionalType = (t) => typeEq(t, "optional");
var isFieldType = (t) => typeEq(t, "field");
var isSymbolType = (t) => typeEq(t, "symbol");
var isStringType = (t) => typeEq(t, "string");
var isPlainRepeatType = (t) => typeEq(t, "repeat");
var isRepeatType = (t) => typeEq(t, "repeat") || typeEq(t, "repeat1");
var isBlankType = (t) => typeEq(t, "blank");

// packages/codegen/src/dsl/transform/transform-path.ts
function dsl() {
  return globalThis;
}
function nativeRequired(name) {
  const fn = dsl()[name];
  if (typeof fn !== "function") {
    throw new Error(
      `transform: no global ${String(name)}() found \u2014 must be called inside a runtime that injects ${String(name)}() (sittir evaluate.ts or tree-sitter CLI)`
    );
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
    if (part === "_") {
      segments.push({ kind: "wildcard" });
    } else if (/^-?\d+$/.test(part)) {
      segments.push({ kind: "index", value: Number(part) });
    } else if (/^\([A-Za-z_][A-Za-z0-9_]*\)$/.test(part)) {
      segments.push({ kind: "kind-match", name: part.slice(1, -1) });
    } else if (/^[A-Za-z_][A-Za-z0-9_]*:$/.test(part)) {
      segments.push({ kind: "fieldName", name: part.slice(0, -1) });
    } else if (part === "*") {
      throw new Error(`parsePath: path segment '*' is no longer valid \u2014 use '_' for wildcard; see ADR-0010`);
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
      throw new Error(
        `parsePath: bare kind name '${part}' is no longer valid as a path segment \u2014 use '(${part})' instead; see ADR-0010`
      );
    } else {
      throw new Error(
        `parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index, '_' (wildcard), '(name)' (kind-match), or 'name:' (field traversal)`
      );
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
    return descendThroughPrecWrapper(rule, segments, patch, precStack);
  }
  const [head, ...rest] = segments;
  const t = rule.type;
  switch (head.kind) {
    case "kind-match":
      return dispatchKindMatch(rule, head.name, rest, patch, precStack);
    case "fieldName":
      return descendThroughNamedField(rule, head.name, rest, patch, precStack);
    case "index":
    case "wildcard": {
      if (isContainerType(t)) {
        return applyToMembers(rule, head, rest, patch, precStack);
      }
      if (isWrapperType(t)) {
        return descendThroughSingleWrapper(rule, head, rest, patch, precStack);
      }
      if (t === "alias" || t === "ALIAS") {
        return descendThroughAlias(rule, head, rest, patch, precStack);
      }
      throw new ApplyPathSkip(
        `applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(`applyPath: unknown segment kind '${_exhaustive.kind}'`);
    }
  }
}
function descendThroughPrecWrapper(rule, segments, patch, precStack) {
  const newStack = precStack ? [...precStack, rule] : [rule];
  const newContent = applyPath(contentOf(rule), segments, patch, newStack);
  return reconstructPrec(rule, newContent);
}
function descendThroughSingleWrapper(rule, head, rest, patch, precStack) {
  switch (head.kind) {
    case "wildcard": {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructWrapper(rule, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf(rule), rest, patch, precStack);
        return reconstructWrapper(rule, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
    }
    case "kind-match":
    case "fieldName": {
      throw new Error(
        `descendThroughSingleWrapper: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(
        `descendThroughSingleWrapper: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`
      );
    }
  }
}
function descendThroughAlias(rule, head, rest, patch, precStack) {
  switch (head.kind) {
    case "wildcard": {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructAlias(rule, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf(rule), rest, patch, precStack);
        return reconstructAlias(rule, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
    }
    case "kind-match":
    case "fieldName": {
      throw new Error(
        `descendThroughAlias: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(
        `descendThroughAlias: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`
      );
    }
  }
}
function reconstructAlias(rule, newContent) {
  return {
    ...rule,
    content: newContent
  };
}
function descendThroughNamedField(rule, fieldName, rest, patch, precStack) {
  if (!isFieldType(rule.type)) {
    throw new Error(
      `applyPath: path segment '${fieldName}:' at this level expects a field('${fieldName}', ...) wrapper; got type '${rule.type}'`
    );
  }
  const actualName = rule.name;
  if (actualName !== fieldName) {
    throw new Error(
      `applyPath: path segment '${fieldName}:' doesn't match field name '${actualName}' at this position`
    );
  }
  const newContent = applyPath(contentOf(rule), rest, patch, precStack);
  return reconstructWrapper(rule, newContent);
}
function dispatchKindMatch(rule, kindName, rest, patch, precStack) {
  return applyKindMatch(rule, kindName, rest, patch, precStack, false);
}
function applyKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField) {
  const result = walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField);
  if (!result.matched) {
    throw new ApplyPathSkip(`applyPath: kind '${targetKind}' matched zero occurrences in this subtree`);
  }
  return result.rule;
}
function applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField) {
  const name = rule.name;
  if (name !== targetKind) return { rule, matched: false };
  if (insideNamedField) return { rule, matched: false };
  const patched = rest.length === 0 ? typeof patch === "function" ? patch(rule, precStack) : patch : applyPath(rule, rest, patch, precStack);
  return { rule: patched, matched: true };
}
function walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField) {
  if (!isWalkableNode(rule)) {
    return { rule, matched: false };
  }
  const t = rule.type;
  if (isPrecWrapper(rule)) {
    const stack = precStack ? [...precStack, rule] : [rule];
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, stack, insideNamedField);
    return {
      rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (t === "symbol" || t === "SYMBOL") {
    return applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField);
  }
  if (t === "field" || t === "FIELD") {
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, true);
    return {
      rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (isWrapperType(t)) {
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, insideNamedField);
    return {
      rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
      matched: inner.matched
    };
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
    return {
      rule: anyMatched ? reconstructContainer(rule, members) : rule,
      matched: anyMatched
    };
  }
  return { rule, matched: false };
}
function isWalkableNode(rule) {
  return rule !== null && rule !== void 0 && typeof rule === "object" && typeof rule.type === "string";
}
function reconstructContainer(rule, members) {
  const t = rule.type;
  if (isSeqType(t)) return nativeRequired("seq")(...members);
  if (isChoiceType(t)) return nativeRequired("choice")(...members);
  throw new Error(`reconstructContainer: unknown container type '${t}'`);
}
function reconstructWrapper(rule, newContent) {
  const t = rule.type;
  if (t === "optional") return nativeRequired("optional")(newContent);
  if (t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1") {
    return reconstructRepeatWithMetadata(rule, newContent);
  }
  if (isFieldType(t)) {
    const name = rule.name;
    return nativeRequired("field")(name, newContent);
  }
  throw new Error(
    `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' \u2014 this is a bug in the path-descent logic.`
  );
}
function reconstructRepeatWithMetadata(rule, newContent) {
  const r = rule;
  const t = r.type;
  const baseNode = nativeRequired(t === "repeat" || t === "REPEAT" ? "repeat" : "repeat1")(newContent);
  if (r.separator !== void 0) baseNode.separator = r.separator;
  if (r.leading !== void 0) baseNode.leading = r.leading;
  if (r.trailing !== void 0) baseNode.trailing = r.trailing;
  return baseNode;
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
function wrapInPrecStack(content, precStack, reconstructPrec2) {
  if (!precStack?.length) return content;
  let result = content;
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = reconstructPrec2(precStack[i], result);
  }
  return result;
}
function applyToMembers(rule, head, rest, patch, precStack) {
  const members = [...membersOf(rule)];
  switch (head.kind) {
    case "index":
      return applyToIndexedMember(rule, members, head.value, rest, patch, precStack);
    case "wildcard":
      return applyWildcardToMembers(rule, members, rest, patch, precStack);
    case "kind-match":
    case "fieldName": {
      throw new Error(`applyToMembers: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
    default: {
      const _exhaustive = head;
      throw new Error(
        `applyToMembers: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`
      );
    }
  }
}
function applyToIndexedMember(rule, members, indexValue, rest, patch, precStack) {
  const idx = indexValue < 0 ? members.length + indexValue : indexValue;
  if (idx < 0 || idx >= members.length) {
    throw new ApplyPathSkip(`applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`);
  }
  members[idx] = applyPath(members[idx], rest, patch, precStack);
  return reconstructContainer(rule, members);
}
function applyWildcardToMembers(rule, members, rest, patch, precStack) {
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
    throw new ApplyPathSkip(
      `applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`
    );
  }
  return reconstructContainer(rule, members);
}

// packages/codegen/src/dsl/primitives/variant.ts
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name) {
  return { __sittirPlaceholder: "variant", name };
}

// packages/codegen/src/dsl/primitives/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}
function alias(rule, value) {
  if (typeof rule === "string" && value === void 0) {
    return {
      __sittirPlaceholder: "alias",
      name: rule
    };
  }
  const native = globalThis.alias;
  if (typeof native !== "function") {
    throw new Error(
      "alias(): no global alias() found \u2014 must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  if (value !== void 0) {
    return native(rule, value);
  }
  return native(rule, rule);
}

// packages/codegen/src/dsl/wire/auto-groups.ts
function applyAutoGroups(base2, outRules, context, authoredSynthesisKinds = /* @__PURE__ */ new Set()) {
  if (!base2) return;
  const hasWrapper = "grammar" in base2 && base2.grammar !== void 0;
  const rulesBag = hasWrapper ? base2.grammar?.rules : base2.rules;
  if (!rulesBag) return;
  const dedupe = {};
  const synthRules = {};
  const rewrites = {};
  for (const name of Object.keys(rulesBag)) {
    if (authoredSynthesisKinds.has(name)) continue;
    if (context.authoredRuleNames.has(name)) continue;
    const rule = rulesBag[name];
    if (!rule) continue;
    const state = { opt: 0, rep: 0 };
    let next = rule;
    next = synthesizeOptionalGroups(next, synthRules, name, state, dedupe);
    next = synthesizeRepeatGroups(next, synthRules, name, state, dedupe);
    if (next !== rule) {
      rewrites[name] = next;
    }
  }
  for (const synName of Object.keys(synthRules)) {
    if (synName in outRules || synName in rulesBag) continue;
    outRules[synName] = makeStaticRuleFn(synthRules[synName]);
    context.syntheticInline.add(synName);
  }
  for (const parentName of Object.keys(rewrites)) {
    outRules[parentName] = makeStaticRuleFn(rewrites[parentName]);
  }
}
function makeStaticRuleFn(body) {
  return function staticAutoGroupRule() {
    return body;
  };
}
function synthesizeOptionalGroups(rule, synthRules, parentKind, state, dedupe) {
  const recursed = recurseChildren(
    rule,
    (r) => synthesizeOptionalGroups(r, synthRules, parentKind, state, dedupe)
  );
  if (isOptionalType(recursed.type)) {
    const content = recursed.content;
    if (!content || typeof content !== "object") return recursed;
    if (!isSeqType(content.type)) return recursed;
    const synName = synthesizeGroupName(content, parentKind, "optional", state, dedupe);
    if (!(synName in synthRules)) synthRules[synName] = content;
    const symbolRef = {
      type: detectCase(recursed) === "upper" ? "SYMBOL" : "symbol",
      name: synName,
      source: "group-lift"
    };
    return { ...recursed, content: symbolRef };
  }
  if (isChoiceType(recursed.type)) {
    const members = recursed.members;
    if (!Array.isArray(members) || members.length !== 2) return recursed;
    const blankIdx = members.findIndex((m) => isBlankType(m?.type));
    const seqIdx = members.findIndex((m) => isSeqType(m.type));
    if (blankIdx === -1 || seqIdx === -1 || blankIdx === seqIdx) return recursed;
    const seqMember = members[seqIdx];
    const synName = synthesizeGroupName(seqMember, parentKind, "optional", state, dedupe);
    if (!(synName in synthRules)) synthRules[synName] = seqMember;
    const symbolRef = {
      type: detectCase(recursed) === "upper" ? "SYMBOL" : "symbol",
      name: synName,
      source: "group-lift"
    };
    const newMembers = members.slice();
    newMembers[seqIdx] = symbolRef;
    return { ...recursed, members: newMembers };
  }
  return recursed;
}
function synthesizeRepeatGroups(rule, synthRules, parentKind, state, dedupe) {
  const recursed = recurseChildren(
    rule,
    (r) => synthesizeRepeatGroups(r, synthRules, parentKind, state, dedupe)
  );
  if (!isRepeatType(recursed.type)) return recursed;
  const content = recursed.content;
  if (!content || typeof content !== "object") return recursed;
  const t = content.type;
  if (!isSeqType(t)) return recursed;
  const synName = synthesizeGroupName(content, parentKind, "repeat", state, dedupe);
  if (!(synName in synthRules)) {
    synthRules[synName] = content;
  }
  const symbolRef = {
    type: detectCase(recursed) === "upper" ? "SYMBOL" : "symbol",
    name: synName,
    source: "group-lift"
  };
  return { ...recursed, content: symbolRef };
}
function detectCase(referenceRule) {
  const t = referenceRule?.type ?? "";
  return t.length > 0 && t === t.toUpperCase() ? "upper" : "lower";
}
function synthesizeGroupName(content, parentKind, kind, state, dedupe) {
  const key = canonicalStringify(content);
  const existing = dedupe[key];
  if (existing !== void 0) return existing;
  const counterKey = kind === "optional" ? "opt" : "rep";
  state[counterKey] += 1;
  const n = state[counterKey];
  const name = `_${parentKind}_${kind}${n}`;
  dedupe[key] = name;
  return name;
}
function canonicalStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((v) => canonicalStringify(v)).join(",") + "]";
  }
  const obj = value;
  const keys = Object.keys(obj).sort();
  const parts = [];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "function" || typeof v === "undefined") continue;
    parts.push(JSON.stringify(k) + ":" + canonicalStringify(v));
  }
  return "{" + parts.join(",") + "}";
}
function recurseChildren(rule, visit) {
  if (!rule || typeof rule !== "object") return rule;
  const t = rule.type;
  if (!t) return rule;
  if (isSeqType(t) || isChoiceType(t)) {
    const members = rule.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = visit(m);
      if (out !== m) changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : rule;
  }
  if (isOptionalType(t) || isRepeatType(t) || isFieldType(t) || isPrecWrapper(rule) || t === "alias" || t === "ALIAS" || t === "token" || t === "TOKEN" || t === "immediate_token" || t === "IMMEDIATE_TOKEN" || t === "group" || t === "variant" || t === "clause") {
    const content = rule.content;
    if (content === void 0) return rule;
    const out = visit(content);
    if (out === content) return rule;
    return { ...rule, content: out };
  }
  if (t === "polymorph") {
    const forms = rule.forms;
    if (!Array.isArray(forms)) return rule;
    let changed = false;
    const newForms = forms.map((f) => {
      const out = visit(f.content);
      if (out === f.content) return f;
      changed = true;
      return { ...f, content: out };
    });
    return changed ? { ...rule, forms: newForms } : rule;
  }
  return rule;
}

// packages/codegen/src/dsl/wire/wire.ts
var currentContext = null;
function wireRegisterSyntheticRule(name, content) {
  if (!currentContext) return false;
  currentContext.deposits.set(name, content);
  return true;
}
function wireRegisterSyntheticInline(name) {
  if (!currentContext) return false;
  if (currentContext.authoredRuleNames.has(name)) return false;
  currentContext.syntheticInline.add(name);
  return true;
}
function wireRegisterPolymorphVariant(parent, child) {
  if (!currentContext) return false;
  const exists = currentContext.polymorphVariants.some((v) => v.parent === parent && v.child === child);
  if (!exists) {
    currentContext.polymorphVariants.push({ parent, child });
  }
  return true;
}
function wireRegisterConflict(names) {
  if (!currentContext) return false;
  if (names.length === 0) return true;
  const key = names.join("\0");
  const exists = currentContext.conflictGroups.some((g) => g.join("\0") === key);
  if (!exists) {
    currentContext.conflictGroups.push([...names]);
  }
  return true;
}
function wireGetCurrentRuleKind() {
  return currentContext?.currentRuleKind ?? null;
}
function wire(config2, base2) {
  const context = {
    deposits: /* @__PURE__ */ new Map(),
    syntheticInline: /* @__PURE__ */ new Set(),
    polymorphVariants: [],
    conflictGroups: [],
    refineForms: /* @__PURE__ */ new Map(),
    groups: config2.groups,
    polymorphsConfig: config2.polymorphs,
    renderAs: config2.renderAs,
    currentRuleKind: null,
    authoredRuleNames: new Set(Object.keys(config2.rules))
  };
  const polymorphs = config2.polymorphs ?? {};
  const transforms = config2.transforms ?? {};
  const outRules = { ...config2.rules };
  composeOrSynthesizeTransformParents(outRules, transforms);
  composeOrSynthesizePolymorphParents(outRules, polymorphs, context);
  injectHiddenRulePlaceholders(outRules, polymorphs, context);
  injectTransformHiddenRulePlaceholders(outRules, transforms, context);
  if (base2 && config2.groups && hasBodyPatternGroups(config2.groups)) {
    const baseRules = base2.grammar?.rules ?? base2.rules ?? {};
    for (const baseName of Object.keys(baseRules)) {
      if (baseName in outRules) continue;
      outRules[baseName] = passthroughBaseRuleFn;
    }
  }
  wrapAllRuleFns(outRules, context);
  applyWirePatternReplacement(outRules, context.authoredRuleNames, config2.groups, context);
  if (base2) {
    const authoredSynthesisKinds = collectAuthoredSynthesisKinds(
      transforms,
      polymorphs,
      config2.groups
    );
    applyAutoGroups(
      base2,
      outRules,
      context,
      authoredSynthesisKinds
    );
    applyWirePatternReplacement(outRules, context.authoredRuleNames, config2.groups, context);
  }
  const conflicts = wrapConflictsCallback(config2.conflicts, context);
  const inline = wrapInlineCallback(config2.inline, context);
  const wired = {
    ...config2,
    rules: outRules,
    ...conflicts === void 0 ? {} : { conflicts },
    ...inline === void 0 ? {} : { inline }
  };
  Object.defineProperty(wired, "__wireContext__", {
    value: context,
    enumerable: false,
    configurable: true
  });
  return wired;
}
function collectAuthoredSynthesisKinds(transforms, polymorphs, groups) {
  const kinds = /* @__PURE__ */ new Set();
  for (const k of Object.keys(transforms)) kinds.add(k);
  for (const k of Object.keys(polymorphs)) kinds.add(k);
  if (groups) {
    for (const [k, v] of Object.entries(groups)) {
      if (typeof v === "function") continue;
      kinds.add(k);
    }
  }
  return kinds;
}
function composeOrSynthesizePolymorphParents(rules, polymorphs, context) {
  for (const [parent, armMap] of Object.entries(polymorphs)) {
    if (!armMap) continue;
    const userFn = rules[parent];
    rules[parent] = buildPolymorphParentFn(parent, armMap, userFn, context);
  }
}
function buildPolymorphParentFn(parent, armMap, userFn, context) {
  const patches = {};
  for (const [path, suffix] of Object.entries(armMap)) {
    patches[path] = variant(suffix);
  }
  const isHidden = parent.startsWith("_");
  return function wiredPolymorphParent($, original) {
    let base2;
    if (userFn) {
      base2 = userFn.call(this, $, original);
    } else if (isHidden && context.deposits.has(parent)) {
      base2 = context.deposits.get(parent);
    } else {
      base2 = original;
    }
    return transform(base2, patches);
  };
}
function injectHiddenRulePlaceholders(rules, polymorphs, context) {
  for (const [parent, armMap] of Object.entries(polymorphs)) {
    if (!armMap) continue;
    for (const suffix of Object.values(armMap)) {
      const hiddenName = polymorphHiddenName(parent, suffix);
      if (hiddenName in rules) continue;
      rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    }
  }
}
function polymorphVisibleName(parentKind, suffix) {
  const visibleParent = parentKind.startsWith("_") ? parentKind.slice(1) : parentKind;
  return `${visibleParent}_${suffix}`;
}
function polymorphHiddenName(parentKind, suffix) {
  return `_${polymorphVisibleName(parentKind, suffix)}`;
}
function composeOrSynthesizeTransformParents(rules, transforms) {
  for (const [kind, entry] of Object.entries(transforms)) {
    if (!entry) continue;
    const patchSets = Array.isArray(entry) ? entry : [entry];
    const userFn = rules[kind];
    rules[kind] = buildTransformParentFn(patchSets, userFn);
  }
}
function buildTransformParentFn(patchSets, userFn) {
  return function wiredTransformParent($, original) {
    const base2 = userFn ? userFn.call(this, $, original) : original;
    return transform(base2, ...patchSets);
  };
}
function injectTransformHiddenRulePlaceholders(rules, transforms, context) {
  for (const [kind, entry] of Object.entries(transforms)) {
    if (!entry) continue;
    const patchSets = Array.isArray(entry) ? entry : [entry];
    for (const patchMap of patchSets) {
      for (const value of Object.values(patchMap)) {
        registerHiddenRuleForPlaceholder(value, kind, rules, context);
      }
    }
  }
}
function registerHiddenRuleForPlaceholder(value, parentKind, rules, context) {
  if (isFieldPlaceholder(value)) {
    const hiddenName = `_kw_${value.name}`;
    if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
  if (isVariantPlaceholder(value)) {
    const hiddenName = `_${parentKind}_${value.name}`;
    if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
  if (isAliasPlaceholder(value)) {
    const hiddenName = `_${value.name}`;
    if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
}
function makeDeferredContentFn(context, hiddenName) {
  return function deferredHiddenRule(_$, previous) {
    const body = context.deposits.get(hiddenName);
    if (body) return body;
    if (previous !== void 0) return previous;
    const blankFn = globalThis.blank;
    return blankFn ? blankFn() : { type: "BLANK" };
  };
}
function wrapAllRuleFns(rules, context) {
  for (const [name, fn] of Object.entries(rules)) {
    rules[name] = wrapOneRuleFn(name, fn, context);
  }
}
function wrapOneRuleFn(name, fn, context) {
  return function wiredRuleFn($, previous) {
    const prevContext = currentContext;
    const prevKind = context.currentRuleKind;
    currentContext = context;
    context.currentRuleKind = name;
    try {
      return fn.call(this, $, previous);
    } finally {
      context.currentRuleKind = prevKind;
      currentContext = prevContext;
    }
  };
}
function wrapConflictsCallback(userConflicts, context) {
  return buildWiredConflictsFn(userConflicts, context);
}
function wrapInlineCallback(userInline, context) {
  return buildWiredInlineFn(userInline, context);
}
function buildWiredConflictsFn(userConflicts, context) {
  return function wiredConflicts($, previous) {
    const base2 = userConflicts ? userConflicts.call(this, $, previous) : previous ?? [];
    if (context.conflictGroups.length === 0) return base2;
    const symbolized = context.conflictGroups.map((group) => group.map((name) => symbolizeRef($, name)));
    return [...base2, ...symbolized];
  };
}
function buildWiredInlineFn(userInline, context) {
  return function wiredInline($, previous) {
    const base2 = userInline ? userInline.call(this, $, previous) : previous ?? [];
    if (context.syntheticInline.size === 0) return base2;
    const existingNames = collectInlineNames(base2);
    const appended = [];
    for (const name of context.syntheticInline) {
      if (existingNames.has(name)) continue;
      appended.push(nativeInlineRef($, name));
    }
    return appended.length === 0 ? base2 : [...base2, ...appended];
  };
}
function collectInlineNames(entries) {
  const names = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const symbol = entry;
    if ((symbol.type === "symbol" || symbol.type === "SYMBOL") && typeof symbol.name === "string") {
      names.add(symbol.name);
    }
  }
  return names;
}
function nativeInlineRef($, name) {
  const nativeSymbol = globalThis.symbol;
  if (typeof nativeSymbol === "function") return nativeSymbol(name);
  return $[name];
}
function symbolizeRef(_$, name) {
  return { type: "SYMBOL", name };
}
function hasBodyPatternGroups(groups) {
  for (const value of Object.values(groups)) {
    if (typeof value === "function") return true;
  }
  return false;
}
function passthroughBaseRuleFn(_$, previous) {
  return previous;
}
function makeSimpleDollarProxy() {
  return new Proxy({}, {
    get(_target, name) {
      return { type: "SYMBOL", name };
    }
  });
}
function isComplexBodyRt(rule) {
  const r = rule;
  const t = r.type;
  if (typeEq(t, "seq") || typeEq(t, "choice")) {
    return Array.isArray(r.members) && r.members.length >= 2;
  }
  if (typeEq(t, "repeat") || typeEq(t, "repeat1")) {
    const c = r.content;
    if (!c || typeof c.type !== "string") return false;
    return !typeEq(c.type, "string") && !typeEq(c.type, "symbol") && !typeEq(c.type, "pattern");
  }
  return false;
}
function unwrapOptionalChoiceRt(node) {
  if (!node || typeof node !== "object") return node;
  const r = node;
  if (isChoiceType(r.type) && Array.isArray(r.members) && r.members.length === 2) {
    const blankIdx = r.members.findIndex((m) => isBlankType(m?.type));
    if (blankIdx !== -1) return { type: "optional", content: r.members[1 - blankIdx] };
  }
  return node;
}
function patternBodyEqual(aIn, bIn) {
  const a = unwrapOptionalChoiceRt(aIn);
  const b = unwrapOptionalChoiceRt(bIn);
  if (!a || typeof a !== "object") return a === b;
  if (!b || typeof b !== "object") return false;
  const ra = a;
  const rb = b;
  if (!typeEq(ra.type, rb.type.toLowerCase())) return false;
  const t = ra.type.toLowerCase();
  if (t === "string" || t === "pattern") return ra.value === rb.value;
  if (t === "symbol") return ra.name === rb.name;
  if (t === "blank") return true;
  if (t === "seq" || t === "choice") {
    const ma = ra.members;
    const mb = rb.members;
    if (!Array.isArray(ma) || !Array.isArray(mb)) return false;
    if (ma.length !== mb.length) return false;
    return ma.every((m, i) => patternBodyEqual(m, mb[i]));
  }
  if (t === "optional" || t === "repeat" || t === "repeat1") {
    return patternBodyEqual(ra.content, rb.content);
  }
  if (t === "field") {
    return ra.name === rb.name && patternBodyEqual(ra.content, rb.content);
  }
  if (t === "alias") {
    const raa = ra;
    const rba = rb;
    return raa.named === rba.named && raa.value === rba.value && patternBodyEqual(raa.content, rba.content);
  }
  return false;
}
function replaceInBodyRt(rule, candidates) {
  if (!rule || typeof rule !== "object") return rule;
  const r = rule;
  for (const c of candidates) {
    if (patternBodyEqual(rule, c.body)) {
      if (c.aliasAs !== void 0) {
        return c.uppercase ? {
          type: "ALIAS",
          content: { type: "SYMBOL", name: c.name },
          named: true,
          value: c.aliasAs
        } : {
          type: "alias",
          content: { type: "symbol", name: c.name, hidden: true },
          named: true,
          value: c.aliasAs
        };
      }
      return c.uppercase ? { type: "SYMBOL", name: c.name } : { type: "symbol", name: c.name, hidden: true };
    }
  }
  const t = r.type.toLowerCase();
  if (t === "seq" || t === "choice") {
    const members = r.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const replaced = replaceInBodyRt(m, candidates);
      if (replaced !== m) changed = true;
      return replaced;
    });
    return changed ? { ...r, members: newMembers } : rule;
  }
  if (t === "optional" || t === "repeat" || t === "repeat1" || t === "field" || t === "prec" || t === "prec_left" || t === "prec_right" || t === "prec_dynamic" || t === "token") {
    const newContent = replaceInBodyRt(r.content, candidates);
    return newContent !== r.content ? { ...r, content: newContent } : rule;
  }
  return rule;
}
function buildPatternReplacingFn(fn, candidates) {
  return function patternReplacingRuleFn($, previous) {
    const result = fn.call(this, $, previous);
    return replaceInBodyRt(result, candidates);
  };
}
function applyWirePatternReplacement(rules, authoredRuleNames, groups, context) {
  const candidates = [];
  const $ = makeSimpleDollarProxy();
  for (const name of authoredRuleNames) {
    if (!name.startsWith("_")) continue;
    const fn = rules[name];
    if (!fn) continue;
    let body;
    try {
      const result = fn.call(void 0, $, void 0);
      if (!result || typeof result !== "object" || typeof result.type !== "string") continue;
      body = result;
    } catch {
      continue;
    }
    if (!isComplexBodyRt(body)) continue;
    const uppercase = body.type === body.type.toUpperCase();
    candidates.push({ name, body, uppercase });
  }
  if (groups) {
    for (const [key, value] of Object.entries(groups)) {
      if (typeof value !== "function") continue;
      if (key.startsWith("_")) {
        throw new Error(
          `groups['${key}']: body-pattern keys must be visible kind names (no leading underscore); codegen will create '_${key}' internally`
        );
      }
      const hiddenName = `_${key}`;
      let body;
      try {
        const result = value.call(void 0, $, void 0);
        if (!result || typeof result !== "object" || typeof result.type !== "string") {
          throw new Error(`groups['${key}']: body fn did not return a rule object`);
        }
        body = result;
      } catch (e) {
        throw new Error(`groups['${key}']: failed to evaluate body fn: ${e.message}`);
      }
      if (!isComplexBodyRt(body)) {
        throw new Error(
          `groups['${key}']: body is not a complex structural pattern (need SEQ \u22652, CHOICE \u22652, or REPEAT with non-trivial content)`
        );
      }
      const uppercase = body.type === body.type.toUpperCase();
      candidates.push({ name: hiddenName, body, uppercase, aliasAs: key });
      rules[hiddenName] = context ? wrapOneRuleFn(hiddenName, value, context) : value;
    }
  }
  if (candidates.length === 0) return;
  const candidateNames = new Set(candidates.map((c) => c.name));
  for (const [name, fn] of Object.entries(rules)) {
    if (candidateNames.has(name)) continue;
    rules[name] = buildPatternReplacingFn(fn, candidates);
  }
}

// packages/codegen/src/dsl/primitives/field.ts
function maybeKeywordSymbol(fieldName, content, wrapSyntheticBody) {
  const c = content;
  if (!c || typeof c.type !== "string") return content;
  if (isStringType(c.type)) {
    return synthesizeKwSymbol(fieldName, content, wrapSyntheticBody);
  }
  if (isOptionalType(c.type)) {
    return descendOptional(fieldName, content, wrapSyntheticBody, "optional");
  }
  if (isChoiceType(c.type)) {
    const members = content.members;
    if (Array.isArray(members) && members.length === 2) {
      const blankIdx = members.findIndex((m) => m?.type === "BLANK" || m?.type === "blank");
      if (blankIdx !== -1) {
        return descendOptional(fieldName, content, wrapSyntheticBody, "choice-blank");
      }
    }
    return content;
  }
  return content;
}
function synthesizeKwSymbol(fieldName, content, wrapSyntheticBody) {
  const c = content;
  const isUpperCase = c.type === "STRING";
  const hiddenName = `_kw_${fieldName}`;
  let body = content;
  if (wrapSyntheticBody) body = wrapSyntheticBody(body);
  if (!wireRegisterSyntheticRule(hiddenName, body)) {
    throw new Error(
      `field('${fieldName}', <STRING>): no active wire() context \u2014 call must occur inside a rule callback wrapped by wire()`
    );
  }
  wireRegisterSyntheticInline(hiddenName);
  return {
    type: isUpperCase ? "SYMBOL" : "symbol",
    name: hiddenName
  };
}
function descendOptional(fieldName, content, wrapSyntheticBody, wrapperKind) {
  let inner;
  if (wrapperKind === "optional") {
    inner = content.content;
  } else {
    const members = content.members;
    const nonBlank = members.find((m) => m.type !== "BLANK" && m.type !== "blank");
    inner = nonBlank;
  }
  const rewritten = maybeKeywordSymbol(fieldName, inner, wrapSyntheticBody);
  if (rewritten === inner) return content;
  if (wrapperKind === "optional") {
    const nativeOptional = globalThis.optional;
    if (typeof nativeOptional !== "function") return content;
    return nativeOptional(rewritten);
  }
  const c = content;
  const newMembers = c.members.map((m) => m.type === "BLANK" || m.type === "blank" ? m : rewritten);
  return { ...c, members: newMembers };
}
function isFieldPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "field";
}
function field(name, content) {
  if (content === void 0) {
    return {
      __sittirPlaceholder: "field",
      name
    };
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error(
      "field(): no global field() found \u2014 must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  return buildTwoArgFieldResult(native, name, content);
}
function buildTwoArgFieldResult(native, name, content) {
  const initial = native(name, content);
  const inner = initial.content;
  const symbolized = maybeKeywordSymbol(name, inner);
  if (symbolized !== inner) {
    const reconstructed = native(name, symbolized);
    return {
      ...reconstructed,
      source: "override"
    };
  }
  return { ...initial, source: "override" };
}

// packages/codegen/src/dsl/transform/transform.ts
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = requiresPathMode(patches);
    const hasPlaceholderAlias = Object.values(patches).some((v) => isAliasPlaceholder(v) || isVariantPlaceholder(v));
    if (hasPathKeys || hasPlaceholderAlias) {
      rule = applyPathPatches(rule, patches);
    } else {
      rule = applyFlatPatches(rule, patches);
    }
  }
  return rule;
}
function requiresPathMode(patches) {
  return Object.keys(patches).some((k) => !/^\d+$/.test(k));
}
function applyPathPatches(original, patches) {
  const { variantEntries, otherEntries } = partitionPatchesByVariant(patches);
  let rule = original;
  for (const [key, value] of otherEntries) {
    const segments = parsePath(String(key));
    rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  if (variantEntries.length > 0) {
    rule = applyVariantPatches(rule, variantEntries);
  }
  return rule;
}
function partitionPatchesByVariant(patches) {
  const variantEntries = [];
  const otherEntries = [];
  for (const entry of Object.entries(patches)) {
    const v = entry[1];
    if (isVariantPlaceholder(v)) variantEntries.push([entry[0], v]);
    else otherEntries.push(entry);
  }
  return { variantEntries, otherEntries };
}
function applyVariantPatches(rule, variantEntries) {
  const ordered = [...variantEntries].sort(([a], [b]) => parsePath(b).length - parsePath(a).length);
  const hoisted = tryHoistSiblingVariants(rule, ordered);
  if (hoisted) {
    let result2 = hoisted.rule;
    for (const [key, value] of ordered) {
      if (hoisted.consumed.has(key)) continue;
      const segments = parsePath(key);
      result2 = applyPath(result2, segments, (member, precStack) => resolvePatch(value, member, precStack));
    }
    return result2;
  }
  let result = rule;
  for (const [key, value] of ordered) {
    const segments = parsePath(key);
    result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  return result;
}
function tryHoistSiblingVariants(rule, variantEntries) {
  const { bail, precStack, core } = peelPrecWrappersFromRule(rule);
  const t = core.type;
  if (!t) return bail("core rule has no type after prec peeling");
  if (!isSeqType(t)) return bail(`core rule type '${t}' is not seq/SEQ`);
  const parsed = parseVariantPathsForHoist(variantEntries, bail);
  if (parsed === null) return null;
  const choicePos = parsed[0].choicePos;
  if (parsed.some((p) => p.choicePos !== choicePos))
    return bail(
      `variant patches target mixed choice positions (${parsed.map((p) => p.choicePos).join(",")}) \u2014 hoist needs all siblings at one choice`
    );
  const seqMembers = [...membersOf2(core)];
  const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
  const choice2 = seqMembers[resolvedPos];
  if (!choice2 || !isChoiceType(choice2.type))
    return bail(`position ${resolvedPos} is '${choice2?.type}', not choice/CHOICE`);
  const choiceMembers = membersOf2(choice2);
  const anyEmpty = parsed.some(
    (p) => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx])
  );
  if (!anyEmpty) return null;
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind) return bail("no current rule kind (variant()/transform() called outside rule callback?)");
  return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice2, parsed, parentKind, precStack);
}
function peelPrecWrappersFromRule(rule) {
  const dbg = typeof process !== "undefined" ? process?.env?.SITTIR_DEBUG : void 0;
  const kindFor = wireGetCurrentRuleKind() ?? "(unknown)";
  const bail = (reason) => {
    if (dbg) console.error(`[sittir] hoist skipped on '${kindFor}': ${reason}`);
    return null;
  };
  const precStack = [];
  let core = rule;
  while (core && isPrecWrapper(core)) {
    precStack.push(core);
    core = contentOf2(core);
  }
  return { bail, precStack, core };
}
function parseVariantPathsForHoist(variantEntries, bail) {
  const parsed = [];
  for (const [key, v] of variantEntries) {
    const segs = parsePath(key);
    if (segs.length !== 2) return bail(`variant patch '${key}' has ${segs.length} segments (expected 2: N/M)`);
    if (segs[0].kind !== "index" || segs[1].kind !== "index")
      return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`);
    parsed.push({ key, v, choicePos: segs[0].value, altIdx: segs[1].value });
  }
  return parsed;
}
function buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice2, parsed, parentKind, precStack) {
  const refs = [];
  const isUpperCase = core.type === core.type.toUpperCase();
  for (const p of parsed) {
    const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
    const altContent = choiceMembers[resolvedAlt];
    const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m);
    const hoistedSeq = reconstructContainer(core, hoistedMembers);
    const hoistedBody = wrapVariantBodyInParentPrec(hoistedSeq, precStack);
    const visibleName = polymorphVisibleName(parentKind, p.v.name);
    const hiddenName = polymorphHiddenName(parentKind, p.v.name);
    if (!wireRegisterPolymorphVariant(parentKind, p.v.name)) {
      throw new Error(
        `variant('${p.v.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`
      );
    }
    if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
      throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
    }
    refs.push({
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: visibleName
    });
  }
  registerHoistedVariantConflicts(parsed.map((p) => polymorphHiddenName(parentKind, p.v.name)));
  const newChoice = reconstructContainer(choice2, refs);
  return { rule: newChoice, consumed: new Set(parsed.map((p) => p.key)) };
}
function registerHoistedVariantConflicts(variantNames) {
  if (variantNames.length > 0 && !wireRegisterConflict(variantNames)) {
    throw new Error(`registerConflict: no active wire() context`);
  }
  for (const n of variantNames) {
    if (!wireRegisterConflict([n])) {
      throw new Error(`registerConflict: no active wire() context`);
    }
  }
}
var membersOf2 = (r) => r.members;
var contentOf2 = (r) => r.content;
function applyFlatPatches(original, patches) {
  const t = original.type;
  if (isSeqType(t)) {
    return applyFlatPatchesToSeq(original, patches);
  }
  if (isChoiceType(t)) {
    const newMembers = membersOf2(original).map((m) => applyFlatPatches(m, patches));
    return reconstructContainer(original, newMembers);
  }
  if (isPrecWrapper(original)) {
    return applyFlatPatchesThroughPrec(original, patches);
  }
  if (isWrapperType(t)) {
    const newContent = applyFlatPatches(contentOf2(original), patches);
    return reconstructWrapper(original, newContent);
  }
  return original;
}
function applyFlatPatchesThroughPrec(original, patches) {
  const newContent = applyFlatPatches(contentOf2(original), patches);
  return reconstructPrec(original, newContent);
}
function applyFlatPatchesToSeq(original, patches) {
  const members = [...membersOf2(original)];
  for (const [key, patch] of Object.entries(patches)) {
    if (!/^\d+$/.test(key)) {
      throw new Error(
        `transform: invalid flat-positional key '${key}' \u2014 keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`
      );
    }
    const index = Number(key);
    if (index >= members.length) {
      throw new Error(`transform: index ${index} out of bounds in ${original.type} of length ${members.length}`);
    }
    members[index] = resolvePatch(patch, members[index]);
  }
  return reconstructContainer(original, members);
}
var wrapInPrec = (content, precStack) => wrapInPrecStack(content, precStack, reconstructPrec);
function wrapVariantBodyInParentPrec(hoistedSeq, precStack) {
  return wrapInPrec(hoistedSeq, precStack);
}
function resolvePatch(patch, originalMember, precStack) {
  if (isFieldPlaceholder(patch)) {
    return resolveFieldPlaceholder(patch, originalMember, precStack);
  }
  if (isFieldLike(patch)) {
    return { ...patch, source: "override" };
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = wireGetCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    if (!wireRegisterPolymorphVariant(parentKind, patch.name)) {
      throw new Error(
        `variant('${patch.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`
      );
    }
    const visibleName = polymorphVisibleName(parentKind, patch.name);
    const hiddenName = polymorphHiddenName(parentKind, patch.name);
    return registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack));
  }
  if (isAliasPlaceholder(patch)) {
    return resolveAliasPlaceholder(patch, originalMember, precStack);
  }
  return patch;
}
function findInferredFieldThroughTransparentWrappers(node) {
  const r = node;
  if (!r || typeof r !== "object") return null;
  const t = r.type;
  if (!t) return null;
  const isSittirOptional = t === "optional" || t === "OPTIONAL";
  if (isSittirOptional) {
    const inner = r.content;
    if (!inner || typeof inner !== "object") return null;
    if (isFieldLike(inner) && (inner.source === "inferred" || inner.source === "enriched")) {
      return {
        found: inner,
        reconstruct: (newInner) => ({ ...r, content: newInner })
      };
    }
    const deeper = findInferredFieldThroughTransparentWrappers(inner);
    if (deeper) {
      return {
        found: deeper.found,
        reconstruct: (newInner) => ({ ...r, content: deeper.reconstruct(newInner) })
      };
    }
    return null;
  }
  if (isChoiceType(t)) {
    const members = r.members;
    if (!Array.isArray(members) || members.length !== 2) return null;
    const blankIdx = members.findIndex((m) => {
      const mt = m.type;
      return mt === "BLANK" || mt === "blank";
    });
    if (blankIdx === -1) return null;
    const contentIdx = 1 - blankIdx;
    const inner = members[contentIdx];
    if (!inner || typeof inner !== "object") return null;
    if (isFieldLike(inner) && (inner.source === "inferred" || inner.source === "enriched")) {
      return {
        found: inner,
        reconstruct: (newInner) => {
          const newMembers = [...members];
          newMembers[contentIdx] = newInner;
          return { ...r, members: newMembers };
        }
      };
    }
    const deeper = findInferredFieldThroughTransparentWrappers(inner);
    if (deeper) {
      return {
        found: deeper.found,
        reconstruct: (newInner) => {
          const newMembers = [...members];
          newMembers[contentIdx] = deeper.reconstruct(newInner);
          return { ...r, members: newMembers };
        }
      };
    }
    return null;
  }
  const isPrecWrapper2 = t === "prec" || t === "PREC" || t === "prec_left" || t === "PREC_LEFT" || t === "prec_right" || t === "PREC_RIGHT" || t === "prec_dynamic" || t === "PREC_DYNAMIC";
  if (isPrecWrapper2) {
    const inner = r.content;
    if (!inner || typeof inner !== "object") return null;
    if (isFieldLike(inner) && (inner.source === "inferred" || inner.source === "enriched")) {
      return {
        found: inner,
        reconstruct: (newInner) => ({ ...r, content: newInner })
      };
    }
    const deeper = findInferredFieldThroughTransparentWrappers(inner);
    if (deeper) {
      return {
        found: deeper.found,
        reconstruct: (newInner) => ({ ...r, content: deeper.reconstruct(newInner) })
      };
    }
    return null;
  }
  return null;
}
function resolveFieldPlaceholder(patch, originalMember, precStack) {
  let content = originalMember;
  if (isFieldLike(content) && (content.source === "enriched" || content.source === "inferred")) {
    const overrideName = patch.name;
    const enrichName = content.name ?? "(unknown)";
    if (overrideName === enrichName && !process.env.SITTIR_QUIET) {
      const parentKind = wireGetCurrentRuleKind() ?? "(unknown)";
      process.stderr.write(
        `transform: override field('${overrideName}') on '${parentKind}' wraps an enrich-labeled FIELD \u2014 duplicate name ('${overrideName}'). Drop the override entry; enrich will cover it automatically.
`
      );
    }
    content = content.content;
  } else {
    const nested = findInferredFieldThroughTransparentWrappers(originalMember);
    if (nested !== null) {
      const overrideName = patch.name;
      const renamedField = { ...nested.found, name: overrideName, source: "override" };
      const reconstructed = nested.reconstruct(renamedField);
      return reconstructed;
    }
  }
  const maybeSymbolized = maybeKeywordSymbol(patch.name, content, (body) => wrapInPrec(body, precStack));
  if (maybeSymbolized !== content) {
    content = maybeSymbolized;
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error(
      "transform: no global field() found \u2014 patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  const result = native(patch.name, content);
  return { ...result, source: "override" };
}
function resolveAliasPlaceholder(patch, originalMember, precStack) {
  const hiddenName = "_" + patch.name;
  return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
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
  if (!wireRegisterSyntheticRule(hiddenName, bodyWrapper(body))) {
    throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
  }
  const aliasNode = {
    type: isUpperCase ? "ALIAS" : "alias",
    content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
    named: true,
    value: aliasValue
  };
  if (factored) {
    const optional2 = globalThis.optional;
    if (typeof optional2 !== "function") {
      throw new Error(
        "transform: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()"
      );
    }
    return optional2(aliasNode);
  }
  return aliasNode;
}
function matchesEmpty(rule) {
  const t = rule.type;
  if (isBlankType(t)) return true;
  if (isOptionalType(t)) return true;
  if (isPlainRepeatType(t)) return true;
  if (isChoiceType(t)) {
    const members = rule.members;
    return members.some((m) => matchesEmpty(m));
  }
  if (isSeqType(t)) {
    const members = rule.members;
    return members.every((m) => matchesEmpty(m));
  }
  return false;
}
function factorOutEmptiness(rule) {
  if (!matchesEmpty(rule)) return null;
  return extractNonEmpty(rule);
}
function extractNonEmpty(rule) {
  const t = rule.type;
  if (isPlainRepeatType(t)) {
    const r = rule;
    const nonEmpty = {
      ...r,
      type: t === "REPEAT" ? "REPEAT1" : "repeat1"
    };
    return { nonEmpty };
  }
  if (isOptionalType(t)) {
    const inner = rule.content;
    return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
  }
  if (isChoiceType(t)) {
    const members = rule.members;
    const nonEmpty = members.filter((m) => !matchesEmpty(m));
    if (nonEmpty.length === 0) return null;
    if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
    return { nonEmpty: { type: t, members: nonEmpty } };
  }
  if (isSeqType(t)) {
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

// packages/codegen/src/dsl/enrich.ts
function enrich(base2) {
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const hasWrapper = "grammar" in base2;
  const rulesBag = hasWrapper ? base2.grammar?.rules : base2.rules;
  if (!rulesBag) return base2;
  const supertypeNames = extractSupertypeNames(base2, hasWrapper);
  const kwRules = {};
  const enrichedRules = {};
  for (const name of Object.keys(rulesBag)) {
    const rule = rulesBag[name];
    enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules, supertypeNames) : rule;
  }
  const mergedRules = { ...enrichedRules, ...kwRules };
  if (hasWrapper) {
    return { ...base2, grammar: { ...base2.grammar, rules: mergedRules } };
  }
  return {
    ...base2,
    rules: mergedRules
  };
}
function applyEnrichPasses(ruleName, rule, kwRules, supertypeNames) {
  const MAX_ITERATIONS = 8;
  let r = rule;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = applySymbolToField(ruleName, r, supertypeNames);
    r = applyOptionalKeyword(ruleName, r, kwRules);
    r = enrichFieldWrappers(r);
    r = enrichMultiplicityWrappers(r);
    if (r === before) return r;
  }
  if (!process.env.SITTIR_QUIET) {
    process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations
`);
  }
  return r;
}
function extractSupertypeNames(base2, hasWrapper) {
  const root = hasWrapper ? base2.grammar : base2;
  const supertypes = root?.supertypes;
  if (typeof supertypes === "function") {
    const dollar = new Proxy(
      {},
      {
        get(_t, prop) {
          if (typeof prop === "string") return { type: "SYMBOL", name: prop };
          return void 0;
        }
      }
    );
    let result;
    try {
      result = supertypes(dollar);
    } catch {
      return /* @__PURE__ */ new Set();
    }
    return harvestSupertypeNames(result);
  }
  if (Array.isArray(supertypes)) return harvestSupertypeNames(supertypes);
  return /* @__PURE__ */ new Set();
}
function harvestSupertypeNames(result) {
  const names = /* @__PURE__ */ new Set();
  if (!Array.isArray(result)) return names;
  for (const r of result) {
    if (typeof r === "string") {
      names.add(r);
      continue;
    }
    const n = r?.name;
    if (typeof n === "string") names.add(n);
  }
  return names;
}
function detectCase2(referenceRule) {
  const t = referenceRule?.type ?? "";
  return t.length > 0 && t === t.toUpperCase() ? "upper" : "lower";
}
function makeField(referenceRule, name, content) {
  propagateFieldName(content, name);
  return {
    type: detectCase2(referenceRule) === "upper" ? "FIELD" : "field",
    name,
    content,
    source: "enriched"
  };
}
function propagateFieldName(rule, fieldName) {
  if (!rule || typeof rule !== "object") return;
  const r = rule;
  if (r._ref && r._ref.fieldName === void 0) {
    r._ref.fieldName = fieldName;
  }
  const t = r.type;
  if (t === "seq" || t === "SEQ" || t === "choice" || t === "CHOICE") {
    if (Array.isArray(r.members)) for (const m of r.members) propagateFieldName(m, fieldName);
    return;
  }
  if (t === "optional" || t === "OPTIONAL" || t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1" || t === "prec" || t === "PREC" || t === "prec_left" || t === "PREC_LEFT" || t === "prec_right" || t === "PREC_RIGHT" || t === "prec_dynamic" || t === "PREC_DYNAMIC") {
    if (r.content !== void 0) propagateFieldName(r.content, fieldName);
    return;
  }
}
function makeSymbol(referenceRule, name) {
  return {
    type: detectCase2(referenceRule) === "upper" ? "SYMBOL" : "symbol",
    name
  };
}
function registerKwRule(hostRule, stringLiteral, keyword, kwRules) {
  const hiddenName = `_kw_${keyword}`;
  if (!(hiddenName in kwRules)) {
    kwRules[hiddenName] = stringLiteral;
  }
  return makeSymbol(hostRule, hiddenName);
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
function peelOptional(rule) {
  if (isOptionalType(rule.type)) {
    return {
      inner: rule.content,
      isOptional: true
    };
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
function isIdentifierShaped(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
function reportSkip(pass, ruleName, reason) {
  if (process.env.SITTIR_QUIET) return;
  process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})
`);
}
function isBareShapeTarget(member, target) {
  return target.symbolRule === member;
}
function detectSymbolTarget(member) {
  if (isSymbolType(member.type) && typeof member.name === "string") {
    const name = member.name;
    return {
      name,
      symbolRule: member,
      wrap: (fieldNode) => fieldNode
    };
  }
  const peeled = peelOptional(member);
  if (!peeled.isOptional) return null;
  const innerN = normalizeMember(peeled.inner);
  if (isSymbolType(innerN.type) && typeof innerN.name === "string") {
    return {
      name: innerN.name,
      symbolRule: peeled.inner,
      wrap: (fieldNode) => rebuildOptional(member, fieldNode)
    };
  }
  if (!isSeqType(innerN.type)) return null;
  const seqMembers = peeled.inner.members;
  let symIdx = -1;
  for (let i = 0; i < seqMembers.length; i++) {
    const sn2 = normalizeMember(seqMembers[i]);
    if (isSymbolType(sn2.type) && typeof sn2.name === "string") {
      if (symIdx !== -1) return null;
      symIdx = i;
    } else if (!isStringType(sn2.type) && sn2.type !== "PATTERN" && sn2.type !== "pattern") {
      return null;
    }
  }
  if (symIdx === -1) return null;
  const symMember = seqMembers[symIdx];
  const sn = normalizeMember(symMember);
  if (!isSymbolType(sn.type) || typeof sn.name !== "string") return null;
  const seqRule = peeled.inner;
  return {
    name: sn.name,
    symbolRule: symMember,
    wrap: (fieldNode) => {
      const newSeqMembers = seqMembers.map((mm, i) => i === symIdx ? fieldNode : mm);
      const newSeq = { ...seqRule, members: newSeqMembers };
      return rebuildOptional(member, newSeq);
    }
  };
}
function countSymbolsInRepeat(node, kindCounts, inRepeat = false) {
  if (!node) return;
  const t = node.type;
  if (!t) return;
  if (isFieldType(t)) return;
  if (t === "ALIAS" || t === "alias") return;
  if (isSymbolType(t)) {
    if (!inRepeat) return;
    const name = node.name;
    if (typeof name === "string") {
      kindCounts.set(name, (kindCounts.get(name) ?? 0) + 1);
    }
    return;
  }
  if (isRepeatType(t)) {
    const content = node.content;
    countSymbolsInRepeat(content, kindCounts, true);
    return;
  }
  if (isSeqType(t) || isChoiceType(t)) {
    const members = node.members;
    if (Array.isArray(members)) {
      for (const m of members) countSymbolsInRepeat(m, kindCounts, inRepeat);
    }
    return;
  }
  if (isOptionalType(t) || isPrecWrapper(node)) {
    const content = node.content;
    countSymbolsInRepeat(content, kindCounts, inRepeat);
    return;
  }
}
function applySymbolToField(ruleName, rule, supertypeNames) {
  if (ruleName.startsWith("_")) return rule;
  const precStack = [];
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isSeqType(cursor.type)) {
    return tryPromoteInRepeatSeq(ruleName, rule, cursor, precStack, supertypeNames);
  }
  const members = cursor.members;
  const directKindCounts = /* @__PURE__ */ new Map();
  const targetByIdx = members.map((m) => {
    const t = detectSymbolTarget(m);
    if (!t) return null;
    if (t.name.startsWith("_") && !isBareShapeTarget(m, t)) return null;
    return t;
  });
  for (const t of targetByIdx) {
    if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
  }
  const nestedRepeatCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    countSymbolsInRepeat(m, nestedRepeatCounts);
  }
  const existing = collectFieldNamesRuntime(cursor);
  const sequenceCounters = /* @__PURE__ */ new Map();
  let changed = false;
  const newMembers = members.map((m, i) => {
    const t = targetByIdx[i];
    if (!t) return m;
    let baseFieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return m;
      baseFieldName = t.name.slice(1);
    }
    if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
    const directCount = directKindCounts.get(t.name) ?? 0;
    let fieldName = baseFieldName;
    if (directCount > 1) {
      const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
      sequenceCounters.set(t.name, seqIdx);
      fieldName = `${baseFieldName}${seqIdx}`;
    }
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists`);
      return m;
    }
    existing.add(fieldName);
    changed = true;
    const fieldNode = makeField(cursor, fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  const combinedKindCounts = new Map(directKindCounts);
  for (const [k, v] of nestedRepeatCounts) {
    combinedKindCounts.set(k, (combinedKindCounts.get(k) ?? 0) + v);
  }
  const finalMembers = promoteInsideRepeatMembers(ruleName, newMembers, supertypeNames, existing, combinedKindCounts);
  if (finalMembers === newMembers && !changed) return rule;
  let result = { ...cursor, members: finalMembers };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = { ...precStack[i], content: result };
  }
  return result;
}
function promoteInsideRepeatMembers(ruleName, members, supertypeNames, existing, outerKindCounts) {
  let anyRepeatChanged = false;
  const result = members.map((m) => {
    const rebuilt = tryPromoteInRepeatMember(ruleName, m, supertypeNames, existing, outerKindCounts);
    if (rebuilt === null) return m;
    anyRepeatChanged = true;
    return rebuilt;
  });
  if (!anyRepeatChanged) return members;
  return result;
}
function tryPromoteInRepeatMember(ruleName, member, supertypeNames, existing, outerKindCounts) {
  let cursor = member;
  const memberPrecStack = [];
  while (isPrecWrapper(cursor)) {
    memberPrecStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isRepeatType(cursor.type)) return null;
  let inner = cursor.content;
  const innerPrecStack = [];
  while (isPrecWrapper(inner)) {
    innerPrecStack.push(inner);
    inner = inner.content;
  }
  if (!isSeqType(inner.type)) return null;
  const innerMembers = inner.members;
  const innerTargets = innerMembers.map((m) => {
    const t = detectSymbolTarget(m);
    if (!t) return null;
    if (t.name.startsWith("_") && !isBareShapeTarget(m, t)) return null;
    return t;
  });
  const directKindCounts = /* @__PURE__ */ new Map();
  for (const t of innerTargets) {
    if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
  }
  const nestedRepeatCounts = /* @__PURE__ */ new Map();
  for (const im of innerMembers) {
    countSymbolsInRepeat(im, nestedRepeatCounts);
  }
  const innerExisting = collectFieldNamesRuntime(inner);
  const sequenceCounters = /* @__PURE__ */ new Map();
  let innerChanged = false;
  const newInnerMembers = innerMembers.map((im, i) => {
    const t = innerTargets[i];
    if (!t) return im;
    let baseFieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return im;
      baseFieldName = t.name.slice(1);
    }
    if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return im;
    if ((outerKindCounts.get(t.name) ?? 0) > 0) return im;
    const directCount = directKindCounts.get(t.name) ?? 0;
    let fieldName = baseFieldName;
    if (directCount > 1) {
      const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
      sequenceCounters.set(t.name, seqIdx);
      fieldName = `${baseFieldName}${seqIdx}`;
    }
    if (innerExisting.has(fieldName)) return im;
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists (outer seq)`);
      return im;
    }
    innerExisting.add(fieldName);
    innerChanged = true;
    const fieldNode = makeField(inner, fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  if (!innerChanged) return null;
  let rebuilt = { ...inner, members: newInnerMembers };
  for (let i = innerPrecStack.length - 1; i >= 0; i--) {
    rebuilt = { ...innerPrecStack[i], content: rebuilt };
  }
  rebuilt = { ...cursor, content: rebuilt };
  for (let i = memberPrecStack.length - 1; i >= 0; i--) {
    rebuilt = { ...memberPrecStack[i], content: rebuilt };
  }
  return rebuilt;
}
function tryPromoteInRepeatSeq(ruleName, rule, cursor, outerPrecStack, supertypeNames) {
  if (!isRepeatType(cursor.type)) return rule;
  let inner = cursor.content;
  const innerPrecStack = [];
  while (isPrecWrapper(inner)) {
    innerPrecStack.push(inner);
    inner = inner.content;
  }
  if (!isSeqType(inner.type)) return rule;
  const members = inner.members;
  const directKindCounts = /* @__PURE__ */ new Map();
  const targetByIdx = members.map((m) => {
    const t = detectSymbolTarget(m);
    if (!t) return null;
    if (t.name.startsWith("_") && !isBareShapeTarget(m, t)) return null;
    return t;
  });
  for (const t of targetByIdx) {
    if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
  }
  const nestedRepeatCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    countSymbolsInRepeat(m, nestedRepeatCounts);
  }
  const existing = collectFieldNamesRuntime(inner);
  const sequenceCounters = /* @__PURE__ */ new Map();
  let changed = false;
  const newMembers = members.map((m, i) => {
    const t = targetByIdx[i];
    if (!t) return m;
    let baseFieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return m;
      baseFieldName = t.name.slice(1);
    }
    if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
    const directCount = directKindCounts.get(t.name) ?? 0;
    let fieldName = baseFieldName;
    if (directCount > 1) {
      const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
      sequenceCounters.set(t.name, seqIdx);
      fieldName = `${baseFieldName}${seqIdx}`;
    }
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists`);
      return m;
    }
    existing.add(fieldName);
    changed = true;
    const fieldNode = makeField(inner, fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  if (!changed) return rule;
  let result = { ...inner, members: newMembers };
  for (let i = innerPrecStack.length - 1; i >= 0; i--) {
    result = { ...innerPrecStack[i], content: result };
  }
  result = { ...cursor, content: result };
  for (let i = outerPrecStack.length - 1; i >= 0; i--) {
    result = { ...outerPrecStack[i], content: result };
  }
  return result;
}
function enrichFieldWrappers(rule) {
  const recursed = recurseChildren2(rule, enrichFieldWrappers);
  if (!isFieldType(recursed.type)) return recursed;
  const name = recursed.name;
  const content = recursed.content;
  if (typeof name !== "string" || !content || typeof content !== "object") return recursed;
  const existing = content;
  if (existing.fieldName === name && existing.nonterminal === true) return recursed;
  const newContent = { ...content, fieldName: name, nonterminal: true };
  return { ...recursed, content: newContent };
}
function recurseChildren2(rule, visit) {
  if (!rule || typeof rule !== "object") return rule;
  const t = rule.type;
  if (!t) return rule;
  if (isSeqType(t) || isChoiceType(t)) {
    const members = rule.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = visit(m);
      if (out !== m) changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : rule;
  }
  if (isOptionalType(t) || isRepeatType(t) || isFieldType(t) || isPrecWrapper(rule) || t === "alias" || t === "ALIAS" || t === "token" || t === "TOKEN" || t === "immediate_token" || t === "IMMEDIATE_TOKEN" || t === "group" || t === "variant" || t === "clause") {
    const content = rule.content;
    if (content === void 0) return rule;
    const out = visit(content);
    if (out === content) return rule;
    return { ...rule, content: out };
  }
  if (t === "polymorph") {
    const forms = rule.forms;
    if (!Array.isArray(forms)) return rule;
    let changed = false;
    const newForms = forms.map((f) => {
      const out = visit(f.content);
      if (out !== f.content) changed = true;
      return changed ? { ...f, content: out } : f;
    });
    return changed ? { ...rule, forms: newForms } : rule;
  }
  return rule;
}
var MULTIPLICITY_BY_TYPE = {
  optional: "optional",
  OPTIONAL: "optional",
  repeat: "array",
  REPEAT: "array",
  repeat1: "nonEmptyArray",
  REPEAT1: "nonEmptyArray"
};
function enrichMultiplicityWrappers(rule) {
  const recursed = recurseChildren2(rule, enrichMultiplicityWrappers);
  const t = recursed.type;
  const multiplicity = t ? MULTIPLICITY_BY_TYPE[t] : void 0;
  if (!multiplicity) return recursed;
  const self = recursed;
  const selfNeedsStamp = self.multiplicity !== multiplicity || self.nonterminal !== true;
  const content = recursed.content;
  const stampedContent = content && typeof content === "object" ? stampMultiplicityThroughWrappers(content, multiplicity) : content;
  if (!selfNeedsStamp && stampedContent === content) return recursed;
  const next = { ...recursed };
  if (selfNeedsStamp) {
    next.multiplicity = multiplicity;
    next.nonterminal = true;
  }
  if (stampedContent !== content) {
    next.content = stampedContent;
  }
  return next;
}
function stampMultiplicityThroughWrappers(node, multiplicity) {
  const existing = node;
  const selfNeedsStamp = existing.multiplicity !== multiplicity || existing.nonterminal !== true;
  const t = node.type;
  const isTransparent = !!t && (isFieldType(t) || isPrecWrapper(node) || t === "alias" || t === "ALIAS" || t === "token" || t === "TOKEN" || t === "immediate_token" || t === "IMMEDIATE_TOKEN");
  let newContent;
  let contentChanged = false;
  if (isTransparent) {
    const content = node.content;
    if (content && typeof content === "object") {
      newContent = stampMultiplicityThroughWrappers(content, multiplicity);
      contentChanged = newContent !== content;
    }
  }
  if (!selfNeedsStamp && !contentChanged) return node;
  const next = { ...node };
  if (selfNeedsStamp) {
    next.multiplicity = multiplicity;
    next.nonterminal = true;
  }
  if (contentChanged) {
    next.content = newContent;
  }
  return next;
}
function applyOptionalKeyword(ruleName, rule, kwRules) {
  const inner = peelPrec(rule);
  const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : /* @__PURE__ */ new Set();
  return walkOptionalKeyword(ruleName, rule, claimed, kwRules) ?? rule;
}
function peelPrec(rule) {
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    cursor = cursor.content;
  }
  return cursor;
}
function walkOptionalKeyword(ruleName, rule, claimedAtSeqLevel, kwRules) {
  if (isSeqType(rule.type)) {
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  const peeled = peelOptional(rule);
  if (peeled.isOptional) {
    const replacement = tryPromoteInnerKeyword(ruleName, rule, peeled.inner, claimedAtSeqLevel, kwRules);
    if (replacement !== null) return replacement;
    const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules);
    if (innerRewritten !== null) {
      return rebuildOptional(rule, innerRewritten);
    }
    return null;
  }
  if (isRepeatType(rule.type) || isFieldType(rule.type)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules);
    if (out === null) return null;
    return { ...rule, content: out };
  }
  if (isPrecWrapper(rule)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules);
    if (out === null) return null;
    return { ...rule, content: out };
  }
  return null;
}
function tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, kwRules) {
  const innerNorm = normalizeMember(inner);
  if (!isStringType(innerNorm.type)) return null;
  const kw = innerNorm.value;
  if (typeof kw !== "string" || !isIdentifierShaped(kw)) return null;
  const fieldName = `${kw}_marker`;
  if (claimed.has(fieldName)) {
    reportSkip("optional-keyword-prefix", ruleName, `field '${fieldName}' already exists`);
    return null;
  }
  claimed.add(fieldName);
  const symbolRef = registerKwRule(optionalRule, inner, fieldName, kwRules);
  const fieldNode = makeField(optionalRule, fieldName, symbolRef);
  return rebuildOptional(optionalRule, fieldNode);
}
function rebuildOptional(optionalRule, newInner) {
  if (isOptionalType(optionalRule.type)) {
    return { ...optionalRule, content: newInner };
  }
  const members = optionalRule.members;
  const newMembers = members.map((m) => {
    const t = m.type;
    return t === "BLANK" || t === "blank" ? m : newInner;
  });
  return { ...optionalRule, members: newMembers };
}

// packages/rust/overrides.ts
var config = {
  name: "rust",
  // `previous` is the base grammar's conflicts list — concat so we
  // don't drop the base entries (`$._type`, `$._pattern`, etc.).
  conflicts: ($, previous) => [
    ...previous ?? [],
    // match_arm split: the `seq(expr, ',')` vs block-ending variants
    // expose a shared-prefix conflict with other expression
    // contexts when the parser sees `… => if_expr (`.
    [$._expression_except_range, $._match_arm_block_ending],
    // visibility_modifier variant extraction: `pub(crate)` vs
    // `crate::foo` share the `crate` prefix.
    [$.scoped_identifier, $.scoped_type_identifier, $._visibility_modifier_crate],
    // visibility_modifier variant extraction: `pub` vs `pub(x)`
    // share the `pub` prefix; parser needs lookahead.
    [$._visibility_modifier_pub],
    // `_attributed_type_parameter` (body-pattern in groups:) and `_type`
    // both can begin with `metavariable` — declare the conflict so
    // tree-sitter uses lookahead instead of failing parser generation.
    [$._attributed_type_parameter, $._type],
    // `_attributed_argument` = seq(repeat(attribute_item), _expression).
    // Since repeat(attribute_item) can be zero, bare `_expression` is a
    // valid `_attributed_argument`. This creates an LR ambiguity in
    // array_expression's list-arm where elements share the same structural
    // unit as call arguments. The conflict declaration allows tree-sitter's
    // GLR mechanism to disambiguate at parse time.
    [$._attributed_argument]
  ],
  polymorphs: {
    array_expression: { "2/0": "semi", "2/1": "list" },
    closure_expression: { "4/0": "block", "4/1": "expr" },
    field_pattern: { "2/0": "shorthand", "2/1": "named" },
    function_type: { "1/0/0": "trait_form", "1/0/1": "fn_form" },
    impl_item: { "6/0": "body", "6/1": "semi" },
    macro_definition: { "2/0": "paren", "2/1": "bracket", "2/2": "brace" },
    mod_item: { "3/0": "external", "3/1": "inline" },
    or_pattern: { "0": "binary", "1": "prefix" },
    range_expression: {
      "0": "binary",
      "1": "postfix",
      "2": "prefix",
      "3": "bare"
    },
    // range_pattern: the base rule is
    //   choice(
    //     seq(field('left', X), choice(             ← 0
    //       seq(enum('...', '..=', '..'), field('right', X)),  ← 0/1/0 "left_with_right"
    //       '..',                                               ← 0/1/1 "left_bare"
    //     )),
    //     seq(enum, field('right', X)),             ← 1 "prefix"
    //   )
    // Flatten the adoption so the inner-choice arms get their own
    // variant names — the asymmetry (`..=`/`...` require a right,
    // bare `..` doesn't) means these are genuine structural variants.
    range_pattern: {
      "0/1/0": "left_with_right",
      "0/1/1": "left_bare",
      "1": "prefix"
    },
    struct_item: { "4/0": "brace", "4/1": "tuple", "4/2": "unit" },
    // visibility_modifier — three variants at two nesting depths,
    // all addressed from the top-level rule:
    //   - `1/1/0/1/3` in_path
    //                     → `visibility_modifier_in_path`
    //     (inside the pub arm's `seq('(', choice(self, super,
    //     crate, seq('in', _path)), ')')` — the `seq('in', _path)`
    //     branch). Without this split the inner choice is
    //     heterogeneous and the shape classifier throws
    //     `'seq-member-optional-wrapping-choice-needs-variant-or-merge'`.
    //   - `0` crate       → `visibility_modifier_crate`
    //   - `1` pub         → `visibility_modifier_pub`
    //
    // Order matters: variant patches apply in iteration order, and
    // once `'1'` aliases arm 1 into `_visibility_modifier_pub`, the
    // deeper `'1/1/0/1/3'` path can no longer descend into it.
    // Same convention the range_pattern entry above uses — put the
    // deepest paths first.
    visibility_modifier: {
      "1/1/0/1/3": "in_path",
      "0": "crate",
      "1": "pub"
    }
  },
  groups: {
    // visibility_modifier — lift the inner optional(seq('(', choice, ')'))
    // into a synthesized hidden kind (_visibility_modifier_pub_parens) so
    // the polymorph variant's render template naturally references the
    // group via the children slot. Closes bug #3 (`pub()` → `pub`).
    // See: docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
    _visibility_modifier_pub: {
      "1": "parens"
    },
    // --- body-pattern groups: tree-sitter visible-kind synthesis ---
    // Each function-valued entry below declares a STRUCTURAL PATTERN.
    // Codegen creates `_<key>` as the hidden rule body and rewrites every
    // matching sub-tree as `alias($._<key>, $.<key>)` so tree-sitter emits
    // the visible kind as a CST node. Without alias, tree-sitter inlines
    // the hidden `_*` rule and the kind never appears at runtime — the
    // transport-side slot remains permanently empty.
    // Pattern: attribute_item(s) attached to a struct field.
    // Used inline at every comma-separated position in
    // field_declaration_list. Without this lift, the parent's $children
    // flattens to alternating attribute_item / field_declaration entries
    // joined by commas (e.g. `#[attr],y: i32` instead of `#[attr] y: i32`).
    attributed_field_declaration: ($) => seq(repeat($.attribute_item), $.field_declaration),
    // Pattern: attribute_item(s) attached to an enum variant.
    // enum_variant_list uses SEQ(REPEAT(attribute_item), enum_variant)
    // inline at every comma-separated position.
    attributed_enum_variant: ($) => seq(repeat($.attribute_item), $.enum_variant),
    // Pattern: optional attribute_item attached to a function parameter.
    // parameters uses SEQ(CHOICE(attribute_item, BLANK), CHOICE(...)).
    // The sittir IR normalizes CHOICE(x, BLANK) to optional(x).
    // Members: parameter | self_parameter | variadic_parameter |
    // '_' wildcard | _type (anonymous type).
    attributed_parameter: ($) => seq(
      optional($.attribute_item),
      choice($.parameter, $.self_parameter, $.variadic_parameter, "_", $._type)
    ),
    // Pattern: attribute_item(s) attached to a type parameter.
    // type_parameters uses SEQ(REPEAT(attribute_item), CHOICE(metavariable,
    // type_parameter, lifetime_parameter, const_parameter)) inline at every
    // comma-separated position.
    attributed_type_parameter: ($) => seq(
      repeat($.attribute_item),
      choice($.metavariable, $.type_parameter, $.lifetime_parameter, $.const_parameter)
    ),
    // arguments: each call arg is seq(repeat(attribute_item), _expression).
    // Synthesize a visible `attributed_argument` kind (mirrors
    // attributed_parameter / attributed_type_parameter) so the arg list
    // renders `attributed_argument` items. Replaces the transforms:
    // field('attributes') collision-patch, which named the attribute but
    // left `_expression` (the actual args) as an empty `$children` slot.
    // NOTE: the same `seq(repeat(attribute_item), _expression)` pattern
    // also appears in array_expression's element list — the body-pattern
    // replacement aliases BOTH sites to `attributed_argument` (call args
    // and array elements share the same structural unit). The array_expression
    // transform `{ '2/(_expression)': field('elements') }` is removed so the
    // elements stay in the bare seq form that this pattern can match.
    attributed_argument: ($) => seq(repeat($.attribute_item), $._expression),
    // ordered_field_declaration_list: each comma-separated position is
    // seq(repeat(attribute_item), optional(visibility_modifier), field('type', _type)).
    // Without this lift the parent's $children flattens to alternating
    // attribute_item / visibility_modifier / _type entries joined by commas
    // (e.g. `#[attr] pub i32` as three siblings instead of one unit).
    // Mirrors attributed_field_declaration (the brace-form `field_declaration_list`
    // sibling). A multi-slot repeated unit must be a visible node so the flat
    // parse can be reconstructed; this is step 1 of making multiplicity intrinsic.
    attributed_ordered_field: ($) => seq(repeat($.attribute_item), optional($.visibility_modifier), field("type", $._type))
  },
  transforms: {
    // abstract_type: 1 field(s)
    abstract_type: {},
    // field_initializer_list: name the naked initializers choice (was an
    // unresolvable `content` slot).
    field_initializer_list: {
      1: field("initializers")
    },
    // tuple_pattern: name the naked elements choice (was an unresolvable
    // `content` slot).
    tuple_pattern: {
      1: field("elements")
    },
    // Naked-choice field names (was unresolvable `content` slots).
    closure_parameters: {
      1: field("parameters")
    },
    struct_pattern: {
      2: field("fields")
    },
    trait_bounds: {
      1: field("bounds")
    },
    use_bounds: {
      2: field("bounds")
    },
    last_match_arm: {
      0: field("attributes")
    },
    // async_block: seq('async', optional('move'), $.block).
    // Field-promotion wave 1 (016 task #23): label the standalone
    // optional `move` punct as `move_marker` so render preserves it
    // (`async move { ... }` vs `async { ... }`). Naming follows the
    // `<token>_marker` convention enrich uses for auto-promotion
    // (016 task #30); kept hand-promoted because the hand-emitted
    // template renders without the spacing that auto-promotion
    // introduces (the `async move {}` parity fixture round-trips
    // only with this entry).
    async_block: {
      "1/0": field("move_marker")
    },
    // array_expression polymorph splits '2/0' (semi) / '2/1' (list).
    // Only the outer `repeat($.attribute_item)` at pos 1 needs a field
    // label (the header attributes). The per-element label is no longer
    // needed — the `attributed_array_element` visible group (see groups:
    // above) now carries each element's attribute_item(s) + _expression
    // pair as a self-contained unit, exactly as `attributed_argument`
    // does for call arguments.
    array_expression: [{ 1: field("attributes") }],
    // arguments: handled by the `attributed_argument` body-pattern group
    // (see groups: above) — each call arg is synthesized as a visible
    // `attributed_argument` kind, like `attributed_parameter`.
    // attribute: seq(_path, optional(choice(seq('=', field('value',
    // _expression)), field('arguments', delim_token_tree)))).
    // storageName collision: _path (pos 0) and the optional choice
    // (pos 1) both infer storageName='children'. Promote the path at
    // pos 0 to a named field; the expression/arguments side already
    // has inner field() wrappers and stays as $children.
    attribute: {
      0: field("path")
    },
    // block: seq(optional(seq(field('label', label), ':')), '{',
    // repeat(_statement), optional(_expression), '}').
    // storageName collision: repeat(_statement) at pos 2 and
    // optional(_expression) at pos 3 both infer storageName='children'.
    // Promote the trailing expression to a named field; statements stay
    // as $children.
    block: {
      3: field("trailing_expression")
    },
    // bounded_type: 2 field(s)
    bounded_type: {
      0: field("left"),
      // lifetime | _type | use_bounds [struct=0]
      2: field("right")
      // lifetime | _type | use_bounds [struct=1]
    },
    // closure_expression: prec(closure, seq(
    //   optional('static'),  // pos 0  →  '0/0' = bare 'static'
    //   optional('async'),   // pos 1  →  '1/0' = bare 'async'
    //   optional('move'),    // pos 2  →  '2/0' = bare 'move'
    //   field('parameters', ...),  // pos 3
    //   choice(...),               // pos 4 — polymorph split block/expr
    // ))
    // Field-promotion wave 1 (016 task #23) + wave-1 follow-up (task
    // #27): label each standalone optional marker so render preserves
    // them (`static async move |x| ...` vs `|x| ...`). Naming follows
    // the `<token>_marker` convention enrich uses for auto-promoted
    // sites (016 task #30).
    //
    // 016 task #35: enrich's optional-keyword pass now descends through
    // `prec(...)` wrappers — but ONLY at the in-memory codegen surface
    // (types.ts, factories.ts). The tree-sitter-cli `grammar.json`
    // generation receives base rules as callbacks BEFORE evaluation,
    // so enrich's modifications don't reach the synthesized `_kw_*`
    // hidden rules / FIELD wrappers in grammar.json. Removing this
    // override leaves the parser emitting bare anon `static`/`async`/
    // `move` tokens; readNode promotes them to `$fields.<bare-text>`
    // (not `$fields.<text>_marker`), the generated `.jinja` template
    // references the `_marker` keys → render drops them → round-trip
    // regresses. Keep this entry until enrich runs on tree-sitter-cli's
    // post-evaluation rule shape too (deferred).
    // The `_kw_async_marker` inline declaration above (wave-1
    // follow-up, task #27) is required to keep `let a = async move
    // || async move {}` from regressing to ERROR.
    closure_expression: {
      "0/0": field("static_marker"),
      "1/0": field("async_marker"),
      "2/0": field("move_marker")
    },
    // extern_modifier: 1 field(s)
    extern_modifier: {},
    // function_modifiers — base is
    //   repeat1(choice('async', 'default', 'const', 'unsafe', $.extern_modifier))
    // Wrap the inner choice (path `0` = repeat1's content) with a single
    // `field('modifier')`. Tree-sitter then reports the per-arm token
    // union in node-types.json under `function_modifiers.fields.modifier`,
    // which lets sittir surface the modifier set as an enum / bitflag
    // (ADR-0012) rather than dropping the anonymous arms from $children.
    function_modifiers: {
      // Wildcard `_` forces path-mode (a pure numeric key `0`
      // would trigger flat-mode, which descends into each choice
      // arm individually rather than wrapping the whole choice).
      // At a single-content wrapper (REPEAT1), wildcard means
      // "descend into the content and patch there" — equivalent
      // to `field('modifier', <inner choice>)`.
      //
      // TODO(ADR-0012 bitflag): the resulting type
      //   `modifier: NonEmptyArray<"async" | "default" | "const" |
      //    "unsafe" | ExternModifier>`
      // is correctly enum-shaped but each modifier is genuinely
      // mutually-exclusive and set-like (order doesn't matter,
      // duplicates aren't meaningful). This ought to surface as a
      // Bitflag<FunctionMod, …> brand so the Config / Loose surface
      // projects to a flags enum instead of an array. Deferred —
      // needs bitflag detection in the walker for the repeat1+field
      // combination, not just seq-positioned boolean-keyword slots.
      _: field("modifier")
    },
    // visibility_modifier — replaces the hand-authored rule below
    // that wrapped bare keywords in `_kw_pub` / `_kw_in` hidden
    // SYMBOLs so FIELD would survive tree-sitter normalization.
    // The one-arg `field('pub')` / `field('in')` placeholders land
    // on bare STRINGs; `maybeKeywordSymbol` (dsl/primitives/field.ts)
    // auto-synthesizes `_kw_pub` / `_kw_in` hidden rules and swaps
    // each STRING for a SYMBOL ref — same net effect, zero hand-
    // authored rule body.
    //
    // Base shape:
    //   choice(
    //     $.crate,                                 ← 0
    //     seq(                                     ← 1
    //       'pub',                                 ← 1/0        ← field('pub')
    //       optional(seq(                          ← 1/1
    //         '(',                                 ← 1/1/0/0
    //         choice(                              ← 1/1/0/1
    //           $.self,                            ← 1/1/0/1/0
    //           $.super,                          ← 1/1/0/1/1
    //           $.crate,                          ← 1/1/0/1/2
    //           seq(                              ← 1/1/0/1/3
    //             'in',                           ← 1/1/0/1/3/0 ← field('in')
    //             $._path,                        ← 1/1/0/1/3/1
    //           ),
    //         ),
    //         ')',                                 ← 1/1/0/2
    //       )),
    //     ),
    //   )
    visibility_modifier: {
      "1/0": field("pub"),
      "1/1/0/1/3/0": field("in")
    },
    // function_type: top-level seq is
    //   [for_lifetimes, prec(call, seq(choice(trait, fn_form), parameters)),
    //    optional(->return_type)]
    // The choice at position 1 inner-seq[0] chooses between trait form
    // (bare type with field('trait', ...)) and fn form (seq with
    // optional modifiers + 'fn' literal). Template walker drops the
    // 'fn' literal because it's only in one arm. Polymorph-split each
    // arm. prec is transparent to path addressing, so path `1/0` is
    // the choice inside.
    function_type: [],
    // gen_block: seq('gen', optional('move'), $.block).
    // Field-promotion wave 1 (016 task #23): symmetric to async_block
    // — label the optional `move` punct as `move_marker` so render
    // preserves it. Kept hand-promoted for the same render-spacing
    // reason as async_block (see note above).
    gen_block: {
      "1/0": field("move_marker")
    },
    generic_type_with_turbofish: {
      1: field("turbofish")
    },
    // generic_type: base rule unchanged. ADR-0006 dispatches via
    // drillAs at alias-declared field sites so consumers see source-
    // typed views (`generic_type_with_turbofish` with the turbofish
    // template). Validators walk the wrapped tree, rewrite `$type`
    // to source, and use the `generic_type_with_turbofish` reparse
    // wrapper that accepts turbofish in a scoped-path context.
    // impl_item: field('where_clause') at pos 5 (inferred from 86%
    // agreement across 7 parents), plus polymorph at pos 6 —
    // choice(field('body', declaration_list), ';'). The ';' arm is
    // the trait-signature form (no body), which the template walker
    // drops without a polymorph split.
    //
    // Field-promotion wave 1 (016 task #23):
    //   - pos 0 = `optional('unsafe')` — leading `unsafe` marker on
    //     `unsafe impl` blocks. Path `0/0` descends into the optional
    //     and labels the bare literal as `unsafe_marker` (016 task
    //     #30 naming convention). Kept hand-promoted because enrich's
    //     auto-promotion at this position introduces extra spacing
    //     in the rendered output (`unsafe impl Foo {}` round-trips
    //     only with the manual override).
    //   - pos 3/0/0 = `optional('!')` — the `!` in `impl !Send for X`
    //     (negative trait impl). Path `3/0/0/0` reaches the bare `!`
    //     literal inside the inner-seq's leading optional. The
    //     `negative` name is context-specific (not `bang_marker`).
    impl_item: {
      "0/0": field("unsafe_marker"),
      "3/0/0/0": field("negative")
    },
    // index_expression: 2 field(s)
    index_expression: {
      0: field("object"),
      // _expression [struct=0]
      2: field("index")
      // _expression [struct=1]
    },
    // macro_invocation: 1 field(s)
    macro_invocation: {
      2: field("token_tree")
      // token_tree [struct=0]
    },
    // mod_item: two forms — `mod name;` (external) vs `mod name { ... }`
    // (inline). Polymorph-split so each form's template emits the
    // right terminator (trailing `;` vs `{...}` body).
    mod_item: [],
    // negative_literal: 2 field(s)
    negative_literal: {
      1: field("value")
      // integer_literal | float_literal [struct=0]
    },
    // ordered_field_declaration_list: 1 field(s)
    // The original override had position 2 for `visibility_modifier`
    // targeting `optional(',')` (trailing comma). After evaluate's
    // `absorbTrailingSeparator` collapses the trailing comma into the
    // repeat's `trailing: true` flag, position 2 becomes `)` — wrong.
    // Also `visibility_modifier` is inside the per-element seq, not at
    // the outer level, so the position 2 override was structurally
    // incorrect. Only wrapping position 1 (the per-element group).
    ordered_field_declaration_list: {
      1: field("attributes")
      // per-element group [struct=0]
    },
    // or_pattern polymorph splits '0' (binary) / '1' (prefix).
    // Field labels land on base-shape choice arms pre-alias.
    or_pattern: {
      "0/0": field("left"),
      "0/2": field("right"),
      "1/1": field("right")
    },
    // pointer_type: position 1 is `choice('const', $.mutable_specifier)`.
    // Wrapping the choice as `field('mutable_specifier')` makes BOTH
    // the `const` string and the `mutable_specifier` symbol route to
    // the named slot at readNode time, so the template can emit the
    // actual qualifier text instead of hardcoding "const".
    pointer_type: {
      1: field("mutable_specifier")
    },
    // raw_string_literal: 3 field(s)
    raw_string_literal: {
      0: field("raw_string_literal_start"),
      //  [struct=0]
      1: field("string_content"),
      // string_content [struct=1]
      2: field("raw_string_literal_end")
      //  [struct=2]
    },
    // range_expression polymorph splits '0'..'3'. Field labels
    // land on base-shape choice arms pre-alias.
    range_expression: {
      "0/0": field("start"),
      "0/1": field("operator"),
      "0/2": field("end"),
      "1/0": field("start"),
      "1/1": field("operator"),
      "2/0": field("operator"),
      "2/1": field("end"),
      "3": field("operator")
    },
    // reference_expression: 1 field(s)
    reference_expression: {
      1: field("mutable_specifier")
      // mutable_specifier [struct=0]
    },
    // reference_pattern: 2 field(s)
    reference_pattern: {
      2: field("pattern")
      // _pattern [struct=1]
    },
    // reference_type: 2 field(s)
    reference_type: {},
    // self_parameter: canonical tree-sitter-rust has no fields here;
    // labels below are ours. `&` is the lifetime marker (pos 0,
    // routed through _kw_lifetime so FIELD survives). `$.lifetime`
    // at pos 1 is the explicit lifetime name ('a etc.) — distinct
    // name to avoid colliding with pos 0's label.
    self_parameter: {
      0: field("reference")
      // optional('&')
    },
    // shorthand_field_initializer: 2 field(s)
    shorthand_field_initializer: {
      0: field("attributes")
      // attribute_item [struct=0]
      // pos 1 $.identifier auto-labelled by enrich pass 1
    },
    // source_file: 2 field(s)
    source_file: {
      1: field("statements")
      // _statement [struct=1]
    },
    // static_item: 2 field(s)
    static_item: {
      2: field("mutable_specifier")
      // mutable_specifier [struct=1]
    },
    // struct_item: three body shapes — brace (`{ ... }`), tuple
    // (`(...)` + `;`), unit (`;`). Polymorph-split each into a visible
    // variant so the trailing `;` on tuple/unit forms gets rendered
    // (the flat template dropped it because `;` is an anonymous
    // token not routed to any field).
    struct_item: [],
    // trait_item: seq(
    //   optional($.visibility_modifier),  // pos 0
    //   optional('unsafe'),                // pos 1  →  '1/0' = bare 'unsafe'
    //   'trait', ...
    // )
    // Field-promotion wave 1 (016 task #23): label the standalone
    // optional `unsafe` punct as `unsafe_marker` so render preserves
    // it (`unsafe trait Foo { ... }` vs `trait Foo { ... }`). Kept
    // hand-promoted for the same render-spacing reason as async_block
    // (see note above).
    trait_item: {
      "1/0": field("unsafe_marker")
    },
    // try_block: 1 field(s)
    // try_expression: 2 field(s)
    try_expression: {
      0: field("value")
      // _expression [struct=0]
    },
    // tuple_expression: flat list of expressions comma-separated.
    // Kind-match labels every `_expression` as `elements` without
    // capturing the `,` separators (same pattern as array_expression).
    tuple_expression: {
      1: field("attributes"),
      "(_expression)": field("elements")
    },
    // tuple_type: seq('(', sepBy1(',', $._type), optional(','), ')').
    // sepBy1 expands to seq($._type, repeat(seq(',', $._type))).
    // read_node routes unfielded _type children by concrete kind
    // (primitive_type, type_identifier, …) into separate supertype
    // buckets — losing CST order and reversing the tuple element list.
    // Kind-match wraps EVERY $._type occurrence with the same 'type'
    // field name so read_node collapses them into one ordered slot.
    // Uses transforms: (not rules:) so the parse is unchanged.
    tuple_type: {
      "(_type)": field("type")
    },
    // type_item: 3 field(s)
    type_item: {
      4: field("where_clause"),
      // where_clause [struct=1]
      7: field("trailing_where_clause")
      // where_clause [struct=2]
    },
    // type_parameters: handled by `attributed_type_parameter` body-
    // pattern in `groups:`. The parser conflict with `_type` (both
    // begin with metavariable) is declared in `conflicts:` above.
    // No override-side field-promotion needed.
    // unary_expression — label both the operator token (pos 0) and
    // the operand expression (pos 1). overrides.json promotes both
    // to fields at readNode time; the walker needs matching IR
    // fields so the template emits `$OPERATOR$OPERAND` instead of
    // `$OPERATOR $$$CHILDREN` (which reads empty after field promotion).
    unary_expression: {
      0: field("operator"),
      // choice('-', '*', '!')
      1: field("operand")
      // $._expression
    },
    // use_wildcard: 1 field(s)
    use_wildcard: {
      "0/0/0": field("path")
      // optional($._path) inside the optional `path ::` prefix; excludes the `::` token
    },
    // variadic_parameter: 1 field(s)
    variadic_parameter: {},
    // expression_statement: choice(seq(_expression, ';'),
    //                              prec(1, _expression_ending_with_block)).
    // Heterogeneous — the ';'-terminated form and the block-ending
    // form have structurally distinct templates. Each becomes its
    // own variant child kind.
    expression_statement: {
      0: variant("with_semi"),
      1: variant("block_ending")
    },
    // foreign_mod_item: choice at pos 2 between ';' (bare extern
    // decl) and field('body', declaration_list) (block extern).
    // Variant-adopt so each arm owns its own template.
    foreign_mod_item: {
      "2/0": variant("semi"),
      "2/1": variant("body")
    },
    // pointer_type: choice('const', mutable_specifier) at pos 1.
    // Literal 'const' vs symbol → split arms.
    pointer_type: {
      "1/0": variant("const"),
      "1/1": variant("mut")
    },
    // reference_expression: inner choice at path 1/0/1 selects
    // `const` vs `mutable_specifier` inside the `&raw (…) …`
    // form. Same const-vs-mut shape as pointer_type.
    reference_expression: {
      "1/0/1/0": variant("raw_const"),
      "1/0/1/1": variant("raw_mut")
    },
    // match_arm: seq(repeat(choice(attribute_item, inner_attribute_item)),
    //   field('pattern', match_pattern), '=>', choice(...)).
    // storageName collision in synthesized form kinds: the
    // repeat(choice(attribute_item, inner_attribute_item)) at pos 0 and
    // the variant symbol at pos 3 both infer storageName='children'.
    // Promote attribute_item to named field; the variant child stays as
    // $children. Field patch (flat mode) runs before variant patches
    // (path mode) via array-of-patch-sets.
    match_arm: [{ 0: field("attributes") }, { "3/0": variant("with_comma"), "3/1": variant("block_ending") }],
    // line_comment: choice at pos 1 between regular double-slash,
    // doc-comment, and regular content. Each arm has its own
    // distinct literal prefix.
    line_comment: {
      "1/0": variant("regular_dslash"),
      "1/1": variant("doc"),
      "1/2": variant("content")
    },
    // token_tree_pattern / token_tree / delim_token_tree: each is
    // choice(seq('(', repeat(inner), ')'), seq('[', ..., ']'), seq('{', ..., '}')).
    // Three delimiter-variants — distinct opening/closing literals per
    // arm, same inner content. Split so each arm owns its template.
    token_tree_pattern: {
      0: variant("paren"),
      1: variant("bracket"),
      2: variant("brace")
    },
    token_tree: {
      0: variant("paren"),
      1: variant("bracket"),
      2: variant("brace")
    },
    delim_token_tree: {
      0: variant("paren"),
      1: variant("bracket"),
      2: variant("brace")
    }
    // _let_chain: left-recursive `_let_chain && let_condition` vs
    // base `let_condition`. Hidden rule — tree-sitter flattens the
    // recursion at parse time, so variant() adoption would emit
    // unreachable `_let_chain_and` / `_let_chain_base` kinds. The
    // non-canonical audit for this kind reflects the derive walker's
    // view of an inlined helper; it doesn't surface as a user-facing
    // shape. Leave as-is.
    // block_comment: deferred. Inner choice at `1/0` branches on
    // doc-marker form vs bare `_block_comment_content`, but the
    // latter is an EXTERNAL token (lexer callback). Variant hoist
    // tries to reference `_block_comment_content` from a generated
    // hidden rule, and tree-sitter rejects it as "used as both an
    // external token and a non-terminal rule." Resolving this
    // needs either conflicts-awareness in the hoist or a
    // merge-branches path that doesn't extract the external-token
    // branch.
  },
  rules: {
    // Hidden `_kw_*` rules that previously sat here
    // (`_kw_async` / `_kw_default` / `_kw_const` / `_kw_unsafe` /
    // `_kw_pub` / `_kw_in`) have been deleted. They're now
    // auto-synthesized by `maybeKeywordSymbol` (field.ts) whenever
    // the declarative `transforms:` entries above land a one-arg
    // `field('name')` on a bare STRING — see the
    // `function_modifiers` / `visibility_modifier` entries above.
    //
    // _pattern — the wildcard `_` is a bare literal alternative
    // (position 20) of the _pattern supertype choice. At multi-valued
    // list positions (rust `sepBy(',', $._pattern)` used by
    // tuple_struct_pattern, tuple_pattern, slice_pattern, closure
    // parameters) tree-sitter surfaces `_` as an anonymous child,
    // which readNode promotes to $fields['_'] and $$$CHILDREN's
    // named-only filter subsequently drops. Aliasing `_` to a named
    // `wildcard_pattern` kind gives it a proper node in the tree so
    // every `_pattern` list position round-trips cleanly without any
    // render-side heuristics. The hidden `_wildcard_pattern` rule is
    // declared explicitly below so tree-sitter's `ruleMap` snapshot
    // picks it up — no runtime synthesis, no wrapper machinery.
    //
    // Why inline here instead of declarative `transforms:` — the
    // patch value needs `$` (tree-sitter's symbol proxy) at call
    // time. `transforms:` values are evaluated at config-object-
    // literal time, before `$` exists. See ADR-0009 §Task-7.
    _pattern: ($, original) => transform(original, {
      "-1": alias($._wildcard_pattern, $.wildcard_pattern)
    }),
    // The hidden rule `_wildcard_pattern` is just the `_` literal;
    // the named alias on `_pattern` above promotes it to a proper
    // `wildcard_pattern` kind at parse time.
    _wildcard_pattern: ($) => "_"
  },
  // renderAs — sittir-side rule bodies for external scanner symbols.
  // These bodies are used by sittir's slot/render/factory pipeline ONLY;
  // they are stripped before the grammar reaches tree-sitter (the C
  // external scanner still produces these symbols during parsing).
  //
  // Doc comment markers — sittir-side declarations of the marker character.
  // Tree-sitter's external scanner still produces these tokens; renderAs
  // entries let sittir's render/factory/from pipelines know the literal
  // text without depending on tree-sitter to expose it.
  //
  // Line markers (_outer_line / _inner_line) DO have IMMEDIATE_TOKEN bodies
  // in grammar.json — those are stripped by wire so tree-sitter never sees
  // duplicate rule bodies. Block markers (_outer_block / _inner_block) are
  // pure externals with no grammar body.
  //
  // Rust doc-comment syntax:
  //   ///outer line doc      — outer line marker is '/' (lexer consumes '//' first)
  //   //!inner line doc      — inner line marker is '!'
  //   /**outer block doc*/   — outer block marker is '*'
  //   /*!inner block doc*/   — inner block marker is '!'
  //
  // Raw string literal delimiters — static (1-hash form only).
  // Round-trip will fail for `r##"..."##` etc. Factory-side benefit: no
  // delimiter-count parameter needed.
  renderAs: (_$) => ({
    // Doc comment markers
    _outer_line_doc_comment_marker: string("/"),
    // /// outer line doc
    _inner_line_doc_comment_marker: string("!"),
    // //! inner line doc
    _outer_block_doc_comment_marker: string("*"),
    // /** outer block doc */ (was '!' in MVP — typo)
    _inner_block_doc_comment_marker: string("!"),
    // /*! inner block doc */
    // Raw string literal delimiters — static (1-hash form only).
    // Round-trip will fail for `r##"..."##` etc. Factory-side
    // benefit: no delimiter-count parameter needed.
    _raw_string_literal_start: string('r#"'),
    _raw_string_literal_end: string('"#')
  })
};
var enrichedBase = enrich(import_grammar.default);
var overrides_default = grammar(enrichedBase, wire(config, enrichedBase));
if (module.exports && module.exports.default) module.exports = module.exports.default;
