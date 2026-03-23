import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AddingTypeAnnotation } from '../types.js';


class AddingTypeAnnotationBuilder extends Builder<AddingTypeAnnotation> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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

export type { AddingTypeAnnotationBuilder };

export function adding_type_annotation(children: Builder): AddingTypeAnnotationBuilder {
  return new AddingTypeAnnotationBuilder(children);
}

export interface AddingTypeAnnotationOptions {
  children: Builder | (Builder)[];
}

export namespace adding_type_annotation {
  export function from(options: AddingTypeAnnotationOptions): AddingTypeAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AddingTypeAnnotationBuilder(_ctor);
    return b;
  }
}
