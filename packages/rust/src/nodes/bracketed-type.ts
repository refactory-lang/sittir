import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, BracketedType, DynamicType, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, QualifiedType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType } from '../types.js';
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
import { qualified_type } from './qualified-type.js';
import type { QualifiedTypeOptions } from './qualified-type.js';


class BracketedTypeBuilder extends Builder<BracketedType> {
  private _children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType>[] = [];

  constructor(children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BracketedType {
    return {
      kind: 'bracketed_type',
      children: this._children[0]!.build(ctx),
    } as BracketedType;
  }

  override get nodeKind(): 'bracketed_type' { return 'bracketed_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { BracketedTypeBuilder };

export function bracketed_type(children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType>): BracketedTypeBuilder {
  return new BracketedTypeBuilder(children);
}

export interface BracketedTypeOptions {
  nodeKind: 'bracketed_type';
  children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | QualifiedTypeOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | QualifiedTypeOptions)[];
}

export namespace bracketed_type {
  export function from(input: Omit<BracketedTypeOptions, 'nodeKind'> | Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | QualifiedTypeOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | QualifiedTypeOptions)[]): BracketedTypeBuilder {
    const options: Omit<BracketedTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<BracketedTypeOptions, 'nodeKind'>
      : { children: input } as Omit<BracketedTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | QualifiedType>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'abstract_type': _resolved = abstract_type.from(_ctor); break;
        case 'reference_type': _resolved = reference_type.from(_ctor); break;
        case 'pointer_type': _resolved = pointer_type.from(_ctor); break;
        case 'generic_type': _resolved = generic_type.from(_ctor); break;
        case 'scoped_type_identifier': _resolved = scoped_type_identifier.from(_ctor); break;
        case 'tuple_type': _resolved = tuple_type.from(_ctor); break;
        case 'array_type': _resolved = array_type.from(_ctor); break;
        case 'function_type': _resolved = function_type.from(_ctor); break;
        case 'macro_invocation': _resolved = macro_invocation.from(_ctor); break;
        case 'dynamic_type': _resolved = dynamic_type.from(_ctor); break;
        case 'bounded_type': _resolved = bounded_type.from(_ctor); break;
        case 'removed_trait_bound': _resolved = removed_trait_bound.from(_ctor); break;
        case 'qualified_type': _resolved = qualified_type.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new BracketedTypeBuilder(_resolved);
    return b;
  }
}
