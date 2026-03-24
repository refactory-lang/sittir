import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InferType, PrimaryType, TemplateType } from '../types.js';
import { infer_type } from './infer-type.js';
import type { InferTypeOptions } from './infer-type.js';


class TemplateTypeBuilder extends Builder<TemplateType> {
  private _children: Builder<PrimaryType | InferType>[] = [];

  constructor(children: Builder<PrimaryType | InferType>) {
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
      children: this._children[0]!.build(ctx),
    } as TemplateType;
  }

  override get nodeKind(): 'template_type' { return 'template_type'; }

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

export function template_type(children: Builder<PrimaryType | InferType>): TemplateTypeBuilder {
  return new TemplateTypeBuilder(children);
}

export interface TemplateTypeOptions {
  nodeKind: 'template_type';
  children: Builder<PrimaryType | InferType> | Omit<InferTypeOptions, 'nodeKind'> | (Builder<PrimaryType | InferType> | Omit<InferTypeOptions, 'nodeKind'>)[];
}

export namespace template_type {
  export function from(input: Omit<TemplateTypeOptions, 'nodeKind'> | Builder<PrimaryType | InferType> | Omit<InferTypeOptions, 'nodeKind'> | (Builder<PrimaryType | InferType> | Omit<InferTypeOptions, 'nodeKind'>)[]): TemplateTypeBuilder {
    const options: Omit<TemplateTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TemplateTypeOptions, 'nodeKind'>
      : { children: input } as Omit<TemplateTypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TemplateTypeBuilder(_ctor instanceof Builder ? _ctor : infer_type.from(_ctor));
    return b;
  }
}
