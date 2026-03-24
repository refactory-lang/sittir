import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { HashBangLine, Program, Statement } from '../types.js';


class ProgramBuilder extends Builder<Program> {
  private _children: Builder<HashBangLine | Statement>[] = [];

  constructor() { super(); }

  children(...value: Builder<HashBangLine | Statement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Program {
    return {
      kind: 'program',
      children: this._children.map(c => c.build(ctx)),
    } as Program;
  }

  override get nodeKind(): 'program' { return 'program'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ProgramBuilder };

export function program(): ProgramBuilder {
  return new ProgramBuilder();
}

export interface ProgramOptions {
  nodeKind: 'program';
  children?: Builder<HashBangLine | Statement> | string | (Builder<HashBangLine | Statement> | string)[];
}

export namespace program {
  export function from(input: Omit<ProgramOptions, 'nodeKind'> | Builder<HashBangLine | Statement> | string | (Builder<HashBangLine | Statement> | string)[]): ProgramBuilder {
    const options: Omit<ProgramOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ProgramOptions, 'nodeKind'>
      : { children: input } as Omit<ProgramOptions, 'nodeKind'>;
    const b = new ProgramBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('hash_bang_line', _x) : _x));
    }
    return b;
  }
}
