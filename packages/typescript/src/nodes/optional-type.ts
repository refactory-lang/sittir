import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptionalType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class OptionalTypeBuilder extends BaseBuilder<OptionalType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('?');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OptionalType {
    return {
      kind: 'optional_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OptionalType;
  }

  override get nodeKind(): string { return 'optional_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '?', type: '?' });
    return parts;
  }
}

export function optional_type(children: Child): OptionalTypeBuilder {
  return new OptionalTypeBuilder(children);
}
