import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, QualifiedType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType } from '../types.js';
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


class QualifiedTypeBuilder extends Builder<QualifiedType> {
  private _type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _alias!: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;

  constructor(type_: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>) {
    super();
    this._type = type_;
  }

  alias(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push('as');
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): QualifiedType {
    return {
      kind: 'qualified_type',
      type: this._type.build(ctx),
      alias: this._alias ? this._alias.build(ctx) : undefined,
    } as QualifiedType;
  }

  override get nodeKind(): 'qualified_type' { return 'qualified_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { QualifiedTypeBuilder };

export function qualified_type(type_: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): QualifiedTypeBuilder {
  return new QualifiedTypeBuilder(type_);
}

export interface QualifiedTypeOptions {
  nodeKind: 'qualified_type';
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  alias: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
}

export namespace qualified_type {
  export function from(options: Omit<QualifiedTypeOptions, 'nodeKind'>): QualifiedTypeBuilder {
    const _raw = options.type;
    let _ctor: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'abstract_type': _ctor = abstract_type.from(_raw); break;
        case 'reference_type': _ctor = reference_type.from(_raw); break;
        case 'pointer_type': _ctor = pointer_type.from(_raw); break;
        case 'generic_type': _ctor = generic_type.from(_raw); break;
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'tuple_type': _ctor = tuple_type.from(_raw); break;
        case 'array_type': _ctor = array_type.from(_raw); break;
        case 'function_type': _ctor = function_type.from(_raw); break;
        case 'macro_invocation': _ctor = macro_invocation.from(_raw); break;
        case 'dynamic_type': _ctor = dynamic_type.from(_raw); break;
        case 'bounded_type': _ctor = bounded_type.from(_raw); break;
        case 'removed_trait_bound': _ctor = removed_trait_bound.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new QualifiedTypeBuilder(_ctor);
    if (options.alias !== undefined) {
      const _v = options.alias;
      if (_v instanceof Builder) {
        b.alias(_v);
      } else {
        switch (_v.nodeKind) {
          case 'abstract_type': b.alias(abstract_type.from(_v)); break;
          case 'reference_type': b.alias(reference_type.from(_v)); break;
          case 'pointer_type': b.alias(pointer_type.from(_v)); break;
          case 'generic_type': b.alias(generic_type.from(_v)); break;
          case 'scoped_type_identifier': b.alias(scoped_type_identifier.from(_v)); break;
          case 'tuple_type': b.alias(tuple_type.from(_v)); break;
          case 'array_type': b.alias(array_type.from(_v)); break;
          case 'function_type': b.alias(function_type.from(_v)); break;
          case 'macro_invocation': b.alias(macro_invocation.from(_v)); break;
          case 'dynamic_type': b.alias(dynamic_type.from(_v)); break;
          case 'bounded_type': b.alias(bounded_type.from(_v)); break;
          case 'removed_trait_bound': b.alias(removed_trait_bound.from(_v)); break;
        }
      }
    }
    return b;
  }
}
