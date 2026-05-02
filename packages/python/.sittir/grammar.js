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

// ../python/overrides.ts
var overrides_exports = {};
__export(overrides_exports, {
  default: () => overrides_default
});
module.exports = __toCommonJS(overrides_exports);
var import_grammar = __toESM(require("tree-sitter-python/grammar.js"), 1);

// src/dsl/runtime-shapes.ts
function isSymbolLike(v) {
  if (!v || typeof v !== "object") return false;
  const t = v.type;
  if ((t === "symbol" || t === "SYMBOL") && typeof v.name === "string")
    return true;
  return extractSymbolName(v) !== void 0;
}
function extractSymbolName(v) {
  if (!v || typeof v !== "object") return void 0;
  const r = v;
  const t = r.type;
  if (isSymbolType(t)) return typeof r.name === "string" ? r.name : void 0;
  if (r.symbol && typeof r.symbol === "object") {
    return extractSymbolName(r.symbol);
  }
  return void 0;
}
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

// src/dsl/transform/transform-path.ts
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
    throw new Error(
      `parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`
    );
  }
  if (pathStr.startsWith("/") || pathStr.endsWith("/")) {
    throw new Error(
      `parsePath: leading/trailing slash not allowed in path '${pathStr}'`
    );
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
      throw new Error(
        `parsePath: path segment '*' is no longer valid \u2014 use '_' for wildcard; see ADR-0010`
      );
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
      throw new Error(
        `applyPath: unknown segment kind '${_exhaustive.kind}'`
      );
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
  const result = walkKindMatch(
    rule,
    targetKind,
    rest,
    patch,
    precStack,
    insideNamedField
  );
  if (!result.matched) {
    throw new ApplyPathSkip(
      `applyPath: kind '${targetKind}' matched zero occurrences in this subtree`
    );
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
    const inner = walkKindMatch(
      contentOf(rule),
      targetKind,
      rest,
      patch,
      stack,
      insideNamedField
    );
    return {
      rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (t === "symbol" || t === "SYMBOL") {
    return applyKindMatchToSymbol(
      rule,
      targetKind,
      rest,
      patch,
      precStack,
      insideNamedField
    );
  }
  if (t === "field" || t === "FIELD") {
    const inner = walkKindMatch(
      contentOf(rule),
      targetKind,
      rest,
      patch,
      precStack,
      true
    );
    return {
      rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (isWrapperType(t)) {
    const inner = walkKindMatch(
      contentOf(rule),
      targetKind,
      rest,
      patch,
      precStack,
      insideNamedField
    );
    return {
      rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (isContainerType(t)) {
    const members = [...membersOf(rule)];
    let anyMatched = false;
    for (let i = 0; i < members.length; i++) {
      const inner = walkKindMatch(
        members[i],
        targetKind,
        rest,
        patch,
        precStack,
        insideNamedField
      );
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
  const baseNode = nativeRequired(
    t === "repeat" || t === "REPEAT" ? "repeat" : "repeat1"
  )(newContent);
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
    if (typeof fn !== "function")
      throw new Error(`transform: native prec.${variant2} not available`);
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
      return applyToIndexedMember(
        rule,
        members,
        head.value,
        rest,
        patch,
        precStack
      );
    case "wildcard":
      return applyWildcardToMembers(rule, members, rest, patch, precStack);
    case "kind-match":
    case "fieldName": {
      throw new Error(
        `applyToMembers: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`
      );
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
    throw new ApplyPathSkip(
      `applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`
    );
  }
  members[idx] = applyPath(members[idx], rest, patch, precStack);
  return reconstructContainer(rule, members);
}
function applyWildcardToMembers(rule, members, rest, patch, precStack) {
  if (members.length === 0) {
    throw new ApplyPathSkip(
      `applyPath: wildcard matched zero members in empty ${rule.type}`
    );
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

// src/dsl/primitives/variant.ts
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name) {
  return { __sittirPlaceholder: "variant", name };
}

// src/dsl/primitives/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}

// src/dsl/wire/wire.ts
var currentContext = null;
function wireRegisterSyntheticRule(name, content) {
  if (!currentContext) return false;
  currentContext.deposits.set(name, content);
  return true;
}
function wireRegisterPolymorphVariant(parent, child) {
  if (!currentContext) return false;
  const exists = currentContext.polymorphVariants.some(
    (v) => v.parent === parent && v.child === child
  );
  if (!exists) {
    currentContext.polymorphVariants.push({ parent, child });
  }
  return true;
}
function wireRegisterConflict(names) {
  if (!currentContext) return false;
  if (names.length === 0) return true;
  const key = names.join("\0");
  const exists = currentContext.conflictGroups.some(
    (g) => g.join("\0") === key
  );
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
  composeOrSynthesizePolymorphParents(outRules, polymorphs, context);
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
    return transform(
      base2,
      patches
    );
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
    return transform(
      base2,
      ...patchSets
    );
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
    if (!(hiddenName in rules))
      rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
  if (isVariantPlaceholder(value)) {
    const hiddenName = `_${parentKind}_${value.name}`;
    if (!(hiddenName in rules))
      rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
  if (isAliasPlaceholder(value)) {
    const hiddenName = `_${value.name}`;
    if (!(hiddenName in rules))
      rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
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
    const symbolized = context.conflictGroups.map(
      (group) => group.map((name) => symbolizeRef($, name))
    );
    return [...base2, ...symbolized];
  };
}
function symbolizeRef(_$, name) {
  return { type: "SYMBOL", name };
}

// src/dsl/primitives/field.ts
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
      const blankIdx = members.findIndex(
        (m) => m?.type === "BLANK" || m?.type === "blank"
      );
      if (blankIdx !== -1) {
        return descendOptional(
          fieldName,
          content,
          wrapSyntheticBody,
          "choice-blank"
        );
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
    throw new Error(
      `field('${fieldName}', <STRING>): no active wire() context \u2014 call must occur inside a rule callback wrapped by wire()`
    );
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
    const nonBlank = members.find(
      (m) => m.type !== "BLANK" && m.type !== "blank"
    );
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
  const newMembers = c.members.map(
    (m) => m.type === "BLANK" || m.type === "blank" ? m : rewritten
  );
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

// src/dsl/transform/transform.ts
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = requiresPathMode(patches);
    const hasPlaceholderAlias = Object.values(patches).some(
      (v) => isAliasPlaceholder(v) || isVariantPlaceholder(v)
    );
    if (hasPathKeys || hasPlaceholderAlias) {
      rule = applyPathPatches(rule, patches);
    } else {
      rule = applyFlatPatches(
        rule,
        patches
      );
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
    rule = applyPath(
      rule,
      segments,
      (member, precStack) => resolvePatch(value, member, precStack)
    );
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
      result2 = applyPath(
        result2,
        segments,
        (member, precStack) => resolvePatch(value, member, precStack)
      );
    }
    return result2;
  }
  let result = rule;
  for (const [key, value] of ordered) {
    const segments = parsePath(key);
    result = applyPath(
      result,
      segments,
      (member, precStack) => resolvePatch(value, member, precStack)
    );
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
  const choice = seqMembers[resolvedPos];
  if (!choice || !isChoiceType(choice.type))
    return bail(
      `position ${resolvedPos} is '${choice?.type}', not choice/CHOICE`
    );
  const choiceMembers = membersOf2(choice);
  const anyEmpty = parsed.some(
    (p) => matchesEmpty(
      choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx]
    )
  );
  if (!anyEmpty) return null;
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind)
    return bail(
      "no current rule kind (variant()/transform() called outside rule callback?)"
    );
  return buildHoistedVariants(
    core,
    seqMembers,
    choiceMembers,
    resolvedPos,
    choice,
    parsed,
    parentKind,
    precStack
  );
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
    if (segs.length !== 2)
      return bail(
        `variant patch '${key}' has ${segs.length} segments (expected 2: N/M)`
      );
    if (segs[0].kind !== "index" || segs[1].kind !== "index")
      return bail(
        `variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`
      );
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
    const hoistedMembers = seqMembers.map(
      (m, i) => i === resolvedPos ? altContent : m
    );
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
      throw new Error(
        `registerSyntheticRule('${hiddenName}'): no active wire() context`
      );
    }
    refs.push({
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: visibleName
    });
  }
  registerHoistedVariantConflicts(
    parsed.map((p) => polymorphHiddenName(parentKind, p.v.name))
  );
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
    const newMembers = membersOf2(original).map(
      (m) => applyFlatPatches(m, patches)
    );
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
      throw new Error(
        `variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`
      );
    }
    if (!wireRegisterPolymorphVariant(parentKind, patch.name)) {
      throw new Error(
        `variant('${patch.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`
      );
    }
    const visibleName = polymorphVisibleName(parentKind, patch.name);
    const hiddenName = polymorphHiddenName(parentKind, patch.name);
    return registerAliasedVariant(
      hiddenName,
      visibleName,
      originalMember,
      (body) => wrapInPrec(body, precStack)
    );
  }
  if (isAliasPlaceholder(patch)) {
    return resolveAliasPlaceholder(patch, originalMember, precStack);
  }
  return patch;
}
function resolveFieldPlaceholder(patch, originalMember, precStack) {
  let content = originalMember;
  if (isFieldLike(content) && (content.source === "enriched" || content.source === "inferred")) {
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
    throw new Error(
      "transform: no global field() found \u2014 patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  const result = native(patch.name, content);
  return { ...result, source: "override" };
}
function resolveAliasPlaceholder(patch, originalMember, precStack) {
  const hiddenName = "_" + patch.name;
  return registerAliasedVariant(
    hiddenName,
    patch.name,
    originalMember,
    (body) => wrapInPrec(body, precStack)
  );
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
    throw new Error(
      `registerSyntheticRule('${hiddenName}'): no active wire() context`
    );
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
      throw new Error(
        "transform: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()"
      );
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
    const members = [
      ...rule.members
    ];
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

// src/dsl/primitives/role.ts
var currentRoles = null;
var VALID_ROLE_NAMES = /* @__PURE__ */ new Set(["indent", "dedent", "newline"]);
function role(symbol, roleName) {
  if (!isSymbolLike(symbol)) {
    throw new Error(
      `role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol)}`
    );
  }
  if (!VALID_ROLE_NAMES.has(roleName)) {
    throw new Error(
      `role(): second argument must be one of 'indent' | 'dedent' | 'newline', got ${JSON.stringify(roleName)}`
    );
  }
  if (currentRoles !== null) {
    currentRoles.set(symbol.name, { role: roleName });
  }
  return symbol;
}

// src/dsl/enrich.ts
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
    if (r === before) return r;
  }
  if (!process.env.SITTIR_QUIET) {
    process.stderr.write(
      `enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations
`
    );
  }
  return r;
}
function extractSupertypeNames(base2, hasWrapper) {
  const root = hasWrapper ? base2.grammar : base2;
  const fn = root?.supertypes;
  if (typeof fn !== "function") return /* @__PURE__ */ new Set();
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
    if (Array.isArray(r.members))
      for (const m of r.members) propagateFieldName(m, fieldName);
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
    return {
      inner: rule.content,
      isOptional: true
    };
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    if (members.length === 2) {
      const blankIdx = members.findIndex(
        (m) => m.type === "BLANK" || m.type === "blank"
      );
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
      const newSeqMembers = seqMembers.map(
        (mm, i) => i === symIdx ? fieldNode : mm
      );
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
  if (!isSeqType(cursor.type)) return rule;
  const members = cursor.members;
  const kindCounts = /* @__PURE__ */ new Map();
  const targetByIdx = members.map(detectSymbolTarget);
  for (const t of targetByIdx) {
    if (t) kindCounts.set(t.name, (kindCounts.get(t.name) ?? 0) + 1);
  }
  for (const m of members) {
    countSymbolsInRepeat(m, kindCounts);
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
      reportSkip(
        "symbol-to-field",
        ruleName,
        `field '${fieldName}' already exists`
      );
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
    const replacement = tryPromoteInnerKeyword(
      ruleName,
      rule,
      peeled.inner,
      claimedAtSeqLevel,
      kwRules
    );
    if (replacement !== null) return replacement;
    const innerRewritten = walkOptionalKeyword(
      ruleName,
      peeled.inner,
      claimedAtSeqLevel,
      kwRules
    );
    if (innerRewritten !== null) {
      return rebuildOptional(rule, innerRewritten);
    }
    return null;
  }
  if (isRepeatType(rule.type) || isFieldType(rule.type)) {
    const content = rule.content;
    const out = walkOptionalKeyword(
      ruleName,
      content,
      claimedAtSeqLevel,
      kwRules
    );
    if (out === null) return null;
    return { ...rule, content: out };
  }
  if (isPrecWrapper(rule)) {
    const content = rule.content;
    const out = walkOptionalKeyword(
      ruleName,
      content,
      claimedAtSeqLevel,
      kwRules
    );
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
    reportSkip(
      "optional-keyword-prefix",
      ruleName,
      `field '${fieldName}' already exists`
    );
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

// ../python/overrides.ts
var overrides_default = grammar(
  enrich(import_grammar.default),
  wire({
    name: "python",
    // Structural-whitespace role bindings — declared inline in the
    // externals callback. `role(symbolRef, name)` returns the symbol
    // unchanged (so externals still receives a valid token reference)
    // and records the binding on a per-grammar accumulator that Link
    // reads to drive symbol resolution. No more dummy `_indent` rules.
    externals: ($, prev) => {
      role($._indent, "indent");
      role($._dedent, "dedent");
      role($._newline, "newline");
      return prev;
    },
    conflicts: ($, previous) => [
      ...previous ?? [],
      // expression_statement tuple-variant extraction: the bare
      // `expression` arm and the hoisted `_expression_statement_tuple`
      // both start with `expression • …`. In the base grammar
      // tree-sitter's LR(1) table merged the common prefix into a
      // single state; with the tuple form lifted into its own hidden
      // rule, tree-sitter needs an explicit GLR fork group to decide
      // between the bare expression and the tuple form on the `,`
      // suffix that only the tuple accepts.
      [$.expression_statement, $._expression_statement_tuple]
    ],
    polymorphs: {
      assignment: { "1/0": "eq", "1/1": "type", "1/2": "typed" },
      // expression_statement: bare expression / comma-separated tuple
      // form / assignment / augmented_assignment / yield. Arms 0, 2,
      // 3, 4 are bare symbol refs to existing visible kinds — the
      // classifier treats the all-symbol shape as canonical, so they
      // need no adoption. Arm 1 is the structural seq (tuple form);
      // adopting it wraps the seq in an alias so the rule becomes an
      // all-symbol choice from the walker's perspective. The
      // `conflicts` entry above tells tree-sitter to fork between
      // `expression` and `_expression_statement_tuple` when the LR
      // table sees `expression • …` and needs to decide on the `,`
      // continuation only the tuple form accepts.
      expression_statement: {
        1: "tuple"
      },
      // with_clause: bare (`a, b, c`) vs parenthesized (`(a, b, c)`).
      // Same with_item content on both arms; paren form wraps with
      // '(' ... ')'. Split per variant so each owns its template.
      with_clause: {
        0: "bare",
        1: "paren"
      },
      // _match_block: base rule is
      //   choice(
      //     seq($._indent, repeat(field('alternative', $.case_clause)),
      //         $._dedent),                         // arm 0 — block form
      //     $._newline,                             // arm 1 — empty form
      //   )
      // Heterogeneous: one seq + one bare symbol. Splitting the seq arm
      // into `_match_block_block` leaves the remaining choice as all
      // symbol-like (alias + symbol) — canonical.
      _match_block: { 0: "block" },
      // dict_pattern: base rule is
      //   seq('{', optional(seq(
      //     commaSep1(choice($._key_value_pattern, $.splat_pattern)),
      //     optional(','),
      //   )), '}')
      // liftCommaSep converts the commaSep1 into a repeat1 with
      // separator, so after simplify the path to the heterogeneous
      // choice is 1/0/0 (optional → seq → repeat1 → choice). One arm is
      // the inlined `_key_value_pattern` seq (tree-sitter wraps the
      // hidden rule in an alias); the other is `splat_pattern`.
      // Splitting the key-value arm into `dict_pattern_kv` leaves the
      // remaining choice all symbol-like. Requires infra (B)'s alias
      // descent in applyPath.
      dict_pattern: { "1/0/0/0": "kv" },
      // _simple_pattern: base rule is
      //   prec(1, choice(
      //     class_pattern,               ← 0
      //     splat_pattern,               ← 1
      //     union_pattern,               ← 2
      //     alias(_list_pattern, …),     ← 3
      //     alias(_tuple_pattern, …),    ← 4
      //     dict_pattern,                ← 5
      //     string,                      ← 6
      //     concatenated_string,         ← 7
      //     true,                        ← 8
      //     false,                       ← 9
      //     none,                        ← 10
      //     seq(optional('-'),           ← 11 — negative literal arm
      //         choice(integer, float)),
      //     complex_pattern,             ← 12
      //     dotted_name,                 ← 13
      //     '_',                         ← 14
      //   ))
      // Arm 11 is a SEQ containing an optional anonymous '-' token.
      // The anonymous token is not a named child, so the parent template
      // `{{ children | join(" ") }}` renders only the integer/float,
      // silently dropping '-' for negative patterns like `-1` or `-1.0`.
      // Adopting arm 11 as `simple_pattern_negative` (visible kind,
      // leading '_' stripped per polymorphVisibleName convention) gives it
      // its own template that includes the '-' prefix literal.
      //
      // Note: `_simple_pattern` is a hidden rule, so no conflicts entry
      // is needed — tree-sitter inlines it into parent rules directly.
      // The visible variant kind is `simple_pattern_negative`.
      _simple_pattern: { "11": "negative" }
    },
    transforms: {
      // as_pattern: 1 field(s)
      as_pattern: {},
      // await: 1 field(s)
      await: {},
      // chevron: 1 field(s)
      chevron: {},
      // class_pattern: 2 field(s)
      class_pattern: {
        2: field("arguments")
        // case_pattern [struct=1]
      },
      // comparison_operator: 2 field(s)
      comparison_operator: {
        0: field("left"),
        // primary_expression [struct=0]
        1: field("comparators")
        // primary_expression [struct=1]
      },
      // complex_pattern: 2 field(s)
      complex_pattern: {
        0: field("real"),
        // integer | float [struct=0]
        1: field("imaginary")
        // integer | float [struct=1]
      },
      // conditional_expression: 3 field(s)
      conditional_expression: {
        0: field("body"),
        // expression [struct=0]
        2: field("condition"),
        // expression [struct=1]
        4: field("alternative")
        // expression [struct=2]
      },
      // constrained_type: 2 field(s)
      constrained_type: {
        0: field("base_type"),
        // type [struct=0]
        2: field("constraint")
        // type [struct=1]
      },
      // decorator: 2 field(s)
      decorator: {
        2: field("newline")
        //  [struct=1]
      },
      // dictionary_splat: 1 field(s)
      dictionary_splat: {},
      // exec_statement: grammar is seq('exec', code, optional(seq('in', exprs)))
      // Template walker emits the `in` keyword as a literal at top level,
      // which surfaces in rendering even when the optional(seq(...))
      // didn't match. Wrap the optional as field('in_clause') so the
      // whole clause (`in` + exprs) renders only when present.
      exec_statement: {
        2: field("in_clause")
      },
      // for_statement / function_definition / with_statement: each
      // starts with `optional('async')` at pos 0. Auto-promoted by
      // enrich (016 task #30) as `field('async_marker', SYMBOL(_kw_async_marker))`.
      // Wave 2's manual entries are now redundant.
      // for_in_clause: prec.left(seq(optional('async'), 'for', ...)).
      // The prec.left wrapper hides the seq from enrich's auto-promotion
      // walker, so the position is still hand-promoted (016 task #30
      // naming convention).
      for_in_clause: {
        "0/0": field("async_marker")
      },
      // finally_clause: 1 field(s)
      finally_clause: {
        2: field("block")
        // block [struct=0]
      },
      // generic_type: 2 field(s)
      generic_type: {
        0: field("identifier")
        // identifier [struct=0]
      },
      // if_clause: 1 field(s)
      if_clause: {},
      // import_from_statement: 1 field(s)
      import_from_statement: {
        3: field("wildcard_import")
        // wildcard_import [struct=0]
      },
      // keyword_pattern: 2 field(s)
      keyword_pattern: {
        2: field("simple_pattern")
        // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
      },
      // list_splat: 1 field(s)
      list_splat: {},
      // member_type: 2 field(s)
      member_type: {
        0: field("base_type")
        // type [struct=0]
      },
      // relative_import: 2 field(s)
      relative_import: {},
      // slice: 3 field(s)
      slice: {
        0: field("start"),
        // expression [struct=0]
        2: field("stop"),
        // expression [struct=1]
        3: field("step")
        // expression [struct=2]
      },
      // splat_pattern: 1 field(s)
      splat_pattern: {
        0: field("identifier")
        // identifier [struct=0]
      },
      // splat_type: 1 field(s)
      splat_type: {
        0: field("identifier")
        // identifier [struct=0]
      },
      // string: 3 field(s)
      string: {
        1: field("content")
        // interpolation | string_content [struct=1]
      },
      // type_alias_statement: wrap base position 0 (bare 'type' literal)
      // as field('type') so $fields.type carries the keyword. Without
      // this override, enrich's bare-leading-keyword pass (globally off
      // — rust corpus regresses with it on) leaves the literal
      // unwrapped, and $fields only has left/right. The spec-008-US7
      // regression test (python type_alias_statement collision)
      // assumes the wrapped form.
      type_alias_statement: {
        0: field("type")
      },
      // try_statement: 3 field(s)
      try_statement: {
        3: field("except_clauses")
        // except_clause [struct=0]
      },
      // union_type: 2 field(s)
      union_type: {
        0: field("left"),
        // type [struct=0]
        2: field("right")
        // type [struct=1]
      }
    },
    rules: {}
  })
);
if (module.exports && module.exports.default) module.exports = module.exports.default;
