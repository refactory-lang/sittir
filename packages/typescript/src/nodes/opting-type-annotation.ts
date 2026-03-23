import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptingTypeAnnotation, Type } from '../types.js';


class OptingTypeAnnotationBuilder extends Builder<OptingTypeAnnotation> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
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
      children: this._children[0]?.build(ctx),
    } as OptingTypeAnnotation;
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

export type { OptingTypeAnnotationBuilder };

export function opting_type_annotation(children: Builder<Type>): OptingTypeAnnotationBuilder {
  return new OptingTypeAnnotationBuilder(children);
}

export interface OptingTypeAnnotationOptions {
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace opting_type_annotation {
  export function from(options: OptingTypeAnnotationOptions): OptingTypeAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new OptingTypeAnnotationBuilder(_ctor);
    return b;
  }
}
