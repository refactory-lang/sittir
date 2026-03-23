import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType } from '../types.js';


class AbstractTypeBuilder extends BaseBuilder<AbstractType> {
  private _trait: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(trait: BaseBuilder) {
    super();
    this._trait = trait;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('impl');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AbstractType {
    return {
      kind: 'abstract_type',
      trait: this.renderChild(this._trait, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AbstractType;
  }

  override get nodeKind(): string { return 'abstract_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'impl', type: 'impl' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    return parts;
  }
}

export function abstract_type(trait: BaseBuilder): AbstractTypeBuilder {
  return new AbstractTypeBuilder(trait);
}
