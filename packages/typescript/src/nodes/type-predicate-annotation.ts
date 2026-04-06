import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypePredicateAnnotation } from '../types.js';


class TypePredicateAnnotationBuilder extends BaseBuilder<TypePredicateAnnotation> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypePredicateAnnotation {
    return {
      kind: 'type_predicate_annotation',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypePredicateAnnotation;
  }

  override get nodeKind(): string { return 'type_predicate_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function type_predicate_annotation(children: BaseBuilder): TypePredicateAnnotationBuilder {
  return new TypePredicateAnnotationBuilder(children);
}
