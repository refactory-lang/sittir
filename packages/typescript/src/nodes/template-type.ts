import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InferType, PrimaryType, TemplateType } from '../types.js';


class TemplateTypeBuilder extends Builder<TemplateType> {
  private _children: Builder<PrimaryType | InferType>[] = [];

  constructor(...children: Builder<PrimaryType | InferType>[]) {
    super();
    this._children = children;
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
      children: this._children.map(c => c.build(ctx)),
    } as TemplateType;
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

export function template_type(...children: Builder<PrimaryType | InferType>[]): TemplateTypeBuilder {
  return new TemplateTypeBuilder(...children);
}

export interface TemplateTypeOptions {
  children?: Builder<PrimaryType | InferType> | (Builder<PrimaryType | InferType>)[];
}

export namespace template_type {
  export function from(options: TemplateTypeOptions): TemplateTypeBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TemplateTypeBuilder(..._arr);
    return b;
  }
}
