import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, CaseClause, CompoundStatement, SimpleStatement } from '../types.js';


class BlockBuilder extends Builder<Block> {
  private _alternative: Builder<CaseClause>[] = [];
  private _children: Builder<CompoundStatement | SimpleStatement>[] = [];

  constructor() { super(); }

  alternative(...value: Builder<CaseClause>[]): this {
    this._alternative = value;
    return this;
  }

  children(...value: Builder<CompoundStatement | SimpleStatement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._alternative.length > 0) parts.push(this.renderChildren(this._alternative, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Block {
    return {
      kind: 'block',
      alternative: this._alternative.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as Block;
  }

  override get nodeKind(): string { return 'block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    for (const child of this._alternative) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'alternative' });
    }
    return parts;
  }
}

export type { BlockBuilder };

export function block(): BlockBuilder {
  return new BlockBuilder();
}

export interface BlockOptions {
  alternative?: Builder<CaseClause> | (Builder<CaseClause>)[];
  children?: Builder<CompoundStatement | SimpleStatement> | (Builder<CompoundStatement | SimpleStatement>)[];
}

export namespace block {
  export function from(options: BlockOptions): BlockBuilder {
    const b = new BlockBuilder();
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.alternative(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
