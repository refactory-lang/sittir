import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OmittingTypeAnnotation } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class OmittingTypeAnnotationBuilder extends BaseBuilder<OmittingTypeAnnotation> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OmittingTypeAnnotation {
    return {
      kind: 'omitting_type_annotation',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OmittingTypeAnnotation;
  }

  override get nodeKind(): string { return 'omitting_type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function omitting_type_annotation(children: Child): OmittingTypeAnnotationBuilder {
  return new OmittingTypeAnnotationBuilder(children);
}
