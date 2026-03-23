import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AddingTypeAnnotation } from '../types.js';


class AddingTypeAnnotationBuilder extends BaseBuilder<AddingTypeAnnotation> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('+?:');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AddingTypeAnnotation {
    return {
      kind: 'adding_type_annotation',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AddingTypeAnnotation;
  }

  override get nodeKind(): string { return 'adding_type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '+?:', type: '+?:' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function adding_type_annotation(children: BaseBuilder): AddingTypeAnnotationBuilder {
  return new AddingTypeAnnotationBuilder(children);
}
