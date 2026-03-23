import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AssertsAnnotationBuilder extends BaseBuilder<AssertsAnnotation> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssertsAnnotation {
    return {
      kind: 'asserts_annotation',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AssertsAnnotation;
  }

  override get nodeKind(): string { return 'asserts_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function asserts_annotation(children: Child): AssertsAnnotationBuilder {
  return new AssertsAnnotationBuilder(children);
}
