import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OmittingTypeAnnotation } from '../types.js';


class OmittingTypeAnnotationBuilder extends Builder<OmittingTypeAnnotation> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('-?:');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OmittingTypeAnnotation {
    return {
      kind: 'omitting_type_annotation',
      children: this._children[0]?.build(ctx),
    } as OmittingTypeAnnotation;
  }

  override get nodeKind(): string { return 'omitting_type_annotation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '-?:', type: '-?:' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { OmittingTypeAnnotationBuilder };

export function omitting_type_annotation(children: Builder): OmittingTypeAnnotationBuilder {
  return new OmittingTypeAnnotationBuilder(children);
}

export interface OmittingTypeAnnotationOptions {
  children: Builder | (Builder)[];
}

export namespace omitting_type_annotation {
  export function from(options: OmittingTypeAnnotationOptions): OmittingTypeAnnotationBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new OmittingTypeAnnotationBuilder(_ctor);
    return b;
  }
}
