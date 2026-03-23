import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypePredicate, TypePredicateAnnotation } from '../types.js';


class TypePredicateAnnotationBuilder extends Builder<TypePredicateAnnotation> {
  private _children: Builder<TypePredicate>[] = [];

  constructor(children: Builder<TypePredicate>) {
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
      children: this._children[0]?.build(ctx),
    } as TypePredicateAnnotation;
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

export type { TypePredicateAnnotationBuilder };

export function type_predicate_annotation(children: Builder<TypePredicate>): TypePredicateAnnotationBuilder {
  return new TypePredicateAnnotationBuilder(children);
}

export interface TypePredicateAnnotationOptions {
  children: Builder<TypePredicate> | (Builder<TypePredicate>)[];
}

export namespace type_predicate_annotation {
  export function from(options: TypePredicateAnnotationOptions): TypePredicateAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TypePredicateAnnotationBuilder(_ctor);
    return b;
  }
}
