import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TemplateLiteralType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TemplateLiteralTypeBuilder extends BaseBuilder<TemplateLiteralType> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('template literal');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TemplateLiteralType {
    return {
      kind: 'template_literal_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TemplateLiteralType;
  }

  override get nodeKind(): string { return 'template_literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'template literal' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function template_literal_type(): TemplateLiteralTypeBuilder {
  return new TemplateLiteralTypeBuilder();
}
