import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CompoundStatement, Module, SimpleStatement } from '../types.js';


class ModuleBuilder extends Builder<Module> {
  private _children: Builder<CompoundStatement | SimpleStatement>[] = [];

  constructor() { super(); }

  children(...value: Builder<CompoundStatement | SimpleStatement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Module {
    return {
      kind: 'module',
      children: this._children.map(c => c.build(ctx)),
    } as Module;
  }

  override get nodeKind(): string { return 'module'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ModuleBuilder };

export function module(): ModuleBuilder {
  return new ModuleBuilder();
}

export interface ModuleOptions {
  children?: Builder<CompoundStatement | SimpleStatement> | (Builder<CompoundStatement | SimpleStatement>)[];
}

export namespace module {
  export function from(options: ModuleOptions): ModuleBuilder {
    const b = new ModuleBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
