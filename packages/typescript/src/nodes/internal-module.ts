import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, InternalModule, NestedIdentifier, StatementBlock, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { nested_identifier } from './nested-identifier.js';
import type { NestedIdentifierOptions } from './nested-identifier.js';
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
      body: this._body ? this._body.build(ctx) : undefined,
    } as InternalModule;
  }

  override get nodeKind(): 'internal_module' { return 'internal_module'; }

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
  nodeKind: 'internal_module';
  name: Builder<String | Identifier | NestedIdentifier> | string | StringOptions | NestedIdentifierOptions;
  body?: Builder<StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>;
}

export namespace internal_module {
  export function from(options: Omit<InternalModuleOptions, 'nodeKind'>): InternalModuleBuilder {
    const _raw = options.name;
    let _ctor: Builder<String | Identifier | NestedIdentifier>;
    if (typeof _raw === 'string') {
      _ctor = new LeafBuilder('identifier', _raw);
    } else if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'string': _ctor = string.from(_raw); break;
        case 'nested_identifier': _ctor = nested_identifier.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new InternalModuleBuilder(_ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v));
    }
    return b;
  }
}
