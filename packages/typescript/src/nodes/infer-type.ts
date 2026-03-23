import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InferType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class InferTypeBuilder extends BaseBuilder<InferType> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('infer');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InferType {
    return {
      kind: 'infer_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as InferType;
  }

  override get nodeKind(): string { return 'infer_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'infer', type: 'infer' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function infer_type(children: Child[]): InferTypeBuilder {
  return new InferTypeBuilder(children);
}
