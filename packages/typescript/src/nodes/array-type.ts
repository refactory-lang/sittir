import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArrayTypeBuilder extends BaseBuilder<ArrayType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('array');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayType {
    return {
      kind: 'array_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ArrayType;
  }

  override get nodeKind(): string { return 'array_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'array' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function array_type(children: Child): ArrayTypeBuilder {
  return new ArrayTypeBuilder(children);
}
