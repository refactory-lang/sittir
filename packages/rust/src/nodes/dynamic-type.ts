import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DynamicType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class DynamicTypeBuilder extends BaseBuilder<DynamicType> {
  private _trait: Child;

  constructor(trait: Child) {
    super();
    this._trait = trait;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('dynamic');
    if (this._trait) parts.push(this.renderChild(this._trait, ctx), 'for');
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
    parts.push({ kind: 'token', text: 'dynamic' });
    if (this._trait) {
      parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
      parts.push({ kind: 'token', text: 'for' });
    }
    return parts;
  }
}

export function dynamic_type(trait: Child): DynamicTypeBuilder {
  return new DynamicTypeBuilder(trait);
}
