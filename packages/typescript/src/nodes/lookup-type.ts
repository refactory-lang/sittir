import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LookupType } from '../types.js';


class LookupTypeBuilder extends BaseBuilder<LookupType> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('[');
    parts.push(']');
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '[', type: '[' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export function lookup_type(children: BaseBuilder[]): LookupTypeBuilder {
  return new LookupTypeBuilder(children);
}
