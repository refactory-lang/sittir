import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, SplatType } from '../types.js';


class SplatTypeBuilder extends Builder<SplatType> {
  private _children: Builder<Identifier>[] = [];

  constructor(children: Builder<Identifier>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SplatType {
    return {
      kind: 'splat_type',
      children: this._children[0]?.build(ctx),
    } as SplatType;
  }

  override get nodeKind(): string { return 'splat_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { SplatTypeBuilder };

export function splat_type(children: Builder<Identifier>): SplatTypeBuilder {
  return new SplatTypeBuilder(children);
}

export interface SplatTypeOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace splat_type {
  export function from(options: SplatTypeOptions): SplatTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new SplatTypeBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    return b;
  }
}
