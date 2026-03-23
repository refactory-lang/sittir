import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InferType, TypeIdentifier } from '../types.js';


class InferTypeBuilder extends Builder<InferType> {
  private _children: Builder<TypeIdentifier>[] = [];

  constructor(...children: Builder<TypeIdentifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('infer');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InferType {
    return {
      kind: 'infer_type',
      children: this._children.map(c => c.build(ctx)),
    } as InferType;
  }

  override get nodeKind(): string { return 'infer_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'infer', type: 'infer' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { InferTypeBuilder };

export function infer_type(...children: Builder<TypeIdentifier>[]): InferTypeBuilder {
  return new InferTypeBuilder(...children);
}

export interface InferTypeOptions {
  children: Builder<TypeIdentifier> | (Builder<TypeIdentifier>)[];
}

export namespace infer_type {
  export function from(options: InferTypeOptions): InferTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new InferTypeBuilder(..._arr);
    return b;
  }
}
