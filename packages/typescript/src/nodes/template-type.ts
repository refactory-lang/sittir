import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InferType, PrimaryType, TemplateType } from '../types.js';


class TemplateTypeBuilder extends Builder<TemplateType> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('${');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TemplateType {
    return {
      kind: 'template_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TemplateType;
  }

  override get nodeKind(): string { return 'template_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '${', type: '${' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { TemplateTypeBuilder };

export function template_type(children: Builder): TemplateTypeBuilder {
  return new TemplateTypeBuilder(children);
}

export interface TemplateTypeOptions {
  children: Builder<InferType | PrimaryType> | (Builder<InferType | PrimaryType>)[];
}

export namespace template_type {
  export function from(options: TemplateTypeOptions): TemplateTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TemplateTypeBuilder(_ctor);
    return b;
  }
}
