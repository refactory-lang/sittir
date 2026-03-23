import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForeignModItem } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ForeignModBuilder extends BaseBuilder<ForeignModItem> {
  private _body?: Child;
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  body(value: Child): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForeignModItem {
    return {
      kind: 'foreign_mod_item',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ForeignModItem;
  }

  override get nodeKind(): string { return 'foreign_mod_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export function foreign_mod(children: Child[]): ForeignModBuilder {
  return new ForeignModBuilder(children);
}
