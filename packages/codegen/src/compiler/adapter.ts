/**
 * compiler/adapter.ts — Maps NodeMap → HydratedNodeModel[]
 *
 * Temporary bridge: lets existing emitters consume the new pipeline's output
 * without rewriting their internals. Each AssembledNode model type maps to
 * the corresponding HydratedNodeModel shape.
 *
 * This module will be eliminated once all emitters are rewritten to consume
 * AssembledNode directly.
 */

import type {
    NodeMap, AssembledNode, AssembledField, AssembledChild, AssembledForm,
    AssembledBranch, AssembledContainer, AssembledPolymorph,
    AssembledLeaf, AssembledKeyword, AssembledToken, AssembledEnum,
    AssembledSupertype, AssembledGroup,
} from './rule.ts'

// ---------------------------------------------------------------------------
// Adapted types — match HydratedNodeModel shape for emitter compatibility
// ---------------------------------------------------------------------------

interface AdaptedNodeBase {
    modelType: string
    kind: string
    typeName: string
    factoryName?: string
}

interface AdaptedField {
    name: string
    required: boolean
    multiple: boolean
    kinds: Set<string>
    propertyName: string
    position?: number
    override?: boolean
}

interface AdaptedChild {
    required: boolean
    multiple: boolean
    kinds: Set<string>
    name?: string
    separator?: string | null
}

interface AdaptedVariant {
    name: string
    detectToken?: string
    fields: Map<string, { required: boolean; multiple: boolean; contentKinds?: string[] }>
    template: string
    parts: string[]
    literals: Map<number, string>
    clauses: Array<{ name: string; template: string }>
    mergedRules?: any[]
}

export interface AdaptedBranchModel extends AdaptedNodeBase {
    modelType: 'branch'
    fields: AdaptedField[]
    children?: AdaptedChild | AdaptedChild[]
    rule: null
    variants?: AdaptedVariant[]
}

export interface AdaptedContainerModel extends AdaptedNodeBase {
    modelType: 'container'
    children: AdaptedChild | AdaptedChild[]
    rule: null
    variants?: AdaptedVariant[]
}

export interface AdaptedLeafModel extends AdaptedNodeBase {
    modelType: 'leaf'
    pattern: string | null
    rule: null
}

export interface AdaptedEnumModel extends AdaptedNodeBase {
    modelType: 'enum'
    values: string[]
    rule: null
}

export interface AdaptedKeywordModel extends AdaptedNodeBase {
    modelType: 'keyword'
    text: string
    rule: null
}

export interface AdaptedTokenModel extends AdaptedNodeBase {
    modelType: 'token'
    rule: null
}

export interface AdaptedSupertypeModel extends AdaptedNodeBase {
    modelType: 'supertype'
    subtypes: Set<string>
    rule: null
}

export type AdaptedNodeModel =
    | AdaptedBranchModel
    | AdaptedContainerModel
    | AdaptedLeafModel
    | AdaptedEnumModel
    | AdaptedKeywordModel
    | AdaptedTokenModel
    | AdaptedSupertypeModel

// ---------------------------------------------------------------------------
// toHydratedModels — main adapter function
// ---------------------------------------------------------------------------

export function toHydratedModels(nodeMap: NodeMap): AdaptedNodeModel[] {
    const result: AdaptedNodeModel[] = []

    for (const [_kind, node] of nodeMap.nodes) {
        const adapted = adaptNode(node)
        if (adapted) result.push(adapted)
    }

    return result
}

function adaptNode(node: AssembledNode): AdaptedNodeModel | null {
    switch (node.modelType) {
        case 'branch':
            return adaptBranch(node)
        case 'container':
            return adaptContainer(node)
        case 'polymorph':
            return adaptPolymorph(node)
        case 'leaf':
            return adaptLeaf(node)
        case 'keyword':
            return adaptKeyword(node)
        case 'token':
            return adaptToken(node)
        case 'enum':
            return adaptEnum(node)
        case 'supertype':
            return adaptSupertype(node)
        case 'group':
            return null // Groups have no AST node — skip
    }
}

