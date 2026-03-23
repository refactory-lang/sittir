import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayType, GenericType, HigherRankedTraitBound, PointerType, PrimitiveType, ReferenceType, ScopedTypeIdentifier, TraitBounds, TupleType, TypeIdentifier, WherePredicate } from '../types.js';


class WherePredicateBuilder extends Builder<WherePredicate> {
  private _bounds!: Builder<TraitBounds>;
  private _left: Builder<ArrayType | GenericType | HigherRankedTraitBound | PointerType | PrimitiveType | ReferenceType | ScopedTypeIdentifier | TupleType | TypeIdentifier>;

  constructor(left: Builder<ArrayType | GenericType | HigherRankedTraitBound | PointerType | PrimitiveType | ReferenceType | ScopedTypeIdentifier | TupleType | TypeIdentifier>) {
    super();
    this._left = left;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WherePredicate {
    return {
      kind: 'where_predicate',
      bounds: this._bounds?.build(ctx),
      left: this._left.build(ctx),
    } as WherePredicate;
  }

  override get nodeKind(): string { return 'where_predicate'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    return parts;
  }
}

export type { WherePredicateBuilder };

export function where_predicate(left: Builder<ArrayType | GenericType | HigherRankedTraitBound | PointerType | PrimitiveType | ReferenceType | ScopedTypeIdentifier | TupleType | TypeIdentifier>): WherePredicateBuilder {
  return new WherePredicateBuilder(left);
}

export interface WherePredicateOptions {
  bounds: Builder<TraitBounds>;
  left: Builder<ArrayType | GenericType | HigherRankedTraitBound | PointerType | PrimitiveType | ReferenceType | ScopedTypeIdentifier | TupleType | TypeIdentifier>;
}

export namespace where_predicate {
  export function from(options: WherePredicateOptions): WherePredicateBuilder {
    const b = new WherePredicateBuilder(options.left);
    if (options.bounds !== undefined) b.bounds(options.bounds);
    return b;
  }
}
