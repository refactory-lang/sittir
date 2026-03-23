import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { StringLiteral } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class StringLiteralBuilder extends BaseBuilder<StringLiteral> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('string');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StringLiteral {
    return {
      kind: 'string_literal',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as StringLiteral;
  }

  override get nodeKind(): string { return 'string_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'string' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function string_literal(): StringLiteralBuilder {
  return new StringLiteralBuilder();
}
