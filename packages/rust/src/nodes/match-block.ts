import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchArm, MatchBlock } from '../types.js';


class MatchBlockBuilder extends Builder<MatchBlock> {
  private _children: Builder<MatchArm>[] = [];

  constructor() { super(); }

  children(...value: Builder<MatchArm>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchBlock {
    return {
      kind: 'match_block',
      children: this._children.map(c => c.build(ctx)),
    } as MatchBlock;
  }

  override get nodeKind(): string { return 'match_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { MatchBlockBuilder };

export function match_block(): MatchBlockBuilder {
  return new MatchBlockBuilder();
}

export interface MatchBlockOptions {
  children?: Builder<MatchArm> | (Builder<MatchArm>)[];
}

export namespace match_block {
  export function from(options: MatchBlockOptions): MatchBlockBuilder {
    const b = new MatchBlockBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
