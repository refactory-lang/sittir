import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Label } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LabelBuilder extends BaseBuilder<Label> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('\'');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Label {
    return {
      kind: 'label',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Label;
  }

  override get nodeKind(): string { return 'label'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '\'', type: '\'' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function label(children: Child): LabelBuilder {
  return new LabelBuilder(children);
}
