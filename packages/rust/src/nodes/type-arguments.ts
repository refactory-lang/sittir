import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, Block, BooleanLiteral, BoundedType, CharLiteral, DynamicType, FloatLiteral, FunctionType, GenericType, IntegerLiteral, Lifetime, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, RawStringLiteral, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, StringLiteral, TraitBounds, TupleType, TypeArguments, TypeBinding, TypeIdentifier, UnitType } from '../types.js';
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
import { type_binding } from './type-binding.js';
import type { TypeBindingOptions } from './type-binding.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { trait_bounds } from './trait-bounds.js';
import type { TraitBoundsOptions } from './trait-bounds.js';


class TypeArgumentsBuilder extends Builder<TypeArguments> {
  private _children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds>[] = [];

  constructor(...children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeArguments {
    return {
      kind: 'type_arguments',
      children: this._children.map(c => c.build(ctx)),
    } as TypeArguments;
  }

  override get nodeKind(): 'type_arguments' { return 'type_arguments'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { TypeArgumentsBuilder };

export function type_arguments(...children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds>[]): TypeArgumentsBuilder {
  return new TypeArgumentsBuilder(...children);
}

export interface TypeArgumentsOptions {
  nodeKind: 'type_arguments';
  children?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | TypeBindingOptions | LifetimeOptions | StringLiteralOptions | RawStringLiteralOptions | BlockOptions | TraitBoundsOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | TypeBindingOptions | LifetimeOptions | StringLiteralOptions | RawStringLiteralOptions | BlockOptions | TraitBoundsOptions)[];
}

export namespace type_arguments {
  export function from(input: Omit<TypeArgumentsOptions, 'nodeKind'> | Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | TypeBindingOptions | LifetimeOptions | StringLiteralOptions | RawStringLiteralOptions | BlockOptions | TraitBoundsOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | TypeBinding | Lifetime | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | TraitBounds> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | TypeBindingOptions | LifetimeOptions | StringLiteralOptions | RawStringLiteralOptions | BlockOptions | TraitBoundsOptions)[]): TypeArgumentsBuilder {
    const options: Omit<TypeArgumentsOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeArgumentsOptions, 'nodeKind'>
      : { children: input } as Omit<TypeArgumentsOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TypeArgumentsBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'abstract_type': return abstract_type.from(_v);   case 'reference_type': return reference_type.from(_v);   case 'pointer_type': return pointer_type.from(_v);   case 'generic_type': return generic_type.from(_v);   case 'scoped_type_identifier': return scoped_type_identifier.from(_v);   case 'tuple_type': return tuple_type.from(_v);   case 'array_type': return array_type.from(_v);   case 'function_type': return function_type.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'dynamic_type': return dynamic_type.from(_v);   case 'bounded_type': return bounded_type.from(_v);   case 'removed_trait_bound': return removed_trait_bound.from(_v);   case 'type_binding': return type_binding.from(_v);   case 'lifetime': return lifetime.from(_v);   case 'string_literal': return string_literal.from(_v);   case 'raw_string_literal': return raw_string_literal.from(_v);   case 'block': return block.from(_v);   case 'trait_bounds': return trait_bounds.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
