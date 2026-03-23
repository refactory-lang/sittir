import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchArm, MatchBlock } from '../types.js';


class MatchBlockBuilder extends Builder<MatchBlock> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchBlock {
    return {
      kind: 'match_block',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MatchBlock;
  }

  override get nodeKind(): string { return 'match_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
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
