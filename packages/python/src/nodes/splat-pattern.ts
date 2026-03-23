import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, SplatPattern } from '../types.js';


class SplatPatternBuilder extends Builder<SplatPattern> {
  private _children: Builder<Identifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<Identifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SplatPattern {
    return {
      kind: 'splat_pattern',
      children: this._children[0]?.build(ctx),
    } as SplatPattern;
  }

  override get nodeKind(): string { return 'splat_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { SplatPatternBuilder };

export function splat_pattern(): SplatPatternBuilder {
  return new SplatPatternBuilder();
}

export interface SplatPatternOptions {
  children?: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace splat_pattern {
  export function from(options: SplatPatternOptions): SplatPatternBuilder {
    const b = new SplatPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('identifier', _x) : _x));
    }
    return b;
  }
}
