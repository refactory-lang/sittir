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

// packages/typescript/overrides.ts
var overrides_exports = {};
__export(overrides_exports, {
  default: () => overrides_default
});
module.exports = __toCommonJS(overrides_exports);
var import_grammar = __toESM(require("tree-sitter-typescript/typescript/grammar.js"), 1);

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
function wireRegisterRefineForms(kind, forms) {
  if (!currentContext) return false;
  currentContext.refineForms.set(kind, forms);
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
  const choice = seqMembers[resolvedPos];
  if (!choice || !isChoiceType(choice.type)) return bail(`position ${resolvedPos} is '${choice?.type}', not choice/CHOICE`);
  const choiceMembers = membersOf2(choice);
  const anyEmpty = parsed.some((p) => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]));
  if (!anyEmpty) return null;
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind) return bail("no current rule kind (variant()/transform() called outside rule callback?)");
  return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, parentKind, precStack);
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
function buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, parentKind, precStack) {
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
  const newChoice = reconstructContainer(choice, refs);
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
    const optional = globalThis.optional;
    if (typeof optional !== "function") {
      throw new Error("transform: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()");
    }
    return optional(aliasNode);
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

// packages/codegen/src/dsl/primitives/refine.ts
function refine(original, forms) {
  const kind = wireGetCurrentRuleKind();
  if (!kind) {
    throw new Error(
      "refine(): no active wire context \u2014 refine() must run inside a rule callback under wire()"
    );
  }
  const formList = [];
  for (const [name, selections] of Object.entries(forms)) {
    if (formList.some((f) => f.name === name)) {
      throw new Error(`refine(): duplicate form name '${name}' on rule '${kind}'`);
    }
    formList.push({ name, selections: { ...selections } });
  }
  if (!wireRegisterRefineForms(kind, formList)) {
    throw new Error("refine(): wire context rejected registration \u2014 unexpected");
  }
  return original;
}

// packages/typescript/overrides.ts
var overrides_default = grammar(enrich(import_grammar.default), wire({
  name: "typescript",
  // Conflict markers for variant() adoption on kinds where splitting
  // exposes LR(1) ambiguities the unsplit grammar resolved via shared
  // state. Each entry names two or more rules tree-sitter should
  // treat as requiring a GLR state so it can defer the decision
  // until more input disambiguates. Hidden (`_foo`) and visible
  // (`$.foo`) names are both valid here.
  // `previous` is the TS grammar's own conflicts list (which
  // itself concats the JS base's conflicts). Concat so we don't
  // drop the base entries — we only ADD the new ones required by
  // variant() adoption.
  conflicts: ($, previous) => (previous ?? []).concat([
    // parenthesized_expression split: `( expression )` vs
    // `( sequence_expression )` share the expression prefix. The
    // typed variant's hidden rule (`_parenthesized_expression_typed`)
    // competes with `sequence_expression` when the parser sees
    // `( expression •`. GLR resolves based on what follows.
    [$.sequence_expression, $._parenthesized_expression_typed],
    // Also exposes a latent `async` ambiguity — before the split,
    // tree-sitter resolved `async (` via state shared between the
    // typed parenthesized expression and arrow_function's call
    // signature. With the typed variant lifted to its own hidden
    // rule, the parser needs explicit GLR to decide whether `async
    // (` starts a call (primary_expression) or an arrow function.
    [$.primary_expression, $.arrow_function],
    // `export` as `primary_expression` vs as `_property_name`
    // surfaces once the typed-parenthesized variant brings more
    // expression contexts into the same state.
    [$.primary_expression, $._property_name],
    [$.labeled_statement, $._property_name],
    [$.object, $.object_pattern],
    [$.primary_expression, $.method_definition],
    [$.primary_expression, $.arrow_function, $._property_name],
    [$.call_expression, $.binary_expression, $.unary_expression, $.instantiation_expression],
    [$.assignment_expression, $.pattern],
    [$.primary_expression, $.pattern],
    [$.primary_expression, $._parameter_name],
    [$.call_expression, $.await_expression, $.binary_expression, $.instantiation_expression],
    [$.array, $.array_pattern],
    [$.primary_type, $.type_parameter],
    [$.call_expression, $.binary_expression, $.update_expression, $.instantiation_expression],
    [$.primary_expression, $.rest_pattern],
    [$._for_header, $.primary_expression],
    [$.class],
    [$.class_static_block, $._property_name],
    [$.primary_expression, $.literal_type],
    [$.pattern, $.primary_type],
    [$.primary_expression, $.primary_type],
    [$.primary_expression, $.nested_identifier, $.nested_type_identifier],
    [$.primary_expression, $.generic_type],
    [$._parameter_name, $.primary_type],
    [$.primary_expression, $.predefined_type],
    [$._call_signature, $.function_type],
    [$.optional_tuple_parameter, $.primary_type],
    [$.call_expression, $.binary_expression, $.instantiation_expression],
    [$.object_assignment_pattern, $.assignment_expression],
    [$.array, $.computed_property_name],
    [$.variable_declarator, $._for_header],
    [$.object, $.object_pattern, $._property_name],
    [$.object_pattern, $.object_type],
    [$.object, $.object_type],
    [$.primary_expression, $.pattern, $.primary_type],
    [$.primary_expression, $._parameter_name, $.primary_type],
    [$.array, $.array_pattern, $.tuple_type],
    [$.array_pattern, $.tuple_type],
    [$.array, $.tuple_type],
    [$._call_signature, $.constructor_type],
    [$.template_string, $.template_literal_type],
    [$.object, $.object_pattern, $.object_type],
    [$.primary_expression, $.rest_pattern, $.primary_type],
    [$.primary_expression, $.rest_pattern, $.literal_type],
    [$.primary_expression, $.rest_pattern, $.predefined_type],
    [$.nested_identifier, $.nested_type_identifier],
    [$._initializer, $.binary_expression],
    [$.primary_expression, $._export_statement_namespace_export],
    [$.binary_expression, $.unary_expression, $.instantiation_expression, $._call_expression_call],
    [$.await_expression, $.binary_expression, $.instantiation_expression, $._call_expression_call],
    [$.binary_expression, $.update_expression, $.instantiation_expression, $._call_expression_call],
    [$.binary_expression, $.instantiation_expression, $._call_expression_call],
    [$._type_query_call_expression_in_type_annotation, $._call_expression_call],
    [$._type_query_call_expression, $._call_expression_call],
    [$.primary_expression, $._export_statement_default],
    // update_expression variant extraction: the hoisted
    // `_update_expression_postfix` / `_update_expression_prefix`
    // hidden rules inherit the outer `prec.left(0, ...)`, but after
    // extraction they compete with `await_expression` (prec
    // 'unary_void') on the `await expr • '++' …` / `'++' • expr`
    // sequences. Before the split, one `update_expression` rule
    // carried the whole choice under one prec declaration;
    // tree-sitter's LR table handled disambiguation internally.
    // After splitting, both hidden rules each have `prec 0` and
    // compete with `await_expression` individually — GLR is the
    // only resolver. Declare the conflict groups explicitly.
    [$.await_expression, $._update_expression_postfix],
    [$.await_expression, $._update_expression_prefix],
    [$.arrow_function, $._update_expression_postfix],
    [$.arrow_function, $._update_expression_prefix]
  ]),
  polymorphs: {
    arrow_function: { "1/0": "parameter", "1/1": "_call_signature" },
    class_heritage: { "0": "extends_clause", "1": "implements_clause" },
    import_clause: { "0": "namespace_import", "1": "named_imports", "2": "default_import" },
    import_specifier: { "1/0": "name", "1/1": "as" },
    index_signature: { "2/0": "colon", "2/1": "mapped_type_clause" }
  },
  transforms: {
    // abstract_class_declaration: wrap pos 5 (class_heritage choice).
    // pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
    // base-grammar field and the original override clobbered it.
    abstract_class_declaration: {
      5: field("class_heritage")
    },
    // abstract_method_signature: 2 field(s)
    abstract_method_signature: {
      0: field("accessibility_modifier"),
      // accessibility_modifier [struct=0]
      2: field("override_modifier")
      // override_modifier [struct=1]
    },
    // ambient_declaration: 3 field(s)
    ambient_declaration: {
      1: field("declaration")
      // declaration | statement_block | property_identifier [struct=0]
    },
    // array_type: 1 field(s)
    array_type: {
      0: field("primary_type")
      // primary_type [struct=0]
    },
    // as_expression: 2 field(s)
    as_expression: {
      0: field("expression"),
      // expression [struct=0]
      2: field("type_annotation")
      // type [struct=1]
    },
    // asserts_annotation: 1 field(s)
    asserts_annotation: {
      0: field("asserts")
      // asserts [struct=0]
    },
    // await_expression: 1 field(s)
    await_expression: {
      1: field("expression")
      // expression [struct=0]
    },
    // class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
    class: {
      4: field("class_heritage")
    },
    // class_declaration: wrap pos 4 (class_heritage choice) and pos 6
    // (automatic_semicolon choice). pos 0 is decorator repeat — leave it
    // alone so the base 'decorator' field survives.
    class_declaration: {
      4: field("class_heritage"),
      6: field("automatic_semicolon")
    },
    // computed_property_name: 1 field(s)
    computed_property_name: {
      1: field("expression")
      // expression [struct=0]
    },
    // else_clause: 1 field(s)
    else_clause: {
      1: field("statement")
      // statement [struct=0]
    },
    // enum_body: 2 field(s)
    enum_body: {
      1: field("opening")
      // enum_assignment [struct=0]
    },
    // flow_maybe_type: 1 field(s)
    flow_maybe_type: {
      1: field("primary_type")
      // primary_type [struct=0]
    },
    // import_alias: 3 field(s)
    import_alias: {
      1: field("name"),
      // identifier [struct=0]
      3: field("value"),
      // identifier | nested_identifier [struct=1]
      4: field("semicolon")
      //  [struct=2]
    },
    // import_attribute: 1 field(s)
    import_attribute: {
      0: field("object")
      // object [struct=0]
    },
    // import_require_clause: 1 field(s)
    import_require_clause: {
      0: field("identifier")
      // identifier [struct=0]
    },
    // import_statement: 4 field(s)
    import_statement: {
      1: field("import_clause"),
      // import_clause | import_require_clause [struct=0]
      2: field("from_clause"),
      //  [struct=1]
      3: field("import_attribute"),
      // import_attribute [struct=2]
      4: field("semicolon")
      //  [struct=3]
    },
    // index_type_query: 1 field(s)
    index_type_query: {
      1: field("primary_type")
      // primary_type [struct=0]
    },
    // infer_type: 2 field(s)
    infer_type: {
      1: field("type_identifier"),
      // _type_identifier | type_identifier [struct=0]
      2: field("constraint")
      // type | type_identifier [struct=1]
    },
    // instantiation_expression: 1 field(s)
    instantiation_expression: {
      0: field("expression")
      // expression [struct=0]
    },
    // interface_declaration: 1 field(s)
    interface_declaration: {
      3: field("extends_type_clause")
      // extends_type_clause [struct=0]
    },
    // intersection_type: 2 field(s)
    intersection_type: {
      0: field("left"),
      // type [struct=0]
      2: field("right")
      // type [struct=1]
    },
    // lexical_declaration: 2 field(s)
    lexical_declaration: {
      1: field("declarators"),
      // variable_declarator [struct=0]
      2: field("semicolon")
      //  [struct=1]
    },
    // lookup_type: 2 field(s)
    lookup_type: {
      0: field("primary_type"),
      // primary_type [struct=0]
      2: field("index_type")
      // type [struct=1]
    },
    // method_definition: 2 field(s)
    method_definition: {
      0: field("accessibility_modifier"),
      // accessibility_modifier [struct=0]
      1: field("override_modifier")
      // override_modifier [struct=1]
    },
    // method_signature: 2 field(s)
    method_signature: {
      0: field("accessibility_modifier"),
      // accessibility_modifier [struct=0]
      1: field("override_modifier")
      // override_modifier [struct=1]
    },
    // namespace_import: 1 field(s)
    namespace_import: {
      2: field("identifier")
      // identifier [struct=0]
    },
    // non_null_expression: 1 field(s)
    non_null_expression: {
      0: field("expression")
      // expression [struct=0]
    },
    // object_type: handled by refine() in rules: — see below.
    // program: 2 field(s)
    program: {
      0: field("hash_bang_line"),
      // hash_bang_line [struct=0]
      1: field("statements")
      // statement [struct=1]
    },
    // property_signature: 2 field(s)
    property_signature: {
      0: field("accessibility_modifier"),
      // accessibility_modifier [struct=0]
      1: field("override_modifier")
      // override_modifier [struct=1]
    },
    // satisfies_expression: 2 field(s)
    satisfies_expression: {
      0: field("expression"),
      // expression [struct=0]
      2: field("type_annotation")
      // type [struct=1]
    },
    // spread_element: 1 field(s)
    spread_element: {
      1: field("expression")
      // expression [struct=0]
    },
    // statement_block: 2 field(s)
    statement_block: {
      1: field("statements"),
      // statement [struct=0]
      3: field("automatic_semicolon")
      //  [struct=1]
    },
    // type_assertion: 2 field(s)
    type_assertion: {
      0: field("type_arguments"),
      // type_arguments [struct=0]
      1: field("expression")
      // expression [struct=1]
    },
    // type_predicate_annotation: 1 field(s)
    type_predicate_annotation: {
      0: field("type_predicate")
      // type_predicate [struct=0]
    },
    // union_type: 2 field(s)
    union_type: {
      0: field("left"),
      // type [struct=0]
      2: field("right")
      // type [struct=1]
    },
    // variable_declaration: 2 field(s)
    variable_declaration: {
      1: field("declarators"),
      // variable_declarator [struct=0]
      2: field("semicolon")
      //  [struct=1]
    },
    // yield_expression: 1 field(s)
    yield_expression: {
      1: field("expression")
      // expression [struct=0]
    },
    // expression_statement: label the trailing `_semicolon` so the
    // template emits `{{ semicolon }}`. Without the label, readNode
    // captures the anon `;` child but the parent template's
    // `{{ children | join(" ") }}` filters to NAMED-only children
    // and the `;` drops. Grammar: `seq(_expressions, _semicolon)`.
    expression_statement: {
      1: field("semicolon")
    },
    // type_alias_declaration: same semicolon-drop pattern. Grammar:
    // `seq('type', field('name'), optional(type_parameters), '=',
    // field('value'), _semicolon)` — label pos 5.
    type_alias_declaration: {
      5: field("semicolon")
    },
    // return_statement: seq('return', optional(_expressions),
    // _semicolon). Label pos 2.
    return_statement: {
      2: field("semicolon")
    },
    // throw_statement: seq('throw', _expressions, _semicolon).
    throw_statement: {
      2: field("semicolon")
    },
    // function_signature: seq(optional('async'), 'function',
    // field('name'), _call_signature, choice(_semicolon,
    // _function_signature_automatic_semicolon)). The trailing
    // choice carries the semi (either explicit or auto); labeling
    // pos 4 as a semicolon field lets it render.
    function_signature: {
      4: field("semicolon")
    },
    // break_statement: seq('break', field('label', optional(...)),
    // _semicolon). Label the trailing `;` at pos 2.
    break_statement: {
      2: field("semicolon")
    },
    // continue_statement: seq('continue', field('label', ...), _semicolon).
    continue_statement: {
      2: field("semicolon")
    },
    // debugger_statement: seq('debugger', _semicolon).
    debugger_statement: {
      1: field("semicolon")
    },
    // do_statement: seq('do', field('body'), 'while', field('condition'),
    // optional(_semicolon)). Optional wrapper at pos 4; labeling as
    // a semicolon field lets the template emit it when present.
    do_statement: {
      4: field("semicolon")
    },
    // parenthesized_expression: variant() adoption. Shape is
    // `seq('(', choice(typed_expr, sequence_expression), ')')`.
    // The inner choice's alternatives become variant-child kinds
    // that own the surrounding `(` / `)` scaffold via Link's
    // push-down; the parent template collapses to $$$CHILDREN.
    // Path 1/N targets choice alt N inside the seq's member 1.
    parenthesized_expression: {
      "1/0": variant("typed"),
      "1/1": variant("sequence")
    },
    // export_statement: variant() adoption on all four branches.
    // Path 0 is the JS-inherited `previous` (export default,
    // export function, export from, …); paths 1/2/3 are
    // `export type`, `export =`, `export as namespace`. Without
    // labeling path 0, its base-JS branches render without the
    // `export` prefix (parent template is just `$$$CHILDREN`,
    // which filters to named children) — the wrapper becomes
    // invisible at render time.
    //
    // `_export_statement_default`'s body is a top-level choice of
    // TWO structurally distinct shapes:
    //   arm 0 — `seq('export', choice(4 from-clause forms), _semicolon)`
    //   arm 1 — `seq(decorator, 'export', choice(declaration | default value))`
    // Splitting it further (e.g. `0/0` / `0/1` for these sub-arms)
    // just moves the non-canonical flag one level deeper — each
    // split arm STILL has inner choice-with-fields shapes
    // (specifiers, from-clause forms, default value). Adoption on
    // kinds synthesized by a parent polymorph adoption isn't
    // supported end-to-end, so deferred for future work. The
    // walker handles the shape via its per-branch + downgrade
    // logic correctly; the audit flag surfaces real adoption
    // opportunity but not a blocking bug.
    export_statement: {
      0: variant("default"),
      1: variant("type_export"),
      2: variant("equals_export"),
      3: variant("namespace_export")
    },
    // call_expression: variant() adoption on three per-prec
    // branches. Each branch is wrapped in `prec('call' |
    // 'template_call' | 'member')` and Link's variant hoist
    // re-wraps each extracted hidden rule in the same prec so the
    // base grammar's conflict resolution carries through.
    call_expression: {
      0: variant("call"),
      1: variant("template_call"),
      2: variant("member")
    },
    // string: variant() adoption on the quote-style choice. Base
    // grammar: `choice(seq('"', …, '"'), seq("'", …, "'"))`. The
    // walker's primary-branch-wins would always pick the first
    // (double-quoted) branch as the template, so `'x'` source
    // round-trips as `"x"` — AST mismatch. Splitting into variant
    // children (`string_double` / `string_single`) gives each its
    // own template that preserves the quote style.
    string: {
      0: variant("double"),
      1: variant("single")
    },
    // update_expression: postfix vs prefix `++` / `--`.
    update_expression: {
      0: variant("postfix"),
      1: variant("prefix")
    }
  },
  rules: {
    // parenthesized_expression: held. Base is plain `seq('(',
    // _expressions, ')')` with no outer prec — my hoist's prec
    // preservation captures OUTER wrappers, not per-alt prec. The
    // real conflict is that sequence_expression has its OWN
    // `prec.right(commaSep1(...))` that wins against a bare
    // expression alt; splitting exposes this as an unresolvable
    // tie. Fix would need the DSL to recognize per-alt prec inside
    // the choice and lift it to the variant rule — another
    // iteration.
    // export_statement: held. Base has no prec wrapper so prec-
    // preservation doesn't help. The conflict is deeper: `export`
    // as a keyword overlaps with its use as an identifier in
    // primary_expression, and tree-sitter resolves this via
    // internal state in the unsplit grammar. Splitting forces
    // the decision earlier, exposing the ambiguity.
    // call_expression: held. Each alt has its own per-branch prec
    // tag ('call'/'template_call'/'member') which prec-preservation
    // captures correctly, but the split exposes the base grammar's
    // call_expression vs binary_expression vs instantiation_
    // expression ambiguity on `typeof expr <` that the unsplit
    // rule resolves via LR state the base intentionally left
    // ambiguous. Fix would need explicit conflicts entries with
    // external rules — out of scope for variant() adoption.
    // optional_parameter: position 0 is the hidden `_parameter_name`
    // helper which tree-sitter inlines — its `decorator`, `pattern`, and
    // `name` fields promote onto the parent at parse time. The former
    // override wrapped pos 0 as a synthetic `parameter_name` slot that
    // doesn't exist at runtime, clobbering all five declared fields.
    // Positions 1/2/3 (the `?`, the type field, and the initializer)
    // are already correctly structured in the base rule.
    optional_parameter: ($, original) => original,
    // public_field_definition: pos 0 is decorator repeat (real base
    // field). The original override labeled pos 0 as
    // accessibility_modifier, clobbering decorator. Dropped entirely —
    // the internal accessibility/override-modifier slots are deep inside
    // nested choices and don't have stable raw positions.
    public_field_definition: ($, original) => original,
    // required_parameter: same shape as optional_parameter modulo the
    // `?` — drop the synthetic `parameter_name` wrapper override and
    // let the walker inline the `_parameter_name` helper's fields.
    required_parameter: ($, original) => original,
    // object_type / interface_body — correlated choice selection
    // across non-adjacent positions: the opening and closing
    // delimiters must agree (`{ }` pair is a curly object type;
    // `{| |}` pair is a flow object type). Refine declares two
    // named forms so factory callers can pick one and have both
    // literals auto-stamped:
    //   ir.objectType.curly({ members: [...] })  // {  }
    //   ir.objectType.flow ({ members: [...] })  // {| |}
    // The `transform(original, { ... })` inside adds the
    // `opening`/`members`/`closing` field labels that refine()'s
    // path segments (`'opening:'` / `'closing:'`) target. Both
    // object_type (primary rule) and interface_body (alias target)
    // share the same parse shape — both get the same treatment.
    object_type: ($, original) => refine(
      transform(original, {
        0: field("opening"),
        1: field("members"),
        2: field("closing")
      }),
      {
        curly: { "opening:": "{", "closing:": "}" },
        flow: { "opening:": "{|", "closing:": "|}" }
      }
    )
    // interface_body is a tree-sitter alias target of object_type —
    // it has no base rule of its own, so there's nothing to refine
    // via an override callback. It inherits the parse shape from
    // object_type. If per-form factory support for `interface_body`
    // is needed, a follow-up can add a codegen pass that mirrors
    // `object_type`'s refineForms onto the alias-target kind.
  }
}));
if (module.exports && module.exports.default) module.exports = module.exports.default;
