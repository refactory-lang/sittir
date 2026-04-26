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
      if (t === "alias" || t === "ALIAS") {
        return descendThroughAlias(rule, head, rest, patch, precStack);
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
    case "fieldName": {
      throw new Error(`descendThroughSingleWrapper: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
    default: {
      const _exhaustive = head;
      throw new Error(`descendThroughSingleWrapper: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`);
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
      throw new Error(`descendThroughAlias: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
    default: {
      const _exhaustive = head;
      throw new Error(`descendThroughAlias: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`);
    }
  }
}
function reconstructAlias(rule, newContent) {
  return { ...rule, content: newContent };
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
    case "fieldName": {
      throw new Error(`applyToMembers: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
    default: {
      const _exhaustive = head;
      throw new Error(`applyToMembers: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`);
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
function wire(config2) {
  const context = {
    deposits: /* @__PURE__ */ new Map(),
    polymorphVariants: [],
    conflictGroups: [],
    refineForms: /* @__PURE__ */ new Map(),
    currentRuleKind: null
  };
  const polymorphs = config2.polymorphs ?? {};
  const transforms = config2.transforms ?? {};
  const outRules = { ...config2.rules };
  composeOrSynthesizeTransformParents(outRules, transforms);
  composeOrSynthesizePolymorphParents(outRules, polymorphs, context);
  injectHiddenRulePlaceholders(outRules, polymorphs, context);
  injectTransformHiddenRulePlaceholders(outRules, transforms, context);
  wrapAllRuleFns(outRules, context);
  const conflicts = wrapConflictsCallback(config2.conflicts, context);
  const wired = {
    ...config2,
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
  const ordered = [...variantEntries].sort(
    ([a], [b]) => parsePath(b).length - parsePath(a).length
  );
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
    const visibleName = polymorphVisibleName(parentKind, p.v.name);
    const hiddenName = polymorphHiddenName(parentKind, p.v.name);
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
  registerHoistedVariantConflicts(parsed.map((p) => polymorphHiddenName(parentKind, p.v.name)));
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
    const visibleName = polymorphVisibleName(parentKind, patch.name);
    const hiddenName = polymorphHiddenName(parentKind, patch.name);
    return registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack));
  }
  if (isAliasPlaceholder(patch)) {
    return resolveAliasPlaceholder(patch, originalMember, precStack);
  }
  return patch;
}
function resolveFieldPlaceholder(patch, originalMember, precStack) {
  let content = originalMember;
  if (isFieldLike(content) && content.source === "enriched") {
    if (!process.env.SITTIR_QUIET) {
      const parentKind = wireGetCurrentRuleKind() ?? "(unknown)";
      const overrideName = patch.name;
      const enrichName = content.name ?? "(unknown)";
      const tag = overrideName === enrichName ? `duplicate name ('${overrideName}')` : `override renames '${enrichName}' \u2192 '${overrideName}'`;
      process.stderr.write(
        `transform: override field('${overrideName}') on '${parentKind}' wraps an enrich-labeled FIELD \u2014 ${tag}. Drop the override entry if the names match; enrich will cover it automatically.
`
      );
    }
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
  return { ...base2, rules: mergedRules };
}
function applyEnrichPasses(ruleName, rule, kwRules, supertypeNames) {
  const MAX_ITERATIONS = 8;
  let r = rule;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = applySymbolToField(ruleName, r, supertypeNames);
    r = applyOptionalKeyword(ruleName, r, kwRules);
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
  const fn = root?.supertypes;
  if (typeof fn !== "function") return /* @__PURE__ */ new Set();
  const dollar = new Proxy({}, {
    get(_t, prop) {
      if (typeof prop === "string") return { type: "SYMBOL", name: prop };
      return void 0;
    }
  });
  let result;
  try {
    result = fn(dollar);
  } catch {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(result)) return /* @__PURE__ */ new Set();
  const names = /* @__PURE__ */ new Set();
  for (const r of result) {
    const n = r?.name;
    if (typeof n === "string") names.add(n);
  }
  return names;
}
function detectCase(referenceRule) {
  const t = referenceRule?.type ?? "";
  return t.length > 0 && t === t.toUpperCase() ? "upper" : "lower";
}
function makeField(referenceRule, name, content) {
  propagateFieldName(content, name);
  return {
    type: detectCase(referenceRule) === "upper" ? "FIELD" : "field",
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
function applySymbolToField(ruleName, rule, supertypeNames) {
  if (ruleName.startsWith("_")) return rule;
  const precStack = [];
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isSeqType(cursor.type)) return rule;
  const members = cursor.members;
  const kindCounts = /* @__PURE__ */ new Map();
  const targetByIdx = members.map(detectSymbolTarget);
  for (const t of targetByIdx) {
    if (t) kindCounts.set(t.name, (kindCounts.get(t.name) ?? 0) + 1);
  }
  const existing = collectFieldNamesRuntime(cursor);
  let changed = false;
  const newMembers = members.map((m, i) => {
    const t = targetByIdx[i];
    if (!t) return m;
    let fieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return m;
      fieldName = t.name.slice(1);
    }
    if ((kindCounts.get(t.name) ?? 0) > 1) return m;
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists`);
      return m;
    }
    existing.add(fieldName);
    changed = true;
    const fieldNode = makeField(cursor, fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  if (!changed) return rule;
  let result = { ...cursor, members: newMembers };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = { ...precStack[i], content: result };
  }
  return result;
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
    [$._visibility_modifier_pub]
  ],
  // Inline the synthesized hidden `_kw_async_marker` rule's body at
  // every reference site. Without inlining, `closure_expression`'s
  // `optional(_kw_async_marker)` (a SYMBOL ref to a `prec(-1, 'async')`
  // body) parses differently from `async_block`'s bare `'async'` token
  // — same lexeme, different LR state — and corpus inputs containing a
  // closure with an inner async_block (e.g. `async move || async move
  // {}`) regress to ERROR. Inlining folds the hidden rule's body into
  // closure_expression's state machine so the bare `'async'` token
  // surfaces directly in the LR table — restoring parity with the
  // pre-promotion shape — while the FIELD wrapper survives inlining
  // so the parse tree still surfaces the named `async_marker` field.
  // Wave-1 follow-up (016 task #27).
  inline: ($, previous) => [
    ...previous ?? [],
    $._kw_async_marker
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
    range_expression: { "0": "binary", "1": "postfix", "2": "prefix", "3": "bare" },
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
    range_pattern: { "0/1/0": "left_with_right", "0/1/1": "left_bare", "1": "prefix" },
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
  transforms: {
    // abstract_type: 1 field(s)
    abstract_type: {},
    // async_block: seq('async', optional('move'), $.block).
    // Field-promotion wave 1 (016 task #23): label the standalone
    // optional `move` punct as `move_marker` so render preserves it
    // (`async move { ... }` vs `async { ... }`).
    async_block: {
      "1/0": field("move_marker")
    },
    // array_expression polymorph splits '2/0' (semi) / '2/1' (list).
    // These base-shape patches add field labels BEFORE polymorph
    // aliasing — composition-order inversion in wire() lets this
    // flow declaratively instead of inline in rules:.
    array_expression: [
      { 1: field("attributes") },
      { "2/(_expression)": field("elements") }
    ],
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
    // them (`static async move |x| ...` vs `|x| ...`). prec is
    // transparent to path addressing. The `async_marker` promotion
    // requires `_kw_async_marker` to appear in the top-level
    // `inline:` array (see above) — without that, the synthesized
    // hidden symbol's runtime precedence diverges from
    // async_block's bare `'async'` token and `let a = async move
    // || async move {}` regresses to ERROR.
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
      "_": field("modifier")
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
    // Field-promotion wave 1 (016 task #23): symmetric to async_block —
    // label the optional `move` punct as `move_marker` so render
    // preserves it (`gen move { ... }` vs `gen { ... }`).
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
    //     and labels the bare literal.
    //   - pos 3/0/0 = `optional('!')` — the `!` in `impl !Send for X`
    //     (negative trait impl). Path `3/0/0/0` reaches the bare `!`
    //     literal inside the inner-seq's leading optional. Restores
    //     impl_item bang round-trip after the step-3 walker refactor
    //     deleted the punct-clause synthesis path.
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
    // it (`unsafe trait Foo { ... }` vs `trait Foo { ... }`).
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
    // type_item: 3 field(s)
    type_item: {
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
    // use_wildcard: 1 field(s)
    use_wildcard: {
      0: field("path")
      // crate | identifier | metavariable | scoped_identifier | self | super [struct=0]
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
    // match_arm: choice(seq(field('value',expr), ','),
    //                   field('value', prec(1, _expr_ending_with_block)))
    // The ','-terminated form vs block-ending form have distinct
    // literals. Split arms.
    match_arm: {
      "3/0": variant("with_comma"),
      "3/1": variant("block_ending")
    },
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
  }
};
var overrides_default = grammar(enrich(import_grammar.default), wire(config));
if (module.exports && module.exports.default) module.exports = module.exports.default;
