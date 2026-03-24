import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchArm, MatchBlock } from '../types.js';
import { match_arm } from './match-arm.js';
import type { MatchArmOptions } from './match-arm.js';


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
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchBlock {
    return {
      kind: 'match_block',
      children: this._children.map(c => c.build(ctx)),
    } as MatchBlock;
  }

  override get nodeKind(): 'match_block' { return 'match_block'; }

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
  nodeKind: 'match_block';
  children?: Builder<MatchArm> | Omit<MatchArmOptions, 'nodeKind'> | (Builder<MatchArm> | Omit<MatchArmOptions, 'nodeKind'>)[];
}

export namespace match_block {
  export function from(input: Omit<MatchBlockOptions, 'nodeKind'> | Builder<MatchArm> | Omit<MatchArmOptions, 'nodeKind'> | (Builder<MatchArm> | Omit<MatchArmOptions, 'nodeKind'>)[]): MatchBlockBuilder {
    const options: Omit<MatchBlockOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<MatchBlockOptions, 'nodeKind'>
      : { children: input } as Omit<MatchBlockOptions, 'nodeKind'>;
    const b = new MatchBlockBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : match_arm.from(_x)));
    }
    return b;
  }
}
