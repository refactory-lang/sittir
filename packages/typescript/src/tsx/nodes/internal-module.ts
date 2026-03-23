import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, InternalModule, NestedIdentifier, StatementBlock } from '../types.js';


class InternalModuleBuilder extends Builder<InternalModule> {
  private _body?: Builder<StatementBlock>;
  private _name: Builder<Identifier | NestedIdentifier>;

  constructor(name: Builder<Identifier | NestedIdentifier>) {
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
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
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

export function internal_module(name: Builder<Identifier | NestedIdentifier>): InternalModuleBuilder {
  return new InternalModuleBuilder(name);
}

export interface InternalModuleOptions {
  body?: Builder<StatementBlock>;
  name: Builder<Identifier | NestedIdentifier>;
}

export namespace internal_module {
  export function from(options: InternalModuleOptions): InternalModuleBuilder {
    const b = new InternalModuleBuilder(options.name);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
