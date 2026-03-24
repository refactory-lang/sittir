import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, AttributeItem, BoundedType, DynamicType, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, Parameter, Parameters, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, SelfParameter, TupleType, TypeIdentifier, UnitType, VariadicParameter } from '../types.js';
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';
import { parameter } from './parameter.js';
import type { ParameterOptions } from './parameter.js';
import { self_parameter } from './self-parameter.js';
import type { SelfParameterOptions } from './self-parameter.js';
import { variadic_parameter } from './variadic-parameter.js';
import type { VariadicParameterOptions } from './variadic-parameter.js';
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


class ParametersBuilder extends Builder<Parameters> {
  private _children: Builder<AttributeItem | Parameter | SelfParameter | VariadicParameter | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>[] = [];

  constructor() { super(); }

  children(...value: Builder<AttributeItem | Parameter | SelfParameter | VariadicParameter | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Parameters {
    return {
      kind: 'parameters',
      children: this._children.map(c => c.build(ctx)),
    } as Parameters;
  }

  override get nodeKind(): 'parameters' { return 'parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ParametersBuilder };

export function parameters(): ParametersBuilder {
  return new ParametersBuilder();
}

export interface ParametersOptions {
  nodeKind: 'parameters';
  children?: Builder<AttributeItem | Parameter | SelfParameter | VariadicParameter | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AttributeItemOptions | ParameterOptions | SelfParameterOptions | VariadicParameterOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | (Builder<AttributeItem | Parameter | SelfParameter | VariadicParameter | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AttributeItemOptions | ParameterOptions | SelfParameterOptions | VariadicParameterOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions)[];
}

export namespace parameters {
  export function from(input: Omit<ParametersOptions, 'nodeKind'> | Builder<AttributeItem | Parameter | SelfParameter | VariadicParameter | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AttributeItemOptions | ParameterOptions | SelfParameterOptions | VariadicParameterOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | (Builder<AttributeItem | Parameter | SelfParameter | VariadicParameter | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AttributeItemOptions | ParameterOptions | SelfParameterOptions | VariadicParameterOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions)[]): ParametersBuilder {
    const options: Omit<ParametersOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ParametersOptions, 'nodeKind'>
      : { children: input } as Omit<ParametersOptions, 'nodeKind'>;
    const b = new ParametersBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'attribute_item': return attribute.from(_v);   case 'parameter': return parameter.from(_v);   case 'self_parameter': return self_parameter.from(_v);   case 'variadic_parameter': return variadic_parameter.from(_v);   case 'abstract_type': return abstract_type.from(_v);   case 'reference_type': return reference_type.from(_v);   case 'pointer_type': return pointer_type.from(_v);   case 'generic_type': return generic_type.from(_v);   case 'scoped_type_identifier': return scoped_type_identifier.from(_v);   case 'tuple_type': return tuple_type.from(_v);   case 'array_type': return array_type.from(_v);   case 'function_type': return function_type.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'dynamic_type': return dynamic_type.from(_v);   case 'bounded_type': return bounded_type.from(_v);   case 'removed_trait_bound': return removed_trait_bound.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
