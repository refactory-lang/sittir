import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, MacroDefinition, MacroRule } from '../types.js';


class MacroDefinitionBuilder extends Builder<MacroDefinition> {
  private _name: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('macro_rules!');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('(');
    if (this._children.length === 1) {
      parts.push(';');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' ; ', ctx));
    }
    parts.push(')');
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MacroDefinition {
    return {
      kind: 'macro_definition',
      name: this.renderChild(this._name, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MacroDefinition;
  }

  override get nodeKind(): string { return 'macro_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'macro_rules!', type: 'macro_rules!' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ';', type: ';' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { MacroDefinitionBuilder };

export function macro_definition(name: Builder): MacroDefinitionBuilder {
  return new MacroDefinitionBuilder(name);
}

export interface MacroDefinitionOptions {
  name: Builder<Identifier> | string;
  children?: Builder<MacroRule> | (Builder<MacroRule>)[];
}

export namespace macro_definition {
  export function from(options: MacroDefinitionOptions): MacroDefinitionBuilder {
    const _ctor = options.name;
    const b = new MacroDefinitionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
