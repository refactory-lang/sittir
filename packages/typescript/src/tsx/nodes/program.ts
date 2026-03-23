import { Builder } from '@sittir/types';
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

  override get nodeKind(): string { return 'program'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ProgramBuilder };

export function file(): ProgramBuilder {
  return new ProgramBuilder();
}

export interface ProgramOptions {
  children?: Builder<HashBangLine | Statement> | (Builder<HashBangLine | Statement>)[];
}

export namespace file {
  export function from(options: ProgramOptions): ProgramBuilder {
    const b = new ProgramBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
