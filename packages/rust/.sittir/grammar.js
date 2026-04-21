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
      throw new Error(`parsePath: bare kind name '${part}' is no longer valid as a path segment \u2014 use '(${part})' instead; see ADR-0010`);
    } else {
      throw new Error(`parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index, '_' (wildcard), '(name)' (kind-match), or 'name:' (field traversal)`);
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
      throw new ApplyPathSkip(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`);
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
    case "fieldName":
    default: {
      const _exhaustive = head;
      throw new Error(`descendThroughSingleWrapper: unexpected segment kind '${_exhaustive.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
  }
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
    return { rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule, matched: inner.matched };
  }
  if (t === "symbol" || t === "SYMBOL") {
    return applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField);
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
  const prec2 = nativeRequired("prec");
  const variant2 = PREC_VARIANT_MAP[t];
  if (variant2) {
    const fn = prec2[variant2];
    if (typeof fn !== "function") throw new Error(`transform: native prec.${variant2} not available`);
    return fn(value, newContent);
  }
  return prec2(value, newContent);
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
    case "fieldName":
    default: {
      const _exhaustive = head;
      throw new Error(`applyToMembers: unexpected segment kind '${_exhaustive.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
  }
}
function applyToIndexedMember(rule, members, indexValue, rest, patch, precStack) {
  const idx = indexValue < 0 ? members.length + indexValue : indexValue;
  if (idx < 0 || idx >= members.length) {
    throw new ApplyPathSkip(
      `applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`
    );
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
    throw new ApplyPathSkip(`applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`);
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
    return { __sittirPlaceholder: "alias", name: rule };
  }
  const native = globalThis.alias;
  if (typeof native !== "function") {
    throw new Error("alias(): no global alias() found \u2014 must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)");
  }
  if (value !== void 0) {
    return native(rule, value);
  }
  return native(rule, rule);
}

// packages/codegen/src/dsl/wire/wire.ts
var currentContext = null;
function wireRegisterSyntheticRule(name, content) {
  if (!currentContext) return false;
  currentContext.deposits.set(name, content);
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
function wire(config) {
  const context = {
    deposits: /* @__PURE__ */ new Map(),
    polymorphVariants: [],
    conflictGroups: [],
    refineForms: /* @__PURE__ */ new Map(),
    currentRuleKind: null
  };
  const polymorphs = config.polymorphs ?? {};
  const transforms = config.transforms ?? {};
  const outRules = { ...config.rules };
  composeOrSynthesizeTransformParents(outRules, transforms);
  composeOrSynthesizePolymorphParents(outRules, polymorphs);
  injectHiddenRulePlaceholders(outRules, polymorphs, context);
  injectTransformHiddenRulePlaceholders(outRules, transforms, context);
  wrapAllRuleFns(outRules, context);
  const conflicts = wrapConflictsCallback(config.conflicts, context);
  const wired = {
    ...config,
    rules: outRules,
    ...conflicts === void 0 ? {} : { conflicts }
  };
  Object.defineProperty(wired, "__wireContext__", {
    value: context,
    enumerable: false,
    configurable: true
  });
  return wired;
}
function composeOrSynthesizePolymorphParents(rules, polymorphs) {
  for (const [parent, armMap] of Object.entries(polymorphs)) {
    const userFn = rules[parent];
    rules[parent] = buildPolymorphParentFn(armMap, userFn);
  }
}
function buildPolymorphParentFn(armMap, userFn) {
  const patches = {};
  for (const [path, suffix] of Object.entries(armMap)) {
    patches[path] = variant(suffix);
  }
  return function wiredPolymorphParent($, original) {
    const base2 = userFn ? userFn.call(this, $, original) : original;
    return transform(base2, patches);
  };
}
function injectHiddenRulePlaceholders(rules, polymorphs, context) {
  for (const [parent, armMap] of Object.entries(polymorphs)) {
    for (const suffix of Object.values(armMap)) {
      const hiddenName = `_${parent}_${suffix}`;
      rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    }
  }
}
function composeOrSynthesizeTransformParents(rules, transforms) {
  for (const [kind, entry] of Object.entries(transforms)) {
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
function buildWiredConflictsFn(userConflicts, context) {
  return function wiredConflicts($, previous) {
    const base2 = userConflicts ? userConflicts.call(this, $, previous) : previous ?? [];
    if (context.conflictGroups.length === 0) return base2;
    const symbolized = context.conflictGroups.map((group) => group.map((name) => symbolizeRef($, name)));
    return [...base2, ...symbolized];
  };
}
function symbolizeRef(_$, name) {
  return { type: "SYMBOL", name };
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
  const nativePrec = globalThis.prec;
  let precBody = typeof nativePrec === "function" ? nativePrec(-1, content) : content;
  if (wrapSyntheticBody) precBody = wrapSyntheticBody(precBody);
  if (!wireRegisterSyntheticRule(hiddenName, precBody)) {
    throw new Error(`field('${fieldName}', <STRING>): no active wire() context \u2014 call must occur inside a rule callback wrapped by wire()`);
  }
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
    return { __sittirPlaceholder: "field", name };
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error("field(): no global field() found \u2014 must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)");
  }
  return buildTwoArgFieldResult(native, name, content);
}
function buildTwoArgFieldResult(native, name, content) {
  const initial = native(name, content);
  const inner = initial.content;
  const symbolized = maybeKeywordSymbol(name, inner);
  if (symbolized !== inner) {
    const reconstructed = native(name, symbolized);
    return { ...reconstructed, source: "override" };
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
  const hoisted = tryHoistSiblingVariants(rule, variantEntries);
  if (hoisted) {
    let result2 = hoisted.rule;
    for (const [key, value] of variantEntries) {
      if (hoisted.consumed.has(key)) continue;
      const segments = parsePath(key);
      result2 = applyPath(result2, segments, (member, precStack) => resolvePatch(value, member, precStack));
    }
    return result2;
  }
  let result = rule;
  for (const [key, value] of variantEntries) {
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
  if (parsed.some((p) => p.choicePos !== choicePos)) return bail(`variant patches target mixed choice positions (${parsed.map((p) => p.choicePos).join(",")}) \u2014 hoist needs all siblings at one choice`);
  const seqMembers = [...membersOf2(core)];
  const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
  const choice2 = seqMembers[resolvedPos];
  if (!choice2 || !isChoiceType(choice2.type)) return bail(`position ${resolvedPos} is '${choice2?.type}', not choice/CHOICE`);
  const choiceMembers = membersOf2(choice2);
  const anyEmpty = parsed.some((p) => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]));
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
    if (segs[0].kind !== "index" || segs[1].kind !== "index") return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`);
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
    const visibleName = `${parentKind}_${p.v.name}`;
    const hiddenName = `_${visibleName}`;
    if (!wireRegisterPolymorphVariant(parentKind, p.v.name)) {
      throw new Error(`variant('${p.v.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`);
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
  registerHoistedVariantConflicts(parsed.map((p) => `_${parentKind}_${p.v.name}`));
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
      throw new Error(
        `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`
      );
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
      throw new Error(`variant('${patch.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`);
    }
    const fullName = `${parentKind}_${patch.name}`;
    const hiddenName = "_" + fullName;
    return registerAliasedVariant(hiddenName, fullName, originalMember, (body) => wrapInPrec(body, precStack));
  }
  if (isAliasPlaceholder(patch)) {
    return resolveAliasPlaceholder(patch, originalMember, precStack);
  }
  return patch;
}
function resolveFieldPlaceholder(patch, originalMember, precStack) {
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
      throw new Error("transform: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()");
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
    const nonEmpty = { ...r, type: t === "REPEAT" ? "REPEAT1" : "repeat1" };
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
  const kwRules = {};
  const enrichedRules = {};
  for (const name of Object.keys(rulesBag)) {
    const rule = rulesBag[name];
    enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules) : rule;
  }
  const mergedRules = { ...enrichedRules, ...kwRules };
  if (hasWrapper) {
    return { ...base2, grammar: { ...base2.grammar, rules: mergedRules } };
  }
  return { ...base2, rules: mergedRules };
}
function applyEnrichPasses(ruleName, rule, kwRules) {
  let r = rule;
  r = applyKindToName(ruleName, r);
  r = applyOptionalKeyword(ruleName, r, kwRules);
  return r;
}
function detectCase(referenceRule) {
  const t = referenceRule?.type ?? "";
  return t.length > 0 && t === t.toUpperCase() ? "upper" : "lower";
}
function makeField(referenceRule, name, content) {
  return {
    type: detectCase(referenceRule) === "upper" ? "FIELD" : "field",
    name,
    content,
    source: "inferred"
  };
}
function makeSymbol(referenceRule, name) {
  return {
    type: detectCase(referenceRule) === "upper" ? "SYMBOL" : "symbol",
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
function isIdentifierShaped(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
function reportSkip(pass, ruleName, reason) {
  if (process.env.SITTIR_QUIET) return;
  process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})
`);
}
function applyKindToName(ruleName, rule) {
  if (!isSeqType(rule.type)) return rule;
  const members = rule.members;
  const kindCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    if (isSymbolType(m.type) && typeof m.name === "string") {
      const n = m.name;
      kindCounts.set(n, (kindCounts.get(n) ?? 0) + 1);
    }
  }
  const existing = collectFieldNamesRuntime(rule);
  let changed = false;
  const newMembers = members.map((m) => {
    if (!isSymbolType(m.type) || typeof m.name !== "string") return m;
    const k = m.name;
    if (k.startsWith("_")) return m;
    if ((kindCounts.get(k) ?? 0) > 1) return m;
    if (existing.has(k)) {
      reportSkip("kind-to-name", ruleName, `field '${k}' already exists`);
      return m;
    }
    existing.add(k);
    changed = true;
    return makeField(rule, k, m);
  });
  if (!changed) return rule;
  return { ...rule, members: newMembers };
}
function applyOptionalKeyword(ruleName, rule, kwRules) {
  const claimed = isSeqType(rule.type) ? collectFieldNamesRuntime(rule) : /* @__PURE__ */ new Set();
  return walkOptionalKeyword(ruleName, rule, claimed, kwRules) ?? rule;
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
  return null;
}
function tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, kwRules) {
  const innerNorm = normalizeMember(inner);
  if (!isStringType(innerNorm.type)) return null;
  const kw = innerNorm.value;
  if (typeof kw !== "string" || !isIdentifierShaped(kw)) return null;
  if (claimed.has(kw)) {
    reportSkip("optional-keyword-prefix", ruleName, `field '${kw}' already exists`);
    return null;
  }
  claimed.add(kw);
  const symbolRef = registerKwRule(optionalRule, inner, kw, kwRules);
  const fieldNode = makeField(optionalRule, kw, symbolRef);
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
var overrides_default = grammar(enrich(import_grammar.default), wire({
  name: "rust",
  polymorphs: {
    array_expression: { "2/0": "semi", "2/1": "list" },
    closure_expression: { "4/0": "block", "4/1": "expr" },
    field_pattern: { "2/0": "shorthand", "2/1": "named" },
    function_type: { "1/0/0": "trait_form", "1/0/1": "fn_form" },
    impl_item: { "6/0": "body", "6/1": "semi" },
    macro_definition: { "2/0": "paren", "2/1": "bracket", "2/2": "brace" },
    mod_item: { "3/0": "external", "3/1": "inline" },
    or_pattern: { "0": "binary", "1": "prefix" },
    range_expression: { "0": "binary", "1": "postfix", "2": "prefix", "3": "bare" },
    range_pattern: { "0": "left", "1": "prefix" },
    struct_item: { "4/0": "brace", "4/1": "tuple", "4/2": "unit" }
  },
  transforms: {
    // abstract_type: 1 field(s)
    abstract_type: {
      1: field("type_parameters")
      // type_parameters [struct=0]
    },
    // associated_type: 1 field(s)
    associated_type: {
      4: field("where_clause")
      // where_clause [struct=0]
    },
    // array_expression polymorph splits '2/0' (semi) / '2/1' (list).
    // These base-shape patches add field labels BEFORE polymorph
    // aliasing — composition-order inversion in wire() lets this
    // flow declaratively instead of inline in rules:.
    array_expression: [
      { 1: field("attributes") },
      { "2/(_expression)": field("elements") }
    ],
    // async_block: position 2 is the `block` symbol (position 1 is
    // the optional `move` choice). Autogen placed the override at
    // position 1, which wrapped the move choice and dropped the
    // block routing entirely.
    async_block: {
      "1/0": field("move"),
      // optional('move') → surface as field
      2: field("block")
    },
    // attribute_item: 1 field(s)
    attribute_item: {
      2: field("attribute")
      // attribute [struct=0]
    },
    // block: 1 field(s)
    block: {
      0: field("label")
      // label [struct=0]
    },
    // bounded_type: 2 field(s)
    bounded_type: {
      0: field("left"),
      // lifetime | _type | use_bounds [struct=0]
      2: field("right")
      // lifetime | _type | use_bounds [struct=1]
    },
    // break_expression: 2 field(s)
    break_expression: {
      1: field("label"),
      // label [struct=0]
      2: field("expression")
      // _expression [struct=1]
    },
    // captured_pattern: 2 field(s)
    captured_pattern: {
      0: field("identifier"),
      // identifier [struct=0]
      2: field("pattern")
      // _pattern [struct=1]
    },
    // closure_expression — label the three optional modifiers so readNode
    // can route `async`, `move`, `static` tokens to named fields instead
    // of leaving them as anonymous children.
    closure_expression: [
      { 0: field("static"), 1: field("async"), 2: field("move") }
    ],
    // const_item: 1 field(s)
    const_item: {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    },
    // continue_expression: 1 field(s)
    continue_expression: {
      1: field("label")
      // label [struct=0]
    },
    // enum_item: 2 field(s)
    enum_item: {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      4: field("where_clause")
      // where_clause [struct=1]
    },
    // enum_variant: 1 field(s)
    enum_variant: {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    },
    // extern_crate_declaration: 2 field(s)
    extern_crate_declaration: {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      2: field("crate")
      // crate [struct=1]
    },
    // extern_modifier: 1 field(s)
    extern_modifier: {
      1: field("string_literal")
      // string_literal [struct=0]
    },
    // field_declaration: 1 field(s)
    field_declaration: {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    },
    // field_pattern: 1 field(s)
    // Grammar: seq(optional('ref'), optional(mutable_specifier), choice(...))
    // Position 0 = optional('ref') [anonymous], position 1 = optional(mutable_specifier)
    field_pattern: {
      1: field("mutable_specifier")
      // mutable_specifier [struct=0]
    },
    // for_expression: 1 field(s)
    for_expression: {
      0: field("label")
      // label [struct=0]
    },
    // foreign_mod_item: 2 field(s)
    foreign_mod_item: {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      1: field("extern_modifier")
      // extern_modifier [struct=1]
    },
    // function_item: pos 6 is optional(seq('->', field('return_type', ..))) —
    // don't touch it, return_type is already a base-grammar field. The
    // where_clause symbol lives at pos 7. Pos 8 is the body block (also
    // already a base field).
    function_item: {
      0: field("visibility_modifier"),
      // visibility_modifier
      1: field("function_modifiers"),
      // function_modifiers
      7: field("where_clause")
      // where_clause
    },
    // function_signature_item: same shape as function_item but ends in
    // ';' instead of a body block — pos 7 is where_clause here too.
    function_signature_item: {
      0: field("visibility_modifier"),
      // visibility_modifier
      1: field("function_modifiers"),
      // function_modifiers
      7: field("where_clause")
      // where_clause
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
    function_type: [
      { 0: field("for_lifetimes") }
    ],
    // gen_block: same fix as async_block — the block symbol is
    // at position 2, position 1 is the optional `move` choice.
    gen_block: {
      "1/0": field("move"),
      // optional('move') → surface as field
      2: field("block")
    },
    // generic_type_with_turbofish: aliased to `generic_type` at 4 call
    // sites. Wrap `::` at pos 1 as a field('turbofish') so the aliased-
    // shape generic_type surfaces it (confirmed: parse produces
    // field=turbofish for `C::<D>`). The generic_type template itself
    // still needs to reference $TURBOFISH — handled via its override
    // below.
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
    impl_item: [
      {
        "0/0": field("unsafe"),
        // optional('unsafe') → surface as field
        5: field("where_clause")
      }
    ],
    // index_expression: 2 field(s)
    index_expression: {
      0: field("object"),
      // _expression [struct=0]
      2: field("index")
      // _expression [struct=1]
    },
    // inner_attribute_item: 1 field(s)
    inner_attribute_item: {
      3: field("attribute")
      // attribute [struct=0]
    },
    // label: 1 field(s)
    label: {
      1: field("identifier")
      // identifier [struct=0]
    },
    // let_declaration: 1 field(s)
    let_declaration: {
      1: field("mutable_specifier")
      // mutable_specifier [struct=0]
    },
    // lifetime: 1 field(s)
    lifetime: {
      1: field("identifier")
      // identifier [struct=0]
    },
    // loop_expression: 1 field(s)
    loop_expression: {
      0: field("label")
      // label [struct=0]
    },
    // macro_invocation: 1 field(s)
    macro_invocation: {
      2: field("token_tree")
      // token_tree [struct=0]
    },
    // mod_item: two forms — `mod name;` (external) vs `mod name { ... }`
    // (inline). Polymorph-split so each form's template emits the
    // right terminator (trailing `;` vs `{...}` body).
    mod_item: [
      { 0: field("visibility_modifier") }
    ],
    // mut_pattern: 2 field(s)
    mut_pattern: {
      0: field("mutable_specifier"),
      // mutable_specifier [struct=0]
      1: field("pattern")
      // _pattern [struct=1]
    },
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
    // parameter: 1 field(s)
    parameter: {
      0: field("mutable_specifier")
      // mutable_specifier [struct=0]
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
      1: field("mutable_specifier"),
      // mutable_specifier [struct=0]
      2: field("pattern")
      // _pattern [struct=1]
    },
    // reference_type: 2 field(s)
    reference_type: {
      1: field("lifetime"),
      // lifetime [struct=0]
      2: field("mutable_specifier")
      // mutable_specifier [struct=1]
    },
    // self_parameter: canonical tree-sitter-rust has no fields here;
    // labels below are ours. `&` is the lifetime marker (pos 0,
    // routed through _kw_lifetime so FIELD survives). `$.lifetime`
    // at pos 1 is the explicit lifetime name ('a etc.) — distinct
    // name to avoid colliding with pos 0's label.
    self_parameter: {
      0: field("lifetime"),
      // optional('&')
      1: field("lifetime_name"),
      // optional($.lifetime)
      2: field("mutable_specifier")
      // optional($.mutable_specifier)
    },
    // shorthand_field_initializer: 2 field(s)
    shorthand_field_initializer: {
      0: field("attributes"),
      // attribute_item [struct=0]
      1: field("identifier")
      // identifier [struct=1]
    },
    // source_file: 2 field(s)
    source_file: {
      0: field("shebang"),
      // shebang [struct=0]
      1: field("statements")
      // _statement [struct=1]
    },
    // static_item: 2 field(s)
    static_item: {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      2: field("mutable_specifier")
      // mutable_specifier [struct=1]
    },
    // struct_item: three body shapes — brace (`{ ... }`), tuple
    // (`(...)` + `;`), unit (`;`). Polymorph-split each into a visible
    // variant so the trailing `;` on tuple/unit forms gets rendered
    // (the flat template dropped it because `;` is an anonymous
    // token not routed to any field).
    struct_item: [
      { 0: field("visibility_modifier") }
    ],
    // trait_item: position 0 is the same visibility_modifier
    // optional choice as struct_item. The where_clause at
    // position 6 and the body field at position 7 stay as
    // declared in the base grammar.
    trait_item: {
      0: field("visibility_modifier"),
      "1/0": field("unsafe"),
      // optional('unsafe')
      6: field("where_clause")
      // inferred 88% agreement across 8 parents
    },
    // try_block: 1 field(s)
    try_block: {
      1: field("block")
      // block [struct=0]
    },
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
    // type_item: 3 field(s)
    type_item: {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      4: field("where_clause"),
      // where_clause [struct=1]
      7: field("trailing_where_clause")
      // where_clause [struct=2]
    },
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
    // union_item: 2 field(s)
    union_item: {
      0: field("visibility_modifier"),
      // visibility_modifier [struct=0]
      4: field("where_clause")
      // where_clause [struct=1]
    },
    // unsafe_block: 1 field(s)
    unsafe_block: {
      1: field("block")
      // block [struct=0]
    },
    // use_declaration: 1 field(s)
    use_declaration: {
      0: field("visibility_modifier")
      // visibility_modifier [struct=0]
    },
    // use_wildcard: 1 field(s)
    use_wildcard: {
      0: field("path")
      // crate | identifier | metavariable | scoped_identifier | self | super [struct=0]
    },
    // variadic_parameter: 1 field(s)
    variadic_parameter: {
      0: field("mutable_specifier")
      // mutable_specifier [struct=0]
    },
    // while_expression: 1 field(s)
    while_expression: {
      0: field("label")
      // label [struct=0]
    }
  },
  rules: {
    // function_modifiers — full replacement: label each choice alternative
    // so readNode can route `async`, `const`, `default`, `unsafe` tokens.
    // Route the bare-keyword strings through `_kw_<name>` hidden rules
    // (declared below) so FIELD survives tree-sitter normalization —
    // FIELD around bare STRING gets stripped; FIELD around SYMBOL survives.
    function_modifiers: ($) => repeat1(choice(
      field("async", $._kw_async),
      field("default", $._kw_default),
      field("const", $._kw_const),
      field("unsafe", $._kw_unsafe),
      $.extern_modifier
    )),
    // Hand-authored `_kw_<name>` hidden rules. Required for
    // function_modifiers and visibility_modifier to route bare
    // keywords through SYMBOLs so FIELD wrappers survive. These
    // could also live in a shared module if more grammars start
    // needing the same keyword set; for now, rust is the only one.
    _kw_async: ($) => prec(-1, "async"),
    _kw_default: ($) => prec(-1, "default"),
    _kw_const: ($) => prec(-1, "const"),
    _kw_unsafe: ($) => prec(-1, "unsafe"),
    _kw_pub: ($) => prec(-1, "pub"),
    _kw_in: ($) => prec(-1, "in"),
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
    _wildcard_pattern: ($) => "_",
    // visibility_modifier — label the `pub` keyword and the `in` keyword
    // (inside `pub(in path)`) so readNode can route them to named fields.
    visibility_modifier: ($) => choice(
      $.crate,
      seq(
        field("pub", $._kw_pub),
        optional(seq(
          "(",
          choice(
            $.self,
            $.super,
            $.crate,
            seq(field("in", $._kw_in), $._path)
          ),
          ")"
        ))
      )
    )
  }
}));
if (module.exports && module.exports.default) module.exports = module.exports.default;
