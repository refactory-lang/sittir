/**
 * compiler/rule-catalog.ts — Evaluate-owned rule occurrence identity.
 *
 * Evaluate is the first phase with a normalized rule tree, so it is the
 * only place that assigns foundational occurrence identity and rule
 * classification. Later phases may read these IDs and catalog entries,
 * but they should not reconstruct identity from local walks.
 */
import { assertNever } from '../polymorph-variant.js';
export function createEmptyRuleCatalog() {
    return {
        byId: new Map(),
        rootsByKind: new Map(),
        classificationById: new Map()
    };
}
export function buildRuleCatalog(rules, provenanceByKind = new Map()) {
    const byId = new Map();
    const rootsByKind = new Map();
    const classificationById = new Map();
    const identifiedRules = {};
    for (const ownerKind of Object.keys(rules).sort()) {
        const rule = rules[ownerKind];
        if (!rule)
            continue;
        const provenance = provenanceByKind.get(ownerKind) ?? 'grammar-authored';
        const result = identifyRule({
            rule,
            ownerKind,
            parentId: undefined,
            path: [],
            provenance,
            force: {},
            byId,
            classificationById
        });
        identifiedRules[ownerKind] = result.rule;
        rootsByKind.set(ownerKind, result.id);
    }
    return {
        rules: identifiedRules,
        ruleCatalog: { byId, rootsByKind, classificationById }
    };
}
export function attachReferenceRuleIds(references, ruleCatalog) {
    return references.map((ref) => {
        const fromRuleId = ruleCatalog.rootsByKind.get(ref.from);
        return fromRuleId ? { ...ref, fromRuleId } : { ...ref };
    });
}
function identifyRule(params) {
    const id = createRuleId(params.ownerKind, params.path);
    const children = identifyChildren(params, id);
    const childIds = children.map((child) => child.id);
    const rule = withIdentifiedChildren(params.rule, id, children);
    const classification = classifyRule(rule, id, children, params.force);
    params.byId.set(id, {
        id,
        ownerKind: params.ownerKind,
        ruleType: params.rule.type,
        parentId: params.parentId,
        path: params.path,
        childIds,
        provenance: params.provenance
    });
    params.classificationById.set(id, classification);
    return { rule, id, classification };
}
function identifyChildren(params, parentId) {
    const childParams = (rule, segment, force = {}) => identifyRule({
        rule,
        ownerKind: params.ownerKind,
        parentId,
        path: [...params.path, segment],
        provenance: params.provenance,
        force,
        byId: params.byId,
        classificationById: params.classificationById
    });
    switch (params.rule.type) {
        case 'seq':
        case 'choice':
            return params.rule.members.map((member, index) => childParams(member, { edge: 'members', index }));
        case 'enum':
            return params.rule.members.map((member, index) => childParams(member, { edge: 'members', index }));
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
        case 'token':
            return [childParams(params.rule.content, { edge: 'content' })];
        case 'field':
            return [
                childParams(params.rule.content, { edge: 'content' }, {
                    forcedBy: 'field',
                    edgeName: params.rule.name
                })
            ];
        case 'alias':
            return [
                childParams(params.rule.content, { edge: 'content' }, {
                    forcedBy: params.rule.named ? 'named-alias' : undefined,
                    cstSurface: params.rule.named ? 'named' : 'anonymous'
                })
            ];
        case 'polymorph':
            return params.rule.forms.map((form, index) => childParams(form.content, { edge: 'forms', index }));
        case 'supertype':
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
        case 'symbol':
            return [];
        default:
            return assertNever(params.rule);
    }
}
function withIdentifiedChildren(rule, id, children) {
    switch (rule.type) {
        case 'seq':
        case 'choice':
            return { ...rule, id, members: children.map((child) => child.rule) };
        case 'enum': {
            const members = children.map((child) => {
                if (child.rule.type !== 'string') {
                    throw new Error(`enum child ${child.id} is not a string rule`);
                }
                return child.rule;
            });
            return {
                ...rule,
                id,
                members
            };
        }
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
        case 'terminal':
        case 'field':
        case 'alias':
        case 'token':
            return { ...rule, id, content: children[0].rule };
        case 'polymorph':
            return {
                ...rule,
                id,
                forms: rule.forms.map((form, index) => ({
                    ...form,
                    content: children[index].rule
                }))
            };
        case 'supertype':
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
        case 'symbol':
            return { ...rule, id };
        default:
            return assertNever(rule);
    }
}
function classifyRule(rule, id, children, force) {
    const intrinsicKind = classifyIntrinsic(rule, children);
    const forcedKind = force.forcedBy === 'field' || force.forcedBy === 'named-alias' ? 'nonterminal' : intrinsicKind;
    return {
        ruleId: id,
        kind: forcedKind,
        ...(force.forcedBy ? { forcedBy: force.forcedBy } : {}),
        ...(force.edgeName ? { edgeName: force.edgeName } : {}),
        ...(force.cstSurface ? { cstSurface: force.cstSurface } : {})
    };
}
function classifyIntrinsic(rule, children) {
    switch (rule.type) {
        case 'symbol':
        case 'supertype':
            return 'nonterminal';
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
            return 'terminal';
        case 'token':
        case 'terminal':
            return 'terminal';
        case 'field':
        case 'alias':
        case 'seq':
        case 'choice':
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'enum':
        case 'group':
        case 'polymorph':
            return children.some((child) => child.classification.kind === 'nonterminal') ? 'nonterminal' : 'terminal';
        default:
            return assertNever(rule);
    }
}
function createRuleId(ownerKind, path) {
    if (path.length === 0)
        return `rule:${encodeURIComponent(ownerKind)}:root`;
    return `rule:${encodeURIComponent(ownerKind)}:${path.map(formatPathSegment).join('/')}`;
}
function formatPathSegment(segment) {
    switch (segment.edge) {
        case 'content':
            return 'content';
        case 'members':
        case 'forms':
            return `${segment.edge}.${segment.index}`;
        default:
            return assertNever(segment);
    }
}
//# sourceMappingURL=rule-catalog.js.map