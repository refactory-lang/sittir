import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LookupType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LookupTypeBuilder extends BaseBuilder<LookupType> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('lookup');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LookupType {
    return {
      kind: 'lookup_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LookupType;
  }

  override get nodeKind(): string { return 'lookup_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'lookup' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function lookup_type(children: Child[]): LookupTypeBuilder {
  return new LookupTypeBuilder(children);
}
