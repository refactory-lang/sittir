import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { AbstractType, ArrayType, Block, BoundedType, DynamicType, FunctionItem, FunctionModifiers, FunctionType, GenericType, Identifier, MacroInvocation, Metavariable, NeverType, Parameters, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, TypeParameters, UnitType, VisibilityModifier, WhereClause } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { parameters } from './parameters.js';
import type { ParametersOptions } from './parameters.js';
import { abstract_type } from './abstract-type.js';
import type { AbstractTypeOptions } from './abstract-type.js';
import { reference_type } from './reference-type.js';
import type { ReferenceTypeOptions } from './reference-type.js';
import { pointer_type } from './pointer-type.js';
import type { PointerTypeOptions } from './pointer-type.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { tuple_type } from './tuple-type.js';
import type { TupleTypeOptions } from './tuple-type.js';
import { array_type } from './array-type.js';
import type { ArrayTypeOptions } from './array-type.js';
import { function_type } from './function-type.js';
import type { FunctionTypeOptions } from './function-type.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';
import { dynamic_type } from './dynamic-type.js';
import type { DynamicTypeOptions } from './dynamic-type.js';
import { bounded_type } from './bounded-type.js';
import type { BoundedTypeOptions } from './bounded-type.js';
import { removed_trait_bound } from './removed-trait-bound.js';
import type { RemovedTraitBoundOptions } from './removed-trait-bound.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';
import { function_modifiers } from './function-modifiers.js';
import type { FunctionModifiersOptions } from './function-modifiers.js';
import { where_clause } from './where-clause.js';
import type { WhereClauseOptions } from './where-clause.js';


class FunctionBuilder extends Builder<FunctionItem> {
  private _name: Builder<Identifier | Metavariable>;
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters!: Builder<Parameters>;
  private _returnType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _body!: Builder<Block>;
  private _children: Builder<VisibilityModifier | FunctionModifiers | WhereClause>[] = [];

  constructor(name: Builder<Identifier | Metavariable>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  parameters(value: Builder<Parameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._returnType = value;
    return this;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier | FunctionModifiers | WhereClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('fn');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionItem {
    return {
      kind: 'function_item',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters ? this._parameters.build(ctx) : undefined,
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as FunctionItem;
  }

  override get nodeKind(): 'function_item' { return 'function_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: 'fn', type: 'fn' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FunctionBuilder };

export function function_(name: Builder<Identifier | Metavariable>): FunctionBuilder {
  return new FunctionBuilder(name);
}

export interface FunctionItemOptions {
  nodeKind: 'function_item';
  name: Builder<Identifier | Metavariable> | LeafOptions<'identifier'> | LeafOptions<'metavariable'>;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  parameters: Builder<Parameters> | Omit<ParametersOptions, 'nodeKind'>;
  returnType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  children?: Builder<VisibilityModifier | FunctionModifiers | WhereClause> | VisibilityModifierOptions | FunctionModifiersOptions | WhereClauseOptions | (Builder<VisibilityModifier | FunctionModifiers | WhereClause> | VisibilityModifierOptions | FunctionModifiersOptions | WhereClauseOptions)[];
}

export namespace function_ {
  export function from(options: Omit<FunctionItemOptions, 'nodeKind'>): FunctionBuilder {
    const _raw = options.name;
    let _ctor: Builder<Identifier | Metavariable>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'identifier': _ctor = new LeafBuilder('identifier', (_raw as LeafOptions).text!); break;
        case 'metavariable': _ctor = new LeafBuilder('metavariable', (_raw as LeafOptions).text!); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new FunctionBuilder(_ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : parameters.from(_v));
    }
    if (options.returnType !== undefined) {
      const _v = options.returnType;
      if (_v instanceof Builder) {
        b.returnType(_v);
      } else {
        switch (_v.nodeKind) {
          case 'abstract_type': b.returnType(abstract_type.from(_v)); break;
          case 'reference_type': b.returnType(reference_type.from(_v)); break;
          case 'pointer_type': b.returnType(pointer_type.from(_v)); break;
          case 'generic_type': b.returnType(generic_type.from(_v)); break;
          case 'scoped_type_identifier': b.returnType(scoped_type_identifier.from(_v)); break;
          case 'tuple_type': b.returnType(tuple_type.from(_v)); break;
          case 'array_type': b.returnType(array_type.from(_v)); break;
          case 'function_type': b.returnType(function_type.from(_v)); break;
          case 'macro_invocation': b.returnType(macro_invocation.from(_v)); break;
          case 'dynamic_type': b.returnType(dynamic_type.from(_v)); break;
          case 'bounded_type': b.returnType(bounded_type.from(_v)); break;
          case 'removed_trait_bound': b.returnType(removed_trait_bound.from(_v)); break;
        }
      }
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'visibility_modifier': return visibility_modifier.from(_v);   case 'function_modifiers': return function_modifiers.from(_v);   case 'where_clause': return where_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
