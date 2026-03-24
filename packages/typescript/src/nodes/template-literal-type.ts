import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { StringFragment, TemplateLiteralType, TemplateType } from '../types.js';
import { template_type } from './template-type.js';
import type { TemplateTypeOptions } from './template-type.js';


class TemplateLiteralTypeBuilder extends Builder<TemplateLiteralType> {
  private _children: Builder<StringFragment | TemplateType>[] = [];

  constructor() { super(); }

  children(...value: Builder<StringFragment | TemplateType>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('`');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('`');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TemplateLiteralType {
    return {
      kind: 'template_literal_type',
      children: this._children.map(c => c.build(ctx)),
    } as TemplateLiteralType;
  }

  override get nodeKind(): 'template_literal_type' { return 'template_literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '`', type: '`' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '`', type: '`' });
    return parts;
  }
}

export type { TemplateLiteralTypeBuilder };

export function template_literal_type(): TemplateLiteralTypeBuilder {
  return new TemplateLiteralTypeBuilder();
}

export interface TemplateLiteralTypeOptions {
  nodeKind: 'template_literal_type';
  children?: Builder<StringFragment | TemplateType> | string | Omit<TemplateTypeOptions, 'nodeKind'> | (Builder<StringFragment | TemplateType> | string | Omit<TemplateTypeOptions, 'nodeKind'>)[];
}

export namespace template_literal_type {
  export function from(input: Omit<TemplateLiteralTypeOptions, 'nodeKind'> | Builder<StringFragment | TemplateType> | string | Omit<TemplateTypeOptions, 'nodeKind'> | (Builder<StringFragment | TemplateType> | string | Omit<TemplateTypeOptions, 'nodeKind'>)[]): TemplateLiteralTypeBuilder {
    const options: Omit<TemplateLiteralTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TemplateLiteralTypeOptions, 'nodeKind'>
      : { children: input } as Omit<TemplateLiteralTypeOptions, 'nodeKind'>;
    const b = new TemplateLiteralTypeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('string_fragment', _x) : _x instanceof Builder ? _x : template_type.from(_x)));
    }
    return b;
  }
}
