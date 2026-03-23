import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DynamicType } from '../types.js';


class DynamicTypeBuilder extends BaseBuilder<DynamicType> {
  private _trait: BaseBuilder;

  constructor(trait: BaseBuilder) {
    super();
    this._trait = trait;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('dyn');
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DynamicType {
    return {
      kind: 'dynamic_type',
      trait: this.renderChild(this._trait, ctx),
    } as unknown as DynamicType;
  }

  override get nodeKind(): string { return 'dynamic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'dyn', type: 'dyn' });
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    return parts;
  }
}

export function dynamic_type(trait: BaseBuilder): DynamicTypeBuilder {
  return new DynamicTypeBuilder(trait);
}
