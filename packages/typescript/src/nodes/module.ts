import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, Module, NestedIdentifier, StatementBlock, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { nested_identifier } from './nested-identifier.js';
import type { NestedIdentifierOptions } from './nested-identifier.js';
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
      body: this._body ? this._body.build(ctx) : undefined,
    } as Module;
  }

  override get nodeKind(): 'module' { return 'module'; }

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
  nodeKind: 'module';
  name: Builder<String | Identifier | NestedIdentifier> | string | StringOptions | NestedIdentifierOptions;
  body?: Builder<StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>;
}

export namespace module {
  export function from(options: Omit<ModuleOptions, 'nodeKind'>): ModuleBuilder {
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
    const b = new ModuleBuilder(_ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v));
    }
    return b;
  }
}
