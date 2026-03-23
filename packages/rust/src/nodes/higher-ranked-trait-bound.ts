import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { HigherRankedTraitBound, Type, TypeParameters } from '../types.js';


class HigherRankedTraitBoundBuilder extends Builder<HigherRankedTraitBound> {
  private _type!: Builder;
  private _typeParameters: Builder;

  constructor(typeParameters: Builder) {
    super();
    this._typeParameters = typeParameters;
  }

  type(value: Builder): this {
    this._type = value;
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
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      typeParameters: this.renderChild(this._typeParameters, ctx),
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

export type { HigherRankedTraitBoundBuilder };

export function higher_ranked_trait_bound(typeParameters: Builder): HigherRankedTraitBoundBuilder {
  return new HigherRankedTraitBoundBuilder(typeParameters);
}

export interface HigherRankedTraitBoundOptions {
  type: Builder<Type>;
  typeParameters: Builder<TypeParameters>;
}

export namespace higher_ranked_trait_bound {
  export function from(options: HigherRankedTraitBoundOptions): HigherRankedTraitBoundBuilder {
    const b = new HigherRankedTraitBoundBuilder(options.typeParameters);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
