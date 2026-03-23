import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, Module, NestedIdentifier, StatementBlock, String } from '../types.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class ModuleBuilder extends Builder<Module> {
  private _name: Builder<String | Identifier | NestedIdentifier>;
  private _body?: Builder<StatementBlock>;

  constructor(name: Builder<String | Identifier | NestedIdentifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<StatementBlock>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('module');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Module {
    return {
      kind: 'module',
      name: this._name.build(ctx),
      body: this._body?.build(ctx),
    } as Module;
  }

  override get nodeKind(): string { return 'module'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'module', type: 'module' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ModuleBuilder };

export function module(name: Builder<String | Identifier | NestedIdentifier>): ModuleBuilder {
  return new ModuleBuilder(name);
}

export interface ModuleOptions {
  name: Builder<String | Identifier | NestedIdentifier> | string;
  body?: Builder<StatementBlock> | StatementBlockOptions;
}

export namespace module {
  export function from(options: ModuleOptions): ModuleBuilder {
    const _ctor = options.name;
    const b = new ModuleBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v as StatementBlockOptions));
    }
    return b;
  }
}
