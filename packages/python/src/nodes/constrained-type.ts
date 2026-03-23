import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstrainedType } from '../types.js';


class ConstrainedTypeBuilder extends Builder<ConstrainedType> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push(':');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstrainedType {
    return {
      kind: 'constrained_type',
      children: this._children.map(c => c.build(ctx)),
    } as ConstrainedType;
  }

  override get nodeKind(): string { return 'constrained_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ConstrainedTypeBuilder };

export function constrained_type(...children: Builder[]): ConstrainedTypeBuilder {
  return new ConstrainedTypeBuilder(...children);
}

export interface ConstrainedTypeOptions {
  children: Builder | (Builder)[];
}

export namespace constrained_type {
  export function from(options: ConstrainedTypeOptions): ConstrainedTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ConstrainedTypeBuilder(..._arr);
    return b;
  }
}
