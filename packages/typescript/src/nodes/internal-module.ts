import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, InternalModule, NestedIdentifier, StatementBlock, String } from '../types.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class InternalModuleBuilder extends Builder<InternalModule> {
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
    parts.push('namespace');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InternalModule {
    return {
      kind: 'internal_module',
      name: this._name.build(ctx),
      body: this._body?.build(ctx),
    } as InternalModule;
  }

  override get nodeKind(): string { return 'internal_module'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'namespace', type: 'namespace' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { InternalModuleBuilder };

export function internal_module(name: Builder<String | Identifier | NestedIdentifier>): InternalModuleBuilder {
  return new InternalModuleBuilder(name);
}

export interface InternalModuleOptions {
  name: Builder<String | Identifier | NestedIdentifier> | string;
  body?: Builder<StatementBlock> | StatementBlockOptions;
}

export namespace internal_module {
  export function from(options: InternalModuleOptions): InternalModuleBuilder {
    const _ctor = options.name;
    const b = new InternalModuleBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v as StatementBlockOptions));
    }
    return b;
  }
}
