import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptingTypeAnnotation } from '../types.js';


class OptingTypeAnnotationBuilder extends BaseBuilder<OptingTypeAnnotation> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('?:');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OptingTypeAnnotation {
    return {
      kind: 'opting_type_annotation',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OptingTypeAnnotation;
  }

  override get nodeKind(): string { return 'opting_type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '?:', type: '?:' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function opting_type_annotation(children: BaseBuilder): OptingTypeAnnotationBuilder {
  return new OptingTypeAnnotationBuilder(children);
}