function adaptBranch(node: AssembledBranch): AdaptedBranchModel {
    return {
        modelType: 'branch',
        kind: node.kind,
        typeName: node.typeName,
        factoryName: node.factoryName,
        fields: node.fields.map(adaptField),
        children: node.children ? adaptChildren(node.children) : undefined,
        rule: null,
    }
}

function adaptContainer(node: AssembledContainer): AdaptedContainerModel {
    return {
        modelType: 'container',
        kind: node.kind,
        typeName: node.typeName,
        factoryName: node.factoryName,
        children: adaptChildren(node.children),
        rule: null,
    }
}

function adaptPolymorph(node: AssembledPolymorph): AdaptedBranchModel {
    // Polymorphs map to branch models with variants
    // Collect all fields across forms as the union field set
    const allFields = new Map<string, AssembledField>()
    for (const form of node.forms) {
        for (const f of form.fields) {
            if (!allFields.has(f.name)) allFields.set(f.name, f)
        }
    }

    return {
        modelType: 'branch',
        kind: node.kind,
        typeName: node.typeName,
        factoryName: node.factoryName,
        fields: [...allFields.values()].map(adaptField),
        rule: null,
        variants: node.forms.map(adaptForm),
    }
}

function adaptLeaf(node: AssembledLeaf): AdaptedLeafModel {
    return {
        modelType: 'leaf',
        kind: node.kind,
        typeName: node.typeName,
        factoryName: node.factoryName,
        pattern: node.pattern ?? null,
        rule: null,
    }
}

function adaptKeyword(node: AssembledKeyword): AdaptedKeywordModel {
    return {
        modelType: 'keyword',
        kind: node.kind,
        typeName: node.typeName,
        factoryName: node.factoryName,
        text: node.text,
        rule: null,
    }
}

function adaptToken(node: AssembledToken): AdaptedTokenModel {
    return {
        modelType: 'token',
        kind: node.kind,
        typeName: node.typeName,
        rule: null,
    }
}

function adaptEnum(node: AssembledEnum): AdaptedEnumModel {
    return {
        modelType: 'enum',
        kind: node.kind,
        typeName: node.typeName,
        values: node.values,
        rule: null,
    }
}

function adaptSupertype(node: AssembledSupertype): AdaptedSupertypeModel {
    return {
        modelType: 'supertype',
        kind: node.kind,
        typeName: node.typeName,
        subtypes: new Set(node.subtypes),
        rule: null,
    }
}

// ---------------------------------------------------------------------------
// Sub-structure adapters
// ---------------------------------------------------------------------------

function adaptField(field: AssembledField): AdaptedField {
    return {
        name: field.name,
        required: field.required,
        multiple: field.multiple,
        kinds: new Set(field.contentTypes),
        propertyName: field.propertyName,
        override: field.source === 'override',
    }
}

function adaptChildren(children: AssembledChild[]): AdaptedChild | AdaptedChild[] {
    if (children.length === 1) {
        return adaptChild(children[0])
    }
    return children.map(adaptChild)
}

function adaptChild(child: AssembledChild): AdaptedChild {
    return {
        required: child.required,
        multiple: child.multiple,
        kinds: new Set(child.contentTypes),
        name: child.name,
    }
}

function adaptForm(form: AssembledForm): AdaptedVariant {
    const fields = new Map<string, { required: boolean; multiple: boolean; contentKinds?: string[] }>()
    for (const f of form.fields) {
        fields.set(f.name, {
            required: f.required,
            multiple: f.multiple,
            contentKinds: f.contentTypes,
        })
    }

    return {
        name: form.name,
        detectToken: form.detectToken,
        fields,
        template: '', // Template generation happens in emitter
        parts: [],
        literals: new Map(),
        clauses: [],
        mergedRules: form.mergedRules,
    }
}
