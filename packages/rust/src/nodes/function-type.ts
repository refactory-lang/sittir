import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, ForLifetimes, FunctionModifiers, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, Parameters, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType } from '../types.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
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
import { tuple_type } from './tuple-type.js';
import type { TupleTypeOptions } from './tuple-type.js';
import { array_type } from './array-type.js';
import type { ArrayTypeOptions } from './array-type.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';
import { dynamic_type } from './dynamic-type.js';
import type { DynamicTypeOptions } from './dynamic-type.js';
import { bounded_type } from './bounded-type.js';
import type { BoundedTypeOptions } from './bounded-type.js';
import { removed_trait_bound } from './removed-trait-bound.js';
import type { RemovedTraitBoundOptions } from './removed-trait-bound.js';
import { for_lifetimes } from './for-lifetimes.js';
import type { ForLifetimesOptions } from './for-lifetimes.js';
import { function_modifiers } from './function-modifiers.js';
import type { FunctionModifiersOptions } from './function-modifiers.js';


class FunctionTypeBuilder extends Builder<FunctionType> {
  private _trait?: Builder<TypeIdentifier | ScopedTypeIdentifier>;
  private _parameters: Builder<Parameters>;
  private _returnType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _children: Builder<ForLifetimes | FunctionModifiers>[] = [];

  constructor(parameters: Builder<Parameters>) {
    super();
    this._parameters = parameters;
  }

  trait(value: Builder<TypeIdentifier | ScopedTypeIdentifier>): this {
    this._trait = value;
    return this;
  }

  returnType(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._returnType = value;
    return this;
  }

  children(...value: Builder<ForLifetimes | FunctionModifiers>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionType {
    return {
      kind: 'function_type',
      trait: this._trait ? this._trait.build(ctx) : undefined,
      parameters: this._parameters.build(ctx),
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as FunctionType;
  }

  override get nodeKind(): 'function_type' { return 'function_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    return parts;
  }
}

export type { FunctionTypeBuilder };

export function function_type(parameters: Builder<Parameters>): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}

export interface FunctionTypeOptions {
  nodeKind: 'function_type';
  trait?: Builder<TypeIdentifier | ScopedTypeIdentifier> | string | Omit<ScopedTypeIdentifierOptions, 'nodeKind'>;
  parameters: Builder<Parameters> | Omit<ParametersOptions, 'nodeKind'>;
  returnType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  children?: Builder<ForLifetimes | FunctionModifiers> | ForLifetimesOptions | FunctionModifiersOptions | (Builder<ForLifetimes | FunctionModifiers> | ForLifetimesOptions | FunctionModifiersOptions)[];
}

export namespace function_type {
  export function from(options: Omit<FunctionTypeOptions, 'nodeKind'>): FunctionTypeBuilder {
    const _ctor = options.parameters;
    const b = new FunctionTypeBuilder(_ctor instanceof Builder ? _ctor : parameters.from(_ctor));
    if (options.trait !== undefined) {
      const _v = options.trait;
      b.trait(typeof _v === 'string' ? new LeafBuilder('type_identifier', _v) : _v instanceof Builder ? _v : scoped_type_identifier.from(_v));
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
          case 'macro_invocation': b.returnType(macro_invocation.from(_v)); break;
          case 'dynamic_type': b.returnType(dynamic_type.from(_v)); break;
          case 'bounded_type': b.returnType(bounded_type.from(_v)); break;
          case 'removed_trait_bound': b.returnType(removed_trait_bound.from(_v)); break;
        }
      }
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'for_lifetimes': return for_lifetimes.from(_v);   case 'function_modifiers': return function_modifiers.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
