import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MacroDefinition } from '../types.js';


class MacroDefinitionBuilder extends BaseBuilder<MacroDefinition> {
  private _name: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('macro_rules!');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export function macro_definition(name: BaseBuilder): MacroDefinitionBuilder {
  return new MacroDefinitionBuilder(name);
}
