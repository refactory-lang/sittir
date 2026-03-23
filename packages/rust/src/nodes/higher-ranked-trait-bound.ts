import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { HigherRankedTraitBound } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class HigherRankedTraitBoundBuilder extends BaseBuilder<HigherRankedTraitBound> {
  private _type: Child;
  private _typeParameters!: Child;

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): HigherRankedTraitBound {
    return {
      kind: 'higher_ranked_trait_bound',
      type: this.renderChild(this._type, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as HigherRankedTraitBound;
  }

  override get nodeKind(): string { return 'higher_ranked_trait_bound'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    return parts;
  }
}

export function higher_ranked_trait_bound(type_: Child): HigherRankedTraitBoundBuilder {
  return new HigherRankedTraitBoundBuilder(type_);
}
