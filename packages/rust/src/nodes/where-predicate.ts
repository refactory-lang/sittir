import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WherePredicate } from '../types.js';


class WherePredicateBuilder extends BaseBuilder<WherePredicate> {
  private _bounds: BaseBuilder;
  private _left!: BaseBuilder;

  constructor(bounds: BaseBuilder) {
    super();
    this._bounds = bounds;
  }

  left(value: BaseBuilder): this {
    this._left = value;
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
      bounds: this.renderChild(this._bounds, ctx),
      left: this._left ? this.renderChild(this._left, ctx) : undefined,
    } as unknown as WherePredicate;
  }

  override get nodeKind(): string { return 'where_predicate'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    return parts;
  }
}

export function where_predicate(bounds: BaseBuilder): WherePredicateBuilder {
  return new WherePredicateBuilder(bounds);
}
