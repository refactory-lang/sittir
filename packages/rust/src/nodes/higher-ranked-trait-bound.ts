import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { HigherRankedTraitBound } from '../types.js';


class HigherRankedTraitBoundBuilder extends BaseBuilder<HigherRankedTraitBound> {
  private _type: BaseBuilder;
  private _typeParameters!: BaseBuilder;

  constructor(type_: BaseBuilder) {
    super();
    this._type = type_;
  }

  typeParameters(value: BaseBuilder): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
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
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function higher_ranked_trait_bound(type_: BaseBuilder): HigherRankedTraitBoundBuilder {
  return new HigherRankedTraitBoundBuilder(type_);
}
