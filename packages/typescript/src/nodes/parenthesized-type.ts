import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedType } from '../types.js';


class ParenthesizedTypeBuilder extends BaseBuilder<ParenthesizedType> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedType {
    return {
      kind: 'parenthesized_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ParenthesizedType;
  }

  override get nodeKind(): string { return 'parenthesized_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function parenthesized_type(children: BaseBuilder): ParenthesizedTypeBuilder {
  return new ParenthesizedTypeBuilder(children);
}
