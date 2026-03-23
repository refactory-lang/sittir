import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RestType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RestTypeBuilder extends BaseBuilder<RestType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('rest');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RestType {
    return {
      kind: 'rest_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RestType;
  }

  override get nodeKind(): string { return 'rest_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'rest' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function rest_type(children: Child): RestTypeBuilder {
  return new RestTypeBuilder(children);
}
