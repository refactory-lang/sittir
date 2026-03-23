import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class DeclarationListBuilder extends BaseBuilder<DeclarationList> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DeclarationList {
    return {
      kind: 'declaration_list',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as DeclarationList;
  }

  override get nodeKind(): string { return 'declaration_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function declaration_list(): DeclarationListBuilder {
  return new DeclarationListBuilder();
}
